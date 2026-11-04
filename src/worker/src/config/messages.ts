/** API のエラーメッセージ・通知文（Rails 版の文言をそのまま引き継ぐ）。 */
export const MESSAGES = {
  forbidden: "Forbidden",
  sessionNotFound: "Session not found",
  deviceNotFound: "Device not found",
  unauthorized: "Unauthorized",
  invalidJson: "Invalid JSON body",
  pumpOnRequired: "pump_on is required",
  notFound: "Not Found",
  internalError: "Internal Server Error",
  deviceTokenBlank: "Device token can't be blank",
  deviceTokenTaken: "Device token has already been taken",
  labelTooLong: "Label is too long (maximum is 100 characters)",
  flowRateOutOfRange: "flow_rate is out of range",
  sentAtSecOutOfRange: "sent_at_sec is out of range",
  unknownScenarioPrefix: "Unknown scenario: "
} as const;

/** アラート本文（Rails AnomalyDetector と同じ）。 */
export const ALERT_MESSAGES = {
  R01: "30分以上継続して水が流れています",
  R02: "瞬間流量が異常に高い値です",
  R03: "本日の使用量が上限を超えました",
  R04: "深夜時間帯（2〜5時）に水が流れています"
} as const;
