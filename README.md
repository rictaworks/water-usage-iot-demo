# water-usage-iot-demo

ESP32 フローセンサーで水の流量を計測し、Next.js + Rails + SQLite のリアルタイムダッシュボードに表示する IoT デモシステム。

> **エディション: デモ版（ショーケース）**
> データは毎日 JST 03:00 に全削除されます。

---

## 開発環境でのアクセス

| 役割 | URL |
|------|-----|
| フロントエンド | http://localhost:3000 |
| バックエンド API | http://localhost:3001 |

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
| セッション発行・取得 | `GET http://localhost:3001/api/session` |
| デバイス登録 | `POST http://localhost:3001/api/devices` |
| 流量データ受信（ESP32 → サーバー） | `POST http://localhost:3001/api/readings` |
| SSE リアルタイムストリーム | `GET http://localhost:3001/api/stream` |
| シミュレーター開始 | `POST http://localhost:3001/api/simulator/start` |
| シミュレーター停止 | `POST http://localhost:3001/api/simulator/stop` |
| 日次リセット（スケジューラ専用） | `POST http://localhost:3001/api/admin/daily-reset` |

---

## クイックスタート

```bash
# フロントエンド
cd src/frontend
npm install
npm run dev

# バックエンド（別ターミナル）
cd src/backend
bundle install
rails db:create db:migrate db:seed
rails server -p 3001
```

詳細: [ENV/DEVELOPMENT.md](ENV/DEVELOPMENT.md)

---

## 本番環境

| 役割 | URL |
|------|-----|
| フロントエンド（Vercel） | https://water-usage-iot-demo.rictaworks.jp |
| バックエンド API（Railway） | https://api.water-usage-iot-demo.rictaworks.jp |

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
