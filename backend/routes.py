"""
routes.py
---------
URLとHTTPメソッドの定義だけを行う。ビジネスロジック・SQLは models.py 側。

権限の考え方（2種類のログインが存在する）:
  - 市民ログイン（/api/auth/citizen/...）
      ユーザーIDとパスワードだけで誰でも登録できる（メールアドレス不要）。
      ログインしなくても閲覧はできるが、報告を送ると「ゲスト投稿」扱いになる。
      ログインすると、自分が送った報告に実際のユーザーIDが紐付く。
  - 管理者ログイン（/api/auth/staff/...）
      自治体職員用。アカウントは事前にDBへ投入されたものだけ（自己登録不可）。
      ログインしていない相手には reporter（通報者ID）・assignee（担当者名）を
      レスポンスから取り除き、状態変更(PATCH)も拒否する。

報告の一覧・地図は、役割を問わず常に全件を返す（市民協働で課題を
共有することがこのアプリの目的のため）。役割によって変わるのは
「どの項目が見えるか」と「投稿者名として何が記録されるか」だけ。
"""

from flask import Blueprint, jsonify, request, session

import models

api = Blueprint("api", __name__, url_prefix="/api")


def is_staff():
    return bool(session.get("staff_username"))


def current_staff():
    if not is_staff():
        return None
    return {
        "username": session.get("staff_username"),
        "displayName": session.get("staff_display_name"),
        "municipality": session.get("staff_municipality"),
    }


def current_citizen():
    if not session.get("citizen_username"):
        return None
    return {"username": session.get("citizen_username")}


# ----------------------------- 市民ログイン -----------------------------

@api.post("/auth/citizen/signup")
def citizen_signup():
    data = request.get_json(force=True) or {}
    try:
        user = models.create_user(data.get("username", ""), data.get("password", ""))
    except ValueError as e:
        # 「このユーザーIDは既に使われています」等は 409 Conflict として返す
        return jsonify({"error": str(e)}), 409

    session["citizen_username"] = user["username"]
    return jsonify(user), 201


@api.post("/auth/citizen/login")
def citizen_login():
    data = request.get_json(force=True) or {}
    user = models.verify_user_login(data.get("username", ""), data.get("password", ""))
    if user is None:
        return jsonify({"error": "ユーザーIDまたはパスワードが正しくありません"}), 401

    session["citizen_username"] = user["username"]
    return jsonify(user)


@api.post("/auth/citizen/logout")
def citizen_logout():
    session.pop("citizen_username", None)
    return jsonify({"ok": True})


# ----------------------------- 管理者ログイン -----------------------------

@api.post("/auth/staff/login")
def staff_login():
    data = request.get_json(force=True) or {}
    user = models.verify_staff_login(data.get("username", ""), data.get("password", ""))
    if user is None:
        return jsonify({"error": "ユーザー名またはパスワードが正しくありません"}), 401

    session["staff_username"] = user["username"]
    session["staff_display_name"] = user["displayName"]
    session["staff_municipality"] = user["municipality"]
    return jsonify(user)


@api.post("/auth/staff/logout")
def staff_logout():
    session.pop("staff_username", None)
    session.pop("staff_display_name", None)
    session.pop("staff_municipality", None)
    return jsonify({"ok": True})


@api.get("/auth/me")
def me():
    return jsonify({"citizen": current_citizen(), "staff": current_staff()})


# ----------------------------- 報告 -----------------------------

@api.get("/reports")
def get_reports():
    """役割を問わず常に全件を返す（フィルタは category/status/search のみ）。
    reporter での絞り込みは「自分の報告のみ表示」トグル用に残しておく。"""
    category = request.args.get("category")
    status = request.args.get("status")
    search = request.args.get("search")
    reporter = request.args.get("reporter")
    reports = models.list_reports(category=category, status=status, search=search, reporter=reporter)

    if not is_staff():
        reports = [models.strip_sensitive_fields(r) for r in reports]
    return jsonify(reports)


@api.get("/reports/<report_id>")
def get_report(report_id):
    report = models.get_report(report_id)
    if report is None:
        return jsonify({"error": "not found"}), 404
    if not is_staff():
        report = models.strip_sensitive_fields(report)
    return jsonify(report)


@api.post("/reports")
def create_report():
    data = request.get_json(force=True) or {}
    citizen = current_citizen()
    # ログイン済みなら実際のユーザーIDを、未ログインなら「ゲスト投稿」として記録する。
    data["reporter"] = citizen["username"] if citizen else "ゲスト投稿"

    try:
        report = models.create_report(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(report), 201


@api.patch("/reports/<report_id>/status")
def update_status(report_id):
    if not is_staff():
        return jsonify({"error": "この操作には管理者ログインが必要です"}), 401

    data = request.get_json(force=True) or {}
    assignee = data.get("assignee") or session.get("staff_display_name")
    try:
        report = models.update_status(report_id, data.get("status"), assignee)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    if report is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(report)


@api.get("/stats")
def get_stats():
    reporter = request.args.get("reporter")
    return jsonify(models.get_stats(reporter_filter=reporter))
