"""
routes.py
---------
URLとHTTPメソッドの定義だけを行う。ビジネスロジック・SQLは models.py 側。

権限の考え方:
  - 市民・公開ビューは「ログイン不要」。誰でも報告の作成・閲覧ができる
    （匿名投稿を前提にしているため）。
  - 管理者（自治体職員）ビューのみ Flask の session でログインを要求する。
    ログインしていない相手には reporter（通報者名）・assignee（担当者名）を
    レスポンスから取り除き、状態変更(PATCH)も拒否する。
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


# ----------------------------- 認証 -----------------------------

@api.post("/auth/login")
def login():
    data = request.get_json(force=True) or {}
    user = models.verify_staff_login(data.get("username", ""), data.get("password", ""))
    if user is None:
        return jsonify({"error": "ユーザー名またはパスワードが正しくありません"}), 401

    session["staff_username"] = user["username"]
    session["staff_display_name"] = user["displayName"]
    session["staff_municipality"] = user["municipality"]
    return jsonify(user)


@api.post("/auth/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@api.get("/auth/me")
def me():
    return jsonify(current_staff())


# ----------------------------- 報告 -----------------------------

@api.get("/reports")
def get_reports():
    category = request.args.get("category")
    status = request.args.get("status")
    search = request.args.get("search")
    reporter = request.args.get("reporter")  # role=citizen のとき自分の分だけ絞る用
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
