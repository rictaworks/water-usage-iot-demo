import type { Hono } from "hono";
import { ADMIN_BEARER_PREFIX } from "../config/constants";
import { errors } from "../lib/errors";
import type { AppEnv } from "../types";

/** 定数時間で比較する（トークンの一致判定に時間差を出さない）。 */
function constantTimeEquals(actual: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(actual);
  const b = encoder.encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

/** Authorization: Bearer <ADMIN_RESET_TOKEN> の検査。トークン未設定の環境では常に拒否する。 */
export function isAuthorizedAdmin(authorization: string | undefined, expected: string | undefined): boolean {
  if (expected === undefined || expected === "") return false;
  if (authorization === undefined || !authorization.startsWith(ADMIN_BEARER_PREFIX)) return false;
  return constantTimeEquals(authorization.slice(ADMIN_BEARER_PREFIX.length), expected);
}

/** POST /api/admin/daily-reset（外部スケジューラ用）。応答は非同期に実行する（Rails の perform_later 相当）。 */
export function registerAdminRoutes(app: Hono<AppEnv>): void {
  app.post("/api/admin/daily-reset", async (c) => {
    if (!isAuthorizedAdmin(c.req.header("Authorization"), c.env.ADMIN_RESET_TOKEN)) {
      throw errors.unauthorized();
    }

    c.executionCtx.waitUntil(c.get("repo").resetDailyData());
    return c.json({ status: "scheduled" });
  });
}
