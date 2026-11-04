import { ANOMALY, RULE_ID, SEVERITY } from "../config/constants";
import { ALERT_MESSAGES } from "../config/messages";
import { toJstHour } from "../lib/time";

export interface AlertDraft {
  rule_id: string;
  message: string;
  severity: string;
}

/** 判定に必要な入力。DB 参照は遅延実行する（Rails と同じく、閾値を超えたときだけ問い合わせる）。 */
export interface AnomalyInput {
  flowRate: number;
  receivedAtMs: number;
  facilityMode: boolean;
  /** flow_rate > 0.1 の読み取りのうち最も古い received_at（ms）。無ければ null。 */
  findOldestFlowingReceivedAtMs: () => Promise<number | null>;
  /** 当日の使用量（リットル）。サマリが無ければ null。 */
  findDailyTotalLiters: () => Promise<number | null>;
}

/** Rails AnomalyDetector の移植。判定順は R01 → R02 → R03 → R04。 */
export async function detectAnomalies(input: AnomalyInput, nowMs: number): Promise<AlertDraft[]> {
  const alerts: AlertDraft[] = [];
  const continuous = await checkContinuousFlow(input, nowMs);
  if (continuous) alerts.push(continuous);
  const highFlow = checkHighFlow(input);
  if (highFlow) alerts.push(highFlow);
  const dailyUsage = await checkDailyUsage(input);
  if (dailyUsage) alerts.push(dailyUsage);
  const lateNight = checkLateNightFlow(input);
  if (lateNight) alerts.push(lateNight);
  return alerts;
}

/** 30分以上前から流れ続けている（閾値超えの最古の読み取りが30分より前）。 */
async function checkContinuousFlow(input: AnomalyInput, nowMs: number): Promise<AlertDraft | null> {
  if (!(input.flowRate > ANOMALY.CONTINUOUS_FLOW_THRESHOLD)) return null;

  const cutoffMs = nowMs - ANOMALY.CONTINUOUS_FLOW_MINUTES * 60_000;
  const oldestMs = await input.findOldestFlowingReceivedAtMs();
  if (oldestMs === null || oldestMs > cutoffMs) return null;

  return { rule_id: RULE_ID.CONTINUOUS_FLOW, message: ALERT_MESSAGES.R01, severity: SEVERITY.WARNING };
}

function checkHighFlow(input: AnomalyInput): AlertDraft | null {
  if (!(input.flowRate >= ANOMALY.HIGH_FLOW_THRESHOLD)) return null;
  return { rule_id: RULE_ID.HIGH_FLOW, message: ALERT_MESSAGES.R02, severity: SEVERITY.WARNING };
}

async function checkDailyUsage(input: AnomalyInput): Promise<AlertDraft | null> {
  const totalLiters = await input.findDailyTotalLiters();
  if (totalLiters === null) return null;

  const limit = input.facilityMode
    ? ANOMALY.DAILY_USAGE_FACILITY_LIMIT
    : ANOMALY.DAILY_USAGE_NORMAL_LIMIT;
  if (!(totalLiters > limit)) return null;

  return { rule_id: RULE_ID.DAILY_USAGE, message: ALERT_MESSAGES.R03, severity: SEVERITY.CAUTION };
}

/** JST の 2:00〜4:59 に 0.5 L/min を超える流量。 */
function checkLateNightFlow(input: AnomalyInput): AlertDraft | null {
  const hour = toJstHour(input.receivedAtMs);
  const inLateNight = hour >= ANOMALY.LATE_NIGHT_START_HOUR && hour < ANOMALY.LATE_NIGHT_END_HOUR;
  if (!inLateNight || !(input.flowRate > ANOMALY.LATE_NIGHT_FLOW_THRESHOLD)) return null;

  return { rule_id: RULE_ID.LATE_NIGHT, message: ALERT_MESSAGES.R04, severity: SEVERITY.WARNING };
}
