"""
models.py
---------
SQLを書く場所はここだけ、というルールにするためのデータアクセス層。
routes.py はこのモジュールの関数だけを呼び、SQL文を直接書かない。
"""

import time
import uuid

from werkzeug.security import check_password_hash

from database import get_db

ALLOWED_CATEGORIES = {"road", "guardrail", "vegetation", "dumping", "light", "noise"}
ALLOWED_STATUSES = {"received", "in_review", "in_progress", "done"}


def row_to_dict(row):
    return {
        "id": row["id"],
        "lat": row["lat"],
        "lng": row["lng"],
        "category": row["category"],
        "part": row["part"],
        "title": row["title"],
        "address": row["address"],
        "addressNote": row["address_note"],
        "comment": row["comment"],
        "status": row["status"],
        "reporter": row["reporter"],
        "assignee": row["assignee"],
        "photo": row["photo"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def list_reports(category=None, status=None, search=None, reporter=None):
    """フィルタ条件に応じて報告一覧を返す（新しい順）。"""
    conn = get_db()
    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
    if status and status != "all":
        query += " AND status = ?"
        params.append(status)
    if reporter:
        query += " AND reporter = ?"
        params.append(reporter)
    if search:
        query += " AND (title LIKE ? OR address LIKE ?)"
        like = f"%{search}%"
        params.extend([like, like])

    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


def get_report(report_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    conn.close()
    return row_to_dict(row) if row else None


def create_report(data):
    """新規報告を作成する。最低限のサーバー側検証を行う。"""
    if data.get("category") not in ALLOWED_CATEGORIES:
        raise ValueError("invalid category")
    if not data.get("part"):
        raise ValueError("part is required")

    conn = get_db()
    now = int(time.time() * 1000)
    new_id = str(uuid.uuid4())[:8]

    conn.execute(
        """INSERT INTO reports
           (id, lat, lng, category, part, title, address, address_note, comment,
            status, reporter, assignee, photo, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            new_id,
            data.get("lat", 0),
            data.get("lng", 0),
            data["category"],
            data["part"],
            data.get("title") or "(無題)",
            data.get("address", "未設定エリア"),
            data.get("addressNote", ""),
            data.get("comment", ""),
            "received",
            data.get("reporter", "あなた"),
            None,
            data.get("photo"),
            now,
            now,
        ),
    )
    conn.commit()
    conn.close()
    return get_report(new_id)


def update_status(report_id, status, assignee=None):
    if status not in ALLOWED_STATUSES:
        raise ValueError("invalid status")

    conn = get_db()
    now = int(time.time() * 1000)
    if assignee is not None:
        conn.execute(
            "UPDATE reports SET status = ?, assignee = ?, updated_at = ? WHERE id = ?",
            (status, assignee, now, report_id),
        )
    else:
        conn.execute(
            "UPDATE reports SET status = ?, updated_at = ? WHERE id = ?",
            (status, now, report_id),
        )
    conn.commit()
    conn.close()
    return get_report(report_id)


def get_stats(reporter_filter=None):
    """状態ごとの件数を返す（ダッシュボードの集計カード用）。"""
    conn = get_db()
    query = "SELECT status, COUNT(*) AS c FROM reports"
    params = []
    if reporter_filter:
        query += " WHERE reporter = ?"
        params.append(reporter_filter)
    query += " GROUP BY status"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    counts = {s: 0 for s in ALLOWED_STATUSES}
    for r in rows:
        counts[r["status"]] = r["c"]
    return counts


def strip_sensitive_fields(report):
    """未ログインの相手に返す前に、通報者名・担当者名を取り除く。
    （管理者ログインしている場合のみ routes.py 側で呼ばずそのまま返す）"""
    safe = dict(report)
    safe["reporter"] = None
    safe["assignee"] = None
    return safe


def verify_staff_login(username, password):
    """職員アカウントの認証。成功時はユーザー情報(dict)、失敗時はNoneを返す。"""
    conn = get_db()
    row = conn.execute("SELECT * FROM staff_users WHERE username = ?", (username,)).fetchone()
    conn.close()

    if row is None:
        return None
    if not check_password_hash(row["password_hash"], password):
        return None

    return {
        "username": row["username"],
        "displayName": row["display_name"],
        "municipality": row["municipality"],
    }


def create_user(username, password):
    """市民アカウントを新規登録する。
    ユーザーIDが既に使われている場合は ValueError を投げる。"""
    username = (username or "").strip()
    password = password or ""

    if len(username) < 3 or len(username) > 20:
        raise ValueError("ユーザーIDは3〜20文字で入力してください")
    if " " in username:
        raise ValueError("ユーザーIDに空白は使用できません")
    if len(password) < 4:
        raise ValueError("パスワードは4文字以上で入力してください")

    conn = get_db()
    existing = conn.execute("SELECT username FROM users WHERE username = ?", (username,)).fetchone()
    if existing is not None:
        conn.close()
        raise ValueError("このユーザーIDは既に使われています")

    from werkzeug.security import generate_password_hash

    conn.execute(
        "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
        (username, generate_password_hash(password), int(time.time() * 1000)),
    )
    conn.commit()
    conn.close()
    return {"username": username}


def verify_user_login(username, password):
    """市民アカウントの認証。成功時は {username}、失敗時はNoneを返す。"""
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()

    if row is None:
        return None
    if not check_password_hash(row["password_hash"], password):
        return None
    return {"username": row["username"]}
