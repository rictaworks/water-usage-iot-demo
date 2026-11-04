import type { SqlDatabase, SqlStatement } from "../db/types";

/** 行の型。真偽値は INTEGER（0 / 1）のまま扱い、変換は呼び出し側で行う。 */
export interface SessionRow {
  id: string;
  facility_mode: number;
  expires_at: string;
}

export interface DeviceRow {
  id: string;
  session_id: string;
  device_token: string;
  label: string | null;
  is_virtual: number;
  pump_on: number;
  online_at: string | null;
  created_at: string;
}

export interface ReadingRow {
  id: string;
  device_id: string;
  flow_rate: number;
  volume_delta: number;
  temperature: number | null;
  received_at: string;
  received_at_sec: number;
}

export interface DailySummaryRow {
  id: string;
  device_id: string;
  date_jst: string | null;
  total_liters: number;
  updated_at: string;
}

export interface AlertRow {
  id: string;
  device_id: string;
  rule_id: string;
  message: string;
  severity: string;
  created_at: string;
}

export interface PresetRow {
  id: number;
  name: string;
  description: string;
  pattern_json: string;
}

export interface NewSession {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export interface NewDevice {
  id: string;
  sessionId: string;
  deviceToken: string;
  label: string | null;
  isVirtual: boolean;
  createdAt: string;
  onlineAt: string | null;
}

export interface NewReading {
  id: string;
  deviceId: string;
  flowRate: number;
  volumeDelta: number;
  temperature: number | null;
  receivedAt: string;
  receivedAtSec: number;
}

export interface NewAlert {
  id: string;
  deviceId: string;
  ruleId: string;
  message: string;
  severity: string;
  createdAt: string;
}

/**
 * 全テーブルへのアクセスを集約する。
 * セッション・デバイス単位の参照条件は呼び出し側が渡す（オーナーキーの検査はルート側で行う）。
 */
export class WaterRepository {
  constructor(private readonly db: SqlDatabase) {}

  private prepare(query: string, ...values: unknown[]): SqlStatement {
    return this.db.prepare(query).bind(...values);
  }

  // --- sessions ---

  async findActiveSession(id: string, nowIso: string): Promise<SessionRow | null> {
    return this.prepare(
      "SELECT id, facility_mode, expires_at FROM sessions WHERE id = ? AND expires_at >= ?",
      id,
      nowIso
    ).first<SessionRow>();
  }

  async findSession(id: string): Promise<SessionRow | null> {
    return this.prepare("SELECT id, facility_mode, expires_at FROM sessions WHERE id = ?", id).first<SessionRow>();
  }

  insertSessionStatement(session: NewSession): SqlStatement {
    return this.prepare(
      "INSERT INTO sessions (id, created_at, expires_at, facility_mode) VALUES (?, ?, ?, 0)",
      session.id,
      session.createdAt,
      session.expiresAt
    );
  }

  // --- devices ---

  async findDeviceByToken(deviceToken: string): Promise<DeviceRow | null> {
    return this.prepare("SELECT * FROM devices WHERE device_token = ?", deviceToken).first<DeviceRow>();
  }

  async findDeviceInSession(sessionId: string, deviceId: string): Promise<DeviceRow | null> {
    return this.prepare("SELECT * FROM devices WHERE session_id = ? AND id = ?", sessionId, deviceId).first<DeviceRow>();
  }

  async findVirtualDevice(sessionId: string): Promise<DeviceRow | null> {
    return this.prepare(
      "SELECT * FROM devices WHERE session_id = ? AND is_virtual = 1 ORDER BY created_at ASC, id ASC LIMIT 1",
      sessionId
    ).first<DeviceRow>();
  }

  async listDevicesInSession(sessionId: string): Promise<DeviceRow[]> {
    const { results } = await this.prepare(
      "SELECT * FROM devices WHERE session_id = ? ORDER BY created_at ASC, id ASC",
      sessionId
    ).all<DeviceRow>();
    return results;
  }

  insertDeviceStatement(device: NewDevice): SqlStatement {
    return this.prepare(
      "INSERT INTO devices (id, session_id, device_token, label, is_virtual, pump_on, online_at, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
      device.id,
      device.sessionId,
      device.deviceToken,
      device.label,
      device.isVirtual ? 1 : 0,
      device.onlineAt,
      device.createdAt
    );
  }

  setPumpOnStatement(deviceId: string, pumpOn: boolean): SqlStatement {
    return this.prepare("UPDATE devices SET pump_on = ? WHERE id = ?", pumpOn ? 1 : 0, deviceId);
  }

  touchOnlineAtStatement(deviceId: string, nowIso: string): SqlStatement {
    return this.prepare("UPDATE devices SET online_at = ? WHERE id = ?", nowIso, deviceId);
  }

  // --- flow readings ---

  async findReadingBySecond(deviceId: string, receivedAtSec: number): Promise<ReadingRow | null> {
    return this.prepare(
      "SELECT * FROM flow_readings WHERE device_id = ? AND received_at_sec = ?",
      deviceId,
      receivedAtSec
    ).first<ReadingRow>();
  }

  async findLatestReading(deviceId: string): Promise<ReadingRow | null> {
    return this.prepare(
      "SELECT * FROM flow_readings WHERE device_id = ? ORDER BY received_at DESC, received_at_sec DESC LIMIT 1",
      deviceId
    ).first<ReadingRow>();
  }

  /** flow_rate が閾値より大きい読み取りのうち最も古い received_at（R01 判定用）。 */
  async findOldestFlowingReceivedAt(deviceId: string, flowThreshold: number): Promise<string | null> {
    const row = await this.prepare(
      "SELECT received_at FROM flow_readings WHERE device_id = ? AND flow_rate > ? ORDER BY received_at ASC LIMIT 1",
      deviceId,
      flowThreshold
    ).first<{ received_at: string }>();
    return row?.received_at ?? null;
  }

  insertReadingStatement(reading: NewReading): SqlStatement {
    return this.prepare(
      "INSERT INTO flow_readings (id, device_id, flow_rate, volume_delta, temperature, received_at, received_at_sec) VALUES (?, ?, ?, ?, ?, ?, ?)",
      reading.id,
      reading.deviceId,
      reading.flowRate,
      reading.volumeDelta,
      reading.temperature,
      reading.receivedAt,
      reading.receivedAtSec
    );
  }

  // --- daily summaries ---

  async findDailySummary(deviceId: string): Promise<DailySummaryRow | null> {
    return this.prepare("SELECT * FROM daily_summaries WHERE device_id = ?", deviceId).first<DailySummaryRow>();
  }

  /** 使用量の加算。Rails の FlowReading#upsert_daily_summary と同じ意味（device_id 単位で1行）。 */
  upsertDailySummaryStatement(params: {
    id: string;
    deviceId: string;
    volumeDelta: number;
    dateJst: string;
    nowIso: string;
  }): SqlStatement {
    return this.prepare(
      `INSERT INTO daily_summaries (id, device_id, date_jst, total_liters, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(device_id) DO UPDATE SET
         total_liters = daily_summaries.total_liters + excluded.total_liters,
         date_jst = excluded.date_jst,
         updated_at = excluded.updated_at`,
      params.id,
      params.deviceId,
      params.dateJst,
      params.volumeDelta,
      params.nowIso
    );
  }

  // --- alerts ---

  async findRecentAlerts(deviceId: string, limit: number): Promise<AlertRow[]> {
    const { results } = await this.prepare(
      "SELECT * FROM alerts WHERE device_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
      deviceId,
      limit
    ).all<AlertRow>();
    return results;
  }

  insertAlertStatement(alert: NewAlert): SqlStatement {
    return this.prepare(
      "INSERT INTO alerts (id, device_id, rule_id, message, severity, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      alert.id,
      alert.deviceId,
      alert.ruleId,
      alert.message,
      alert.severity,
      alert.createdAt
    );
  }

  // --- scenario presets ---

  async findPresetByName(name: string): Promise<PresetRow | null> {
    return this.prepare("SELECT * FROM scenario_presets WHERE name = ?", name).first<PresetRow>();
  }

  // --- batches and maintenance ---

  async runBatch(statements: SqlStatement[]): Promise<void> {
    await this.db.batch(statements);
  }

  /**
   * 日次リセット（JST 03:00）。子テーブルから順に全削除する（D1 は外部キーを強制する）。
   * scenario_presets は保持する。Rails の VACUUM は D1 で使えないため行わない。
   */
  async resetDailyData(): Promise<void> {
    const statements = ["alerts", "flow_readings", "daily_summaries", "devices", "sessions"].map((table) =>
      this.prepare(`DELETE FROM ${table}`)
    );
    await this.runBatch(statements);
  }
}
