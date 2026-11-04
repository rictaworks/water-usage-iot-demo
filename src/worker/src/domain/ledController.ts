import { CAUTION_RULES, WARNING_RULES } from "../config/constants";

export interface LedState {
  led_color: "red" | "yellow" | "green" | "off";
  led_blink_hz: number;
  fan_speed_pct: number;
}

/** Rails LedController の移植。警告 > 注意 > 流れあり（緑） > 停止（消灯）の順に優先する。 */
export function computeLedState(alerts: readonly { rule_id: string }[], currentFlowRate: number): LedState {
  const hasWarning = alerts.some((alert) => WARNING_RULES.includes(alert.rule_id));
  const hasCaution = alerts.some((alert) => CAUTION_RULES.includes(alert.rule_id));

  if (hasWarning) return { led_color: "red", led_blink_hz: 4, fan_speed_pct: 100 };
  if (hasCaution) return { led_color: "yellow", led_blink_hz: 1, fan_speed_pct: 60 };
  if (currentFlowRate > 0) return { led_color: "green", led_blink_hz: 0, fan_speed_pct: 30 };
  return { led_color: "off", led_blink_hz: 0, fan_speed_pct: 0 };
}
