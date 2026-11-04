import { detectAnomalies, type AlertDraft } from "../domain/anomalyDetector";
import { ANOMALY } from "../config/constants";
import { isUniqueViolation } from "../lib/errors";
import { toIsoMillis, toJstDate } from "../lib/time";
import type { DeviceRow, WaterRepository } from "../repo/waterRepository";

export interface ReadingInput {
  flowRate: number;
  volumeDelta: number;
  temperature: number | null;
  /** 計測時刻（ms）。HTTP 経由では sent_at_sec の秒単位、仮想デバイスでは現在時刻のミリ秒。 */
  receivedAtMs: number;
  /** 冪等キー（デバイス内で一意）。 */
  receivedAtSec: number;
}

export type SaveReadingResult =
  | { kind: "duplicate" }
  | { kind: "saved"; readingId: string; alerts: AlertDraft[] };

/**
 * 流量データを1件保存し、日次使用量の加算・異常検知・アラート保存・オンライン時刻の更新を行う。
 * 同じ received_at_sec の再送は保存せず duplicate を返す（Rails の RecordNotUnique 相当）。
 */
export async function saveReadingWithAlerts(
  repo: WaterRepository,
  device: DeviceRow,
  input: ReadingInput,
  nowMs: number
): Promise<SaveReadingResult> {
  const readingId = crypto.randomUUID();
  const nowIso = toIsoMillis(nowMs);

  const insertReading = repo.insertReadingStatement({
    id: readingId,
    deviceId: device.id,
    flowRate: input.flowRate,
    volumeDelta: input.volumeDelta,
    temperature: input.temperature,
    receivedAt: toIsoMillis(input.receivedAtMs),
    receivedAtSec: input.receivedAtSec
  });
  const upsertSummary = repo.upsertDailySummaryStatement({
    id: crypto.randomUUID(),
    deviceId: device.id,
    volumeDelta: input.volumeDelta,
    dateJst: toJstDate(nowMs),
    nowIso
  });

  try {
    // 読み取りの保存と使用量の加算は1トランザクションにする（一方だけ反映される事故を防ぐ）。
    await repo.runBatch([insertReading, upsertSummary]);
  } catch (error) {
    if (isUniqueViolation(error)) return { kind: "duplicate" };
    throw error;
  }

  const session = await repo.findSession(device.session_id);
  if (!session) {
    throw new Error(`device ${device.id} refers to a missing session ${device.session_id}`);
  }

  const alerts = await detectAnomalies(
    {
      flowRate: input.flowRate,
      receivedAtMs: input.receivedAtMs,
      facilityMode: session.facility_mode === 1,
      findOldestFlowingReceivedAtMs: async () => {
        const receivedAt = await repo.findOldestFlowingReceivedAt(device.id, ANOMALY.CONTINUOUS_FLOW_THRESHOLD);
        return receivedAt === null ? null : Date.parse(receivedAt);
      },
      findDailyTotalLiters: async () => {
        const summary = await repo.findDailySummary(device.id);
        return summary === null ? null : summary.total_liters;
      }
    },
    nowMs
  );

  const statements = alerts.map((alert) =>
    repo.insertAlertStatement({
      id: crypto.randomUUID(),
      deviceId: device.id,
      ruleId: alert.rule_id,
      message: alert.message,
      severity: alert.severity,
      createdAt: nowIso
    })
  );
  statements.push(repo.touchOnlineAtStatement(device.id, nowIso));
  await repo.runBatch(statements);

  return { kind: "saved", readingId, alerts };
}
