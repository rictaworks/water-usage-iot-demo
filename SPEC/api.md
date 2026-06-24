# API エンドポイント一覧

ベース URL:
- 開発: `http://localhost:3001`
- 本番: `https://api.water-usage-iot-demo.rictaworks.jp`

---

## セッション管理

### セッション発行・取得

`GET /api/session`

Cookie に `session_id` がなければ新規発行する。レスポンスで `Set-Cookie` を返す。

**レスポンス**

```json
{ "session_id": "uuid", "facility_mode": false, "expires_at": "ISO8601" }
```

---

## デバイス管理

### デバイス登録

`POST /api/devices`

ESP32 が起動時にデバイストークンを送信し、session に紐づける。

**リクエスト**

```json
{ "device_token": "string", "label": "string" }
```

**レスポンス**

```json
{ "device_id": "uuid", "status": "ok" }
```

---

## センサーデータ

### 流量データ受信

`POST /api/readings`

ESP32 から 5 秒ごとに流量データを受信する。べき等制御あり（UNIQUE 制約）。

**リクエスト**

```json
{ "device_token": "string", "flow_rate": 1.5, "sent_at_sec": 1700000000 }
```

**レスポンス（LED フィードバック）**

```json
{
  "status": "ok",
  "led_color": "green",
  "led_blink_hz": 0,
  "fan_speed_pct": 30
}
```

---

## リアルタイム配信

### SSE ストリーム

`GET /api/stream`

ブラウザが接続を維持し、サーバーからリアルタイムイベントを受信する。

**イベント種別**

| イベント | データ |
|---------|--------|
| `reading` | 最新流量データ |
| `alert` | 新規アラート |
| `summary` | 日次集計更新 |
| `device_status` | デバイスオンライン状態変化 |

---

## シミュレーター

### シミュレーター開始

`POST /api/simulator/start`

仮想 ESP32 のシナリオ再生を開始する。

**リクエスト**

```json
{ "session_id": "uuid", "scenario": "normal" }
```

シナリオ: `"normal"` / `"leak"` / `"peak"`

### シミュレーター停止

`POST /api/simulator/stop`

**リクエスト**

```json
{ "session_id": "uuid" }
```

---

## 管理・システム

### 日次リセット（スケジューラ専用）

`POST /api/admin/daily-reset`

JST 03:00 に Railway Cron から呼び出される。全テーブルを削除し VACUUM を実行する。

**ヘッダー**

```
Authorization: Bearer <ADMIN_RESET_TOKEN>
```

---

## ハニーポット

全フォームエンドポイントに非表示フィールド `hp_field` を設置する。
値が入力されていた場合は `200 OK` を返しつつサイレント棄却する（Bot 対策）。
