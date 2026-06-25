# インフラ報告プロトタイプ（SQLite版）

市民協働でまちのインフラ構造物の課題を可視化するアプリの試作版です。
データはSQLiteに保存され、Flaskが簡易APIを提供し、フロントエンド（素のJS）が
それを呼び出して画面を描画します。

## 動作環境

- Python 3.10以上（標準ライブラリの `sqlite3` を利用。追加インストール不要）
- Flask（同梱の `requirements.txt` でインストールできます）
- インターネット接続（地図タイル表示用に OpenStreetMap / cdnjs を読み込みます）

## 起動方法

```bash
cd backend
pip install -r requirements.txt
python app.py
```

起動後、ブラウザで **http://localhost:5050** を開いてください。
初回起動時に `backend/infra_report.db` が自動生成され、サンプルデータが9件投入されます。
（既にDBファイルがある場合は再生成されません。データをリセットしたい場合は
`backend/infra_report.db` を削除してから再起動してください。）

## フォルダ構成

```
infra-report-app/
├── backend/
│   ├── app.py            … Flaskサーバーの起動だけを行うエントリポイント
│   ├── database.py       … SQLite接続・テーブル定義(CREATE TABLE)・シードデータ
│   ├── models.py         … データのCRUD関数（SQL文を書くのはここだけ）
│   ├── routes.py         … APIエンドポイントの定義（/api/reports など）
│   ├── requirements.txt
│   └── infra_report.db   … 初回起動時に自動生成されるSQLiteファイル
│
└── frontend/
    ├── index.html        … 画面の骨組みだけのHTML（中身はJSが描画）
    ├── css/
    │   └── style.css     … 全体のスタイル
    └── js/
        ├── icons.js       … アイコンSVGの定義
        ├── constants.js   … カテゴリ／状態／部位などの定義（バックエンドと値を一致させる）
        ├── state.js        … 画面の状態（役割・現在の画面・フィルタなど）
        ├── api.js          … バックエンドAPIへのfetch呼び出しをまとめたモジュール
        ├── main.js         … 画面切り替え・初期化・イベント結線
        └── views/
            ├── mapView.js       … 報告マップ画面（地図／リスト切替）
            ├── formView.js      … 新規報告フォーム
            ├── dashboardView.js … ダッシュボード（集計カード）
            ├── sheet.js         … 報告詳細のボトムシート
            └── roleSheet.js     … 役割切替・管理者ログインのシート
```

## API一覧

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/auth/citizen/signup` | 市民の新規登録（ユーザーID+パスワードのみ。重複IDは409エラー） |
| POST | `/api/auth/citizen/login` | 市民ログイン |
| POST | `/api/auth/citizen/logout` | 市民ログアウト |
| POST | `/api/auth/staff/login` | 自治体職員ログイン（事前登録アカウントのみ） |
| POST | `/api/auth/staff/logout` | 職員ログアウト |
| GET | `/api/auth/me` | ログイン状態の確認。`{citizen, staff}` 形式で返る（未ログインは`null`） |
| GET | `/api/reports` | 報告一覧（`category` `status` `search` `reporter` でフィルタ可。**役割を問わず常に全件が対象**。未ログインだと`reporter`/`assignee`は伏字） |
| GET | `/api/reports/<id>` | 報告1件の詳細（同上） |
| POST | `/api/reports` | 新規報告の作成（市民ログイン中なら自分のIDが、未ログインなら「ゲスト投稿」が記録される） |
| PATCH | `/api/reports/<id>/status` | 状態の更新（**管理者ログインが必要**） |
| GET | `/api/stats` | 状態別の件数集計 |

## 権限（役割）について

画面右上の役割ピルをタップすると、役割切替シートが開きます。

- **市民** … ユーザーIDとパスワードだけで自分で登録できます（メールアドレス不要）。ログインしなくても閲覧・投稿はできますが、投稿は「ゲスト投稿」として記録されます。ログインすると、自分の投稿に実際のユーザーIDが紐付き、一覧で「自分」マークが表示されます。
- **公開ビュー** … ログイン不要。通報者ID・コメント本文・詳細な住所を伏せた状態で全件を閲覧できます。
- **管理者** … 自治体職員用。アカウントは自己登録できず、事前にDBへ投入されたものだけが使えます。

**報告の一覧・地図は、役割を問わず常に全件が対象です**（市民協働で課題を共有することがこのアプリの目的のため）。役割によって変わるのは「どの項目が見えるか」（通報者ID・担当者名はログイン済み管理者のみ）と「投稿者として何が記録されるか」だけです。

ログインしていない相手には、サーバー側で `reporter`（通報者ID）`assignee`（担当者名）を**レスポンスから取り除いた状態**で返します（フロント側の表示制御だけでなく、APIレスポンス自体に含まれません）。状態変更（`PATCH /status`）もログインしていないと401で拒否されます。

デモ用の職員アカウント（初回起動時にDBへ自動投入されます）:

| ユーザー名 | パスワード | 表示名 | 自治体 |
|---|---|---|---|
| `setagaya_staff` | `setagaya2026` | 道路課 佐藤 | 世田谷区 |
| `mizuho_staff` | `mizuho2026` | 施設管理課 鈴木 | 瑞穂町 |

市民アカウントはシードされません。アプリの「市民」→「新規登録」から誰でも自由に作成できます。

### 本番投入前に必ず対応すべき項目

- `backend/app.py` の `SECRET_KEY` を環境変数で必ず上書きする（コード内の既定値は開発用です）
- デモ用パスワードを変更する、またはアカウントをDBから作り直す
- HTTPS化（クッキー経由のセッションを保護するため必須）
- ログイン試行回数の制限（ブルートフォース対策）
- CSRF対策（状態変更系のPOST/PATCHエンドポイントへのトークン導入）

## 既知の簡略化（今後の発展ポイント）

- 写真は base64文字列としてDBの `photo` 列に直接保存しています。実運用では
  ファイルストレージ（Autodesk Platform Services の Object Storage Service など）
  に保存し、DBにはURLだけを持たせる構成を推奨します。
- 住所はクリック地点の緯度から簡易的に推定しているだけです（`nearestArea()`）。
  本番では逆ジオコーディングAPIや自治体のGISデータと連携してください。
- 現在は開発用サーバー（Flaskの `app.run`）で起動しています。本番公開時は
  gunicorn等のWSGIサーバー経由での起動に変更してください。

## GitHubへの公開 / 無料サーバーへのデプロイ（個人検証向け）

### GitHubに上げる

```bash
cd infra-report-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<あなたのアカウント>/infra-report-app.git
git branch -M main
git push -u origin main
```

`.gitignore` により `backend/infra_report.db`（データ）と `backend/.env`（秘密鍵・パスワード）は
リポジトリに含まれません。push前に `git status` で確認してください。

### Renderへのデプロイ（無料プランあり）

このリポジトリには `render.yaml` を同梱しているので、[Render](https://render.com) で
「New +」→「Blueprint」から このGitHubリポジトリを選ぶだけで、設定が自動的に読み込まれます。

デプロイ時に以下の環境変数を画面上で入力してください（`render.yaml` 側で値の入力欄が自動生成されます）：

- `SETAGAYA_STAFF_PASSWORD` … 世田谷区職員アカウントのパスワード
- `MIZUHO_STAFF_PASSWORD` … 瑞穂町職員アカウントのパスワード
- `SECRET_KEY` … Renderが自動生成するのでそのままで問題ありません

無料プランは一定時間アクセスが無いとスリープし、次のアクセス時に起動し直す仕様です（個人検証では問題になりにくいですが、レスポンスが最初の1回だけ遅くなります）。

**注意（無料プランの制約）**: Renderの無料プランは永続ディスクが使えないため、再デプロイやスリープからの復帰時に**SQLiteのデータ（投稿された報告）がリセットされ、シードデータの状態に戻ります**。個人検証・動作確認用と割り切って使ってください。データを永続化したい場合は、有料プラン（Starter以上）にして`render.yaml`に`disk`設定を追加するか、外部のマネージドDB（Render PostgreSQL等）に切り替える必要があります。

### Render以外の選択肢（参考）

| サービス | 特徴 |
|---|---|
| Railway | 無料枠は時間制限あり。設定がシンプル |
| Fly.io | 無料枠あり。永続ボリュームの扱いがやや独特 |
| 自前のVPS（さくらVPS、Lightsail等） | 完全な自由度。`gunicorn` + `nginx` + `systemd` での運用知識が必要 |

どれを使う場合でも、起動コマンドは共通で次の形になります（`$PORT` はサービスが指定するポート番号）：

```bash
cd backend
pip install -r requirements.txt
gunicorn -b 0.0.0.0:$PORT app:app
```

### ローカルで本番相当の起動を試す場合

```bash
cd backend
cp .env.example .env   # .envを作成し、中の値を実際のパスワード等に書き換える
pip install -r requirements.txt
gunicorn -b 0.0.0.0:5050 app:app
```

