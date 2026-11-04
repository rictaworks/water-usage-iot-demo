import type { Hono } from "hono";
import { HONEYPOT_FIELD, INPUT_LIMITS } from "../config/constants";
import { MESSAGES } from "../config/messages";
import { ApiError, errors, isUniqueViolation } from "../lib/errors";
import { castBoolean, isPresent, toText } from "../lib/values";
import { toIsoMillis } from "../lib/time";
import { findCurrentSession } from "../session/currentSession";
import type { AppEnv } from "../types";

/** ハニーポット（非表示フィールド hp_field）に値が入っていれば bot とみなす。 */
export function isHoneypotTriggered(params: Record<string, unknown>): boolean {
  return isPresent(params[HONEYPOT_FIELD]);
}

/** POST /api/devices と PUT /api/devices/:id/pump。Rails DevicesController の移植。 */
export function registerDeviceRoutes(app: Hono<AppEnv>): void {
  app.post("/api/devices", async (c) => {
    const params = c.get("params");
    if (isHoneypotTriggered(params)) throw errors.forbidden();

    const session = await findCurrentSession(c);
    if (!session) throw errors.sessionNotFound();

    const repo = c.get("repo");
    const deviceToken = toText(params.device_token);
    const label = toText(params.label);
    const isVirtual = castBoolean(params.is_virtual) ?? false;

    // 文字数はコードポイント単位で数える（絵文字などを1文字として扱う）。
    if (label !== null && Array.from(label).length > INPUT_LIMITS.LABEL_MAX_LENGTH) {
      throw new ApiError(422, { errors: [MESSAGES.labelTooLong] });
    }
    if (deviceToken === null || deviceToken.trim() === "") {
      throw new ApiError(422, { errors: [MESSAGES.deviceTokenBlank] });
    }
    if ((await repo.findDeviceByToken(deviceToken)) !== null) {
      throw new ApiError(422, { errors: [MESSAGES.deviceTokenTaken] });
    }

    const deviceId = crypto.randomUUID();
    const nowIso = toIsoMillis(Date.now());
    try {
      await repo.runBatch([
        repo.insertDeviceStatement({
          id: deviceId,
          sessionId: session.id,
          deviceToken,
          label,
          isVirtual,
          createdAt: nowIso,
          onlineAt: nowIso
        })
      ]);
    } catch (error) {
      // 同時登録で一意制約に当たった場合も、通常の重複エラーとして返す。
      if (isUniqueViolation(error)) throw new ApiError(422, { errors: [MESSAGES.deviceTokenTaken] });
      throw error;
    }

    return c.json({ device_id: deviceId, label, device_token: deviceToken }, 201);
  });

  app.put("/api/devices/:id/pump", async (c) => {
    const session = await findCurrentSession(c);
    if (!session) throw errors.sessionNotFound();

    const repo = c.get("repo");
    const device = await repo.findDeviceInSession(session.id, c.req.param("id"));
    if (!device) throw errors.deviceNotFound();

    const pumpOn = castBoolean(c.get("params").pump_on);
    if (pumpOn === null) throw new ApiError(422, { error: MESSAGES.pumpOnRequired });

    await repo.runBatch([repo.setPumpOnStatement(device.id, pumpOn)]);
    return c.json({ pump_on: pumpOn });
  });
}
