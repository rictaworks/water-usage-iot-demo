/** 文字列・数値の定数（CLAUDE.md: 文字列リテラルは設定ファイルに分離する）。 */

export const SESSION_COOKIE_NAME = "session_id";
export const SESSION_HEADER_NAME = "X-Session-Id";
/** Rails の Session.expires_at（作成から24時間）。 */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
/** Rails の cookies.permanent 相当。ブラウザが保持できる上限の400日。 */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

/** ルート（/）から転送する既定ロケールのパス（frontend の routing.defaultLocale と一致させる）。 */
export const DEFAULT_LOCALE_PATH = "/ja/";

/**
 * 入力の上限（Rails 版には無かった。範囲外の値で 500 にならないよう 422 で拒否する）。
 * SENT_AT_SEC_MAX は 9999-12-31T23:59:59Z で、JavaScript の Date が扱える範囲に収まる。
 */
export const INPUT_LIMITS = {
  FLOW_RATE_MAX: 1000,
  LABEL_MAX_LENGTH: 100,
  SENT_AT_SEC_MIN: 0,
  SENT_AT_SEC_MAX: 253402300799
} as const;

export const HONEYPOT_FIELD = "hp_field";
export const ADMIN_BEARER_PREFIX = "Bearer ";

export const STREAM_HEARTBEAT_INTERVAL_MS = 5_000;
export const STREAM_DATA_PUSH_INTERVAL_MS = 10_000;
export const STREAM_ALERT_LIMIT = 20;
export const STREAM_HEARTBEAT_CHUNK = ": heartbeat\n\n";
export const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no"
} as const;

export const ANOMALY = {
  CONTINUOUS_FLOW_THRESHOLD: 0.1,
  CONTINUOUS_FLOW_MINUTES: 30,
  HIGH_FLOW_THRESHOLD: 20.0,
  DAILY_USAGE_NORMAL_LIMIT: 200.0,
  DAILY_USAGE_FACILITY_LIMIT: 1000.0,
  LATE_NIGHT_FLOW_THRESHOLD: 0.5,
  LATE_NIGHT_START_HOUR: 2,
  LATE_NIGHT_END_HOUR: 5
} as const;

export const RULE_ID = {
  CONTINUOUS_FLOW: "R01",
  HIGH_FLOW: "R02",
  DAILY_USAGE: "R03",
  LATE_NIGHT: "R04"
} as const;

export const SEVERITY = {
  WARNING: "warning",
  CAUTION: "caution"
} as const;

/** LED 判定で warning 扱いの規則（Rails LedController と同じ）。 */
export const WARNING_RULES: readonly string[] = [RULE_ID.CONTINUOUS_FLOW, RULE_ID.HIGH_FLOW, RULE_ID.LATE_NIGHT];
export const CAUTION_RULES: readonly string[] = [RULE_ID.DAILY_USAGE];

/** 日本時間（JST）のオフセット。タイムゾーン: JST（CLAUDE.md）。 */
export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const VIRTUAL_DEVICE_LABEL = "仮想デバイス";
export const VIRTUAL_DEVICE_TOKEN_BYTES = 16;

export const DEFAULT_SCENARIO_INTERVAL_SEC = 5;
