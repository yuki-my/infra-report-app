"""
database.py
-----------
SQLiteへの接続とテーブル定義、初回起動時のシードデータ投入を担当する。
他のファイル（models.py）はこのモジュールが提供する get_db() 経由でのみ
データベースに触れる。スキーマの変更はこのファイルだけを見ればよい。
"""

import sqlite3
import os
import time
import uuid

# 本番（Render等）では永続ディスクのパスを DB_PATH 環境変数で指定する。
# 未設定時はこのファイルと同じフォルダに作成する（ローカル開発用）。
DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "infra_report.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS reports (
    id            TEXT PRIMARY KEY,
    lat           REAL NOT NULL,
    lng           REAL NOT NULL,
    category      TEXT NOT NULL,      -- road / guardrail / vegetation / dumping / light / noise
    part          TEXT NOT NULL,      -- 構造物の部位
    title         TEXT NOT NULL,
    address       TEXT NOT NULL,
    address_note  TEXT DEFAULT '',
    comment       TEXT DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'received', -- received / in_review / in_progress / done
    reporter      TEXT NOT NULL,
    assignee      TEXT,
    photo         TEXT,               -- base64 dataURL（簡易プロトタイプ用。本番はファイルストレージ/Autodesk OSS等を推奨）
    created_at    INTEGER NOT NULL,   -- unixtime(ms)
    updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);

CREATE TABLE IF NOT EXISTS staff_users (
    username       TEXT PRIMARY KEY,
    password_hash  TEXT NOT NULL,
    display_name   TEXT NOT NULL,     -- 例: 「道路課 佐藤」
    municipality   TEXT NOT NULL      -- 例: 「世田谷区」
);
"""

AREAS = [
    "世田谷区 北沢", "世田谷区 三軒茶屋", "世田谷区 若林",
    "瑞穂町 箱根ケ崎", "瑞穂町 元狭山",
]


def get_db():
    """呼び出しごとに新しい接続を返す（Flaskのリクエストごとに開閉する想定）。"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """テーブルが無ければ作成し、データが0件ならシードを投入する。"""
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()

    count = conn.execute("SELECT COUNT(*) AS c FROM reports").fetchone()["c"]
    if count == 0:
        _seed(conn)

    staff_count = conn.execute("SELECT COUNT(*) AS c FROM staff_users").fetchone()["c"]
    if staff_count == 0:
        _seed_staff_users(conn)

    conn.close()


def _seed_staff_users(conn):
    """自治体職員アカウントの初期登録。

    環境変数で上書き可能（本番では必ず設定すること）:
      SETAGAYA_STAFF_PASSWORD, MIZUHO_STAFF_PASSWORD
    未設定の場合は開発用の既定パスワードを使う（公開リポジトリのままでの
    本番投入は厳禁）。
    """
    from werkzeug.security import generate_password_hash

    setagaya_pw = os.environ.get("SETAGAYA_STAFF_PASSWORD", "setagaya2026")
    mizuho_pw = os.environ.get("MIZUHO_STAFF_PASSWORD", "mizuho2026")

    demo_accounts = [
        ("setagaya_staff", setagaya_pw, "道路課 佐藤", "世田谷区"),
        ("mizuho_staff", mizuho_pw, "施設管理課 鈴木", "瑞穂町"),
    ]
    for username, password, display_name, municipality in demo_accounts:
        conn.execute(
            "INSERT INTO staff_users (username, password_hash, display_name, municipality) VALUES (?,?,?,?)",
            (username, generate_password_hash(password), display_name, municipality),
        )
    conn.commit()


def _seed(conn):
    now = int(time.time() * 1000)
    day = 86400000

    seed_rows = [
        # lat, lng, category, part, title, area_idx, comment, status, reporter, assignee, days_ago
        (35.6464, 139.6532, "road",       "車道",        "環七通り沿いの路面陥没",        0, "通行車両のタイヤがはまるほどの深さの陥没があります。", "in_progress", "あなた", "道路課 佐藤", 5),
        (35.6481, 139.6601, "guardrail",  "ガードレール", "歩道橋下のガードレール破損",     1, "車両との接触跡があり、先端が鋭利に曲がっています。", "received",    "市民B", None,          1),
        (35.6432, 139.6485, "vegetation", "信号機",      "街路樹で信号機が見えにくい",      2, "街路樹の枝が信号機の半分を覆っており、夜間特に見えにくいです。", "in_review", "市民C", "公園緑地課 田中", 3),
        (35.6510, 139.6555, "light",      "街路灯",      "若林交差点の街路灯が消灯",        2, "3日前から消灯したままです。",        "done",        "市民D", "施設管理課 鈴木", 10),
        (35.7660, 139.3480, "dumping",    "その他",      "公園裏に家電が投棄されている",    3, "家電製品が複数放置されています。",    "received",    "市民E", None,          2),
        (35.7691, 139.3522, "noise",      "公園設備",    "箱根ケ崎駅前の夜間騒音",          3, "夜間に工事のような音が続いています。", "in_review",   "市民F", None,          4),
        (35.7625, 139.3431, "road",       "歩道",        "元狭山交番前の道路ひび割れ",      4, "雨天時に水たまりができ歩行者が避けにくい状況です。", "received", "市民G", None,          1),
        (35.6455, 139.6610, "vegetation", "標識",        "遊歩道の枝が標識を覆っている",    1, "一方通行の標識が枝葉に隠れて見えません。",     "in_progress", "市民H", "公園緑地課 田中", 6),
        (35.6499, 139.6470, "light",      "街路灯",      "住宅街の街路灯故障",              0, "点滅を繰り返したのち消灯しました。",   "done",        "市民I", "施設管理課 鈴木", 12),
    ]

    for lat, lng, category, part, title, area_idx, comment, status, reporter, assignee, days_ago in seed_rows:
        created = now - days_ago * day
        conn.execute(
            """INSERT INTO reports
               (id, lat, lng, category, part, title, address, address_note, comment,
                status, reporter, assignee, photo, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (str(uuid.uuid4())[:8], lat, lng, category, part, title, AREAS[area_idx], "", comment,
             status, reporter, assignee, None, created, created),
        )
    conn.commit()


if __name__ == "__main__":
    # 単体実行で初期化だけ行いたい時用: python database.py
    init_db()
    print(f"initialized: {DB_PATH}")
