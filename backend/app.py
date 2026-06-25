"""
app.py
------
サーバーの起動だけを行うエントリポイント。
  - DB初期化
  - APIルートの登録 (routes.py)
  - frontend/ 配下の静的ファイル配信

起動: python app.py
"""

from flask import Flask, send_from_directory
import os
from dotenv import load_dotenv

from database import init_db
from routes import api

# backend/.env があれば読み込む（無くてもエラーにはならない）
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(__name__, static_folder=None)

# セッション（管理者ログイン状態の保持）に使う署名キー。
# 本番運用時は必ず .env または環境変数 SECRET_KEY で上書きすること。
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    if os.environ.get("FLASK_ENV") == "production":
        raise RuntimeError("本番環境ではSECRET_KEYの設定が必須です。.envを確認してください。")
    SECRET_KEY = "dev-secret-key-change-me-before-production"
    print("[警告] SECRET_KEYが未設定のため開発用の既定値を使用しています。本番では必ず.envで設定してください。")
app.secret_key = SECRET_KEY

app.register_blueprint(api)

# DB初期化はモジュール読み込み時に実行する。
# こうしておくと `python app.py` だけでなく、本番で
# `gunicorn app:app` のように起動した場合でもDBが用意される。
init_db()


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/<path:path>")
def static_files(path):
    # css/js などフロントエンドの静的ファイルをそのまま返す
    return send_from_directory(FRONTEND_DIR, path)


if __name__ == "__main__":
    print("DB ready. Starting server at http://localhost:5050")
    # 開発時のみ debug=True（自動リロード・デバッガ）。本番はgunicorn経由で起動するため、
    # ここは通らない。
    app.run(host="0.0.0.0", port=5050, debug=True)
