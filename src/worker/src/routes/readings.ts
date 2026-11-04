import type { Hono } from "hono";
import { INPUT_LIMITS } from "../config/constants";
import { MESSAGES } from "../config/messages";
import { ApiError, errors } from "../lib/errors";
import { toFloatOrZero, toIntOrZero, toText } from "../lib/values";
import { saveReadingWithAlerts } from "../services/readingService";
import { computeLedState } from "../domain/ledController";
import { isHoneypotTriggered } from "./devices";
import type { AppEnv } from "../types";

/**
 * POST /api/readings（ESP32 から5秒ごとに呼ばれる）。
 * 応答の pump_on は ESP32 のリレー制御に使われるため、キー名と 201 の応答を変えないこと。
 */
export function registerReadingRoutes(app: Hono<AppEnv>): void {
  app.post("/api/readings", async (c) => {
    const params = c.get("params");
    if (isHoneypotTriggered(params)) throw errors.forbidden();

    const repo = c.get("repo");
    const deviceToken = toText(params.device_token);
    const device = deviceToken === null || deviceToken === "" ? null : await repo.findDeviceByToken(deviceToken);
    if (!device) throw errors.deviceNotFound();

    const nowMs = Date.now();
    const flowRate = toFloatOrZero(params.flow_rate);
    if (flowRate > INPUT_LIMITS.FLOW_RATE_MAX) {
      throw new ApiError(422, { error: MESSAGES.flowRateOutOfRange });
    }

    // Rails の params[:sent_at_sec]&.to_i || Time.current.to_i と同じ。未指定のときだけ現在時刻を使う。
    const sentAtProvided = params.sent_at_sec !== undefined && params.sent_at_sec !== null;
    const receivedAtSec = sentAtProvided ? toIntOrZero(params.sent_at_sec) : Math.floor(nowMs / 1000);
    if (receivedAtSec < INPUT_LIMITS.SENT_AT_SEC_MIN || receivedAtSec > INPUT_LIMITS.SENT_AT_SEC_MAX) {
      throw new ApiError(422, { error: MESSAGES.sentAtSecOutOfRange });
    }

    const result = await saveReadingWithAlerts(
      repo,
      device,
      {
        flowRate,
        volumeDelta: toFloatOrZero(params.volume_delta),
        temperature: params.temperature === undefined || params.temperature === null ? null : toFloatOrZero(params.temperature),
        receivedAtMs: receivedAtSec * 1000,
        receivedAtSec
      },
      nowMs
    );

    if (result.kind === "duplicate") {
      return c.json({ status: "duplicate", skipped: true });
    }

    const ledState = computeLedState(result.alerts, flowRate);
    // 既存の応答（reading_id / led_state / pump_on）に、SPEC/api.md のフラットな LED 項目を追加して両方を満たす。
    return c.json(
      {
        status: "ok",
        reading_id: result.readingId,
        alerts: result.alerts,
        led_state: ledState,
        led_color: ledState.led_color,
        led_blink_hz: ledState.led_blink_hz,
        fan_speed_pct: ledState.fan_speed_pct,
        pump_on: device.pump_on === 1
      },
      201
    );
  });
}
