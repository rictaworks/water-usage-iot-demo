# water-usage-iot-demo

ESP32 フローセンサーで水の流量を計測し、Next.js + Cloudflare Workers（Hono）+ D1 のリアルタイムダッシュボードに表示する IoT デモシステム。

> **エディション: デモ版（ショーケース）**
> データは毎日 JST 03:00 に全削除されます。

---

## 開発環境でのアクセス

| 役割 | URL |
|------|-----|
| フロントエンド | http://localhost:3000 |
| バックエンド API（wrangler dev） | http://localhost:8787 |

### 自動ログイン（開発環境）

開発環境（`NODE_ENV=development`）では認証をスキップし、自動的にセッションが発行されます。
ログイン操作は不要です。ブラウザで http://localhost:3000 にアクセスするだけで利用できます。

---

## ページ一覧

| ページ名 | URL（開発） | 説明 |
|---------|-----------|------|
| ホーム | [http://localhost:3000](http://localhost:3000) | トップページ・セッション発行 |
| デバイス登録 | [http://localhost:3000/register](http://localhost:3000/register) | ESP32 デバイストークンの登録 |
| ダッシュボード | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) | リアルタイム流量グラフ・アラート表示 |
| シミュレーター | [http://localhost:3000/simulator](http://localhost:3000/simulator) | 仮想 ESP32 シナリオ再生（実機不要） |

---

## API 一覧

詳細仕様: [SPEC/api.md](SPEC/api.md)

| タイトル | エンドポイント URL（開発） |
|---------|------------------------|
| セッション発行・取得 | `GET http://localhost:8787/api/session` |
| デバイス登録 | `POST http://localhost:8787/api/devices` |
| 流量データ受信（ESP32 → サーバー） | `POST http://localhost:8787/api/readings` |
| SSE リアルタイムストリーム | `GET http://localhost:8787/api/stream` |
| シミュレーター開始 | `POST http://localhost:8787/api/simulator/start` |
| シミュレーター停止 | `POST http://localhost:8787/api/simulator/stop` |
| 日次リセット（Cron・管理者用） | `POST http://localhost:8787/api/admin/daily-reset` |

---

## クイックスタート

```bash
# フロントエンド（静的書き出しのビルドが wrangler の配信元 out/ を作る）
cd src/frontend
npm ci
npm run build

# バックエンド（Cloudflare Workers + D1、別ターミナル）
cd src/worker
npm ci
npm run db:migrate:local   # ローカル D1 にスキーマと初期シナリオを投入（--local のみ）
npm run dev                # wrangler dev（http://localhost:8787）

# フロントエンドの開発サーバー（別ターミナル。/api/* は 8787 へ転送される）
cd src/frontend
npm run dev
```

旧 Rails 版（`src/backend`）は履歴として残している。現在の API は `src/worker` が提供する。

詳細: [ENV/DEVELOPMENT.md](ENV/DEVELOPMENT.md)

---

## 本番環境

| 役割 | URL |
|------|-----|
| フロントエンド + API（Cloudflare Workers） | 移行中。カスタムドメインは本人の承認後に設定する |

- 旧環境（Vercel: `water-usage-iot-demo.rictaworks.jp` / Railway: `api.water-usage-iot-demo.rictaworks.jp`）は 2026-10-22 から停止中。
- デプロイは本人確認後に `wrangler deploy --env production` で行う。D1 データベースの作成と `database_id` の差し替え、`ADMIN_RESET_TOKEN` の設定が先に必要（[src/worker/.env.example](src/worker/.env.example)）。

詳細: [ENV/PRODUCTION.md](ENV/PRODUCTION.md)

---

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [water-usage-iot-demo-spec.md](water-usage-iot-demo-spec.md) | 仕様書・ER 図・DFD・シーケンス図・クラス図・状態遷移図・ユースケース図 |
| [SPEC/api.md](SPEC/api.md) | API エンドポイント詳細 |
| [ENV/DEVELOPMENT.md](ENV/DEVELOPMENT.md) | 開発環境セットアップ |
| [ENV/PRODUCTION.md](ENV/PRODUCTION.md) | 本番環境・デプロイ手順 |
| [.claude/TM.md](.claude/TM.md) | テストマトリクス（T01〜T07、計 41 ケース） |
| [.claude/OWASP10.md](.claude/OWASP10.md) | セキュリティチェックリスト |

---

## プロジェクト管理

| ディレクトリ | 用途 |
|------------|------|
| [TASKS/](TASKS/) | タスク管理 |
| [DEBUG/](DEBUG/) | バグ報告 |
| [CLIENT/](CLIENT/) | クライアント要望 |
| [WORK/](WORK/) | 作業報告 |
| [SPEC/](SPEC/) | 仕様書・図解 |
| [test/](test/) | PR 単位のテストスクリプト |
| [DELETE/](DELETE/) | ゴミ箱（手動で処理する） |
