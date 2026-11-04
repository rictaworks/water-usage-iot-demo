import { STREAM_ALERT_LIMIT } from "../config/constants";
import { toIsoSeconds } from "../lib/time";
import type { WaterRepository } from "../repo/waterRepository";

export interface StreamEvent {
  type: "reading" | "alert" | "summary" | "device_status";
  data: Record<string, unknown>;
}

/** SSE の1イベントを "data: ...\n\n" の形にする（Rails の stream.write と同じ書式）。 */
export function formatSseData(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * セッション配下の全デバイスについて、最新の流量・デバイス状態・未送信のアラートと、
 * 日次の集計をまとめた SSE 本文を作る。pushedAlertIds は接続ごとに送信済みアラートを覚える。
 */
export async function buildSessionEvents(
  repo: WaterRepository,
  sessionId: string,
  pushedAlertIds: Set<string>
): Promise<string> {
  const devices = await repo.listDevicesInSession(sessionId);
  let totalLiters = 0;
  let activeAlertsCount = 0;
  let chunk = "";

  for (const device of devices) {
    const summary = await repo.findDailySummary(device.id);
    const dailyLiters = summary?.total_liters ?? 0;

    const latest = await repo.findLatestReading(device.id);
    if (latest) {
      chunk += formatSseData({
        type: "reading",
        data: {
          id: latest.id,
          device_id: device.id,
          flow_rate: latest.flow_rate,
          temperature: latest.temperature,
          volume_total: dailyLiters,
          recorded_at: toIsoSeconds(Date.parse(latest.received_at))
        }
      });
    }

    chunk += formatSseData({
      type: "device_status",
      data: {
        id: device.id,
        label: device.label,
        pump_on: device.pump_on === 1,
        online_at: device.online_at === null ? null : toIsoSeconds(Date.parse(device.online_at))
      }
    });

    const alerts = await repo.findRecentAlerts(device.id, STREAM_ALERT_LIMIT);
    activeAlertsCount += alerts.length;
    totalLiters += dailyLiters;

    // Rails と同じく古い順に送る。送信済みの ID は再送しない。
    for (const alert of [...alerts].reverse()) {
      if (pushedAlertIds.has(alert.id)) continue;
      chunk += formatSseData({
        type: "alert",
        data: {
          id: alert.id,
          device_id: device.id,
          rule_name: alert.rule_id,
          message: alert.message,
          severity: alert.severity,
          occurred_at: toIsoSeconds(Date.parse(alert.created_at))
        }
      });
      pushedAlertIds.add(alert.id);
    }
  }

  chunk += formatSseData({
    type: "summary",
    data: { today_usage: totalLiters, active_alerts: activeAlertsCount }
  });
  return chunk;
}
