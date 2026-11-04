import type { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "../config/constants";
import { isProduction } from "../env";
import { findCurrentSession } from "../session/currentSession";
import { toIsoMillis } from "../lib/time";
import type { SessionRow } from "../repo/waterRepository";
import type { AppEnv } from "../types";

function toSessionBody(session: SessionRow): Record<string, unknown> {
  return {
    session_id: session.id,
    facility_mode: session.facility_mode === 1,
    expires_at: session.expires_at
  };
}

/** GET /api/session: 有効なセッションを返す。無ければ新規発行して Cookie を設定する。 */
export function registerSessionRoutes(app: Hono<AppEnv>): void {
  app.get("/api/session", async (c) => {
    const existing = await findCurrentSession(c);
    if (existing) return c.json(toSessionBody(existing));

    const repo = c.get("repo");
    const nowMs = Date.now();
    const sessionId = crypto.randomUUID();
    const expiresAt = toIsoMillis(nowMs + SESSION_TTL_MS);
    await repo.runBatch([
      repo.insertSessionStatement({ id: sessionId, createdAt: toIsoMillis(nowMs), expiresAt })
    ]);

    setCookie(c, SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: isProduction(c.env),
      sameSite: "Lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS
    });
    return c.json({ session_id: sessionId, facility_mode: false, expires_at: expiresAt });
  });
}
