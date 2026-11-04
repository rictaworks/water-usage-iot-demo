-- Rails（src/backend/db/schema.rb, version 2026_06_25_000002）の ActiveRecord マイグレーションを
-- D1（SQLite）向けに書き直した初期スキーマ。
--
-- 方針:
--   * 日時は UTC の ISO8601（ミリ秒つき）文字列で保存する。固定長のため文字列順が時刻順と一致する。
--   * 真偽値は INTEGER（0 / 1）で保存する。D1 のバインドは真偽値型を受け付けない。
--   * 日次リセット（JST 03:00）は下記の順（子テーブル → 親テーブル）で全削除する。
--     scenario_presets は削除せず、本ファイルの INSERT で投入した内容を保持する。
--   * Rails で FK 制約は無かったが、D1 では参照整合性のため FK を付ける。

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  facility_mode INTEGER NOT NULL DEFAULT 0 CHECK (facility_mode IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  device_token TEXT NOT NULL UNIQUE,
  label TEXT,
  is_virtual INTEGER NOT NULL DEFAULT 0 CHECK (is_virtual IN (0, 1)),
  pump_on INTEGER NOT NULL DEFAULT 0 CHECK (pump_on IN (0, 1)),
  online_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_devices_session ON devices(session_id);

CREATE TABLE IF NOT EXISTS flow_readings (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id),
  flow_rate REAL NOT NULL,
  volume_delta REAL NOT NULL DEFAULT 0,
  temperature REAL,
  received_at TEXT NOT NULL,
  received_at_sec INTEGER NOT NULL,
  -- 冪等制御（同じ秒の再送は重複として扱う）。Rails の unique index (device_id, received_at_sec) と同じ。
  UNIQUE (device_id, received_at_sec)
);
CREATE INDEX IF NOT EXISTS idx_flow_readings_device_received ON flow_readings(device_id, received_at);

CREATE TABLE IF NOT EXISTS daily_summaries (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE REFERENCES devices(id),
  date_jst TEXT,
  total_liters REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id),
  rule_id TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alerts_device_created ON alerts(device_id, created_at);

CREATE TABLE IF NOT EXISTS scenario_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  pattern_json TEXT NOT NULL
);

-- シミュレーターのシナリオ（SPEC/api.md: normal / leak / peak）。
INSERT OR IGNORE INTO scenario_presets (name, description, pattern_json) VALUES
  ('normal', '通常使用（1〜3 L/min 周期変動）', '{"type":"normal","min":1.0,"max":3.0,"interval_sec":5}'),
  ('leak', '漏水シナリオ（0.2 L/min を30分以上継続）', '{"type":"leak","flow_rate":0.2,"duration_min":35,"interval_sec":5}'),
  ('peak', '大流量（20 L/min 以上のスパイク）', '{"type":"peak","base":2.0,"spike":25.0,"spike_every":10,"interval_sec":5}');
