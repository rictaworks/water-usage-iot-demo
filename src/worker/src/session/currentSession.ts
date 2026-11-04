import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME, SESSION_HEADER_NAME } from "../config/constants";
import { toIsoMillis } from "../lib/time";
import type { SessionRow } from "../repo/waterRepository";
import type { AppEnv } from "../types";

/**
 * セッションID の取得元（Rails BaseController#current_session と同じ優先順）:
 * X-Session-Id ヘッダー → session_id（クエリ・ボディ）→ Cookie session_id。空の値は無視する。
 */
export function sessionIdCandidate(c: Context<AppEnv>): string | null {
  const header = c.req.header(SESSION_HEADER_NAME);
  if (header !== undefined && header.trim() !== "") return header;

  const fromParams = c.get("params")["session_id"];
  if (typeof fromParams === "string" && fromParams.trim() !== "") return fromParams;

  const fromCookie = getCookie(c, SESSION_COOKIE_NAME);
  if (fromCookie !== undefined && fromCookie.trim() !== "") return fromCookie;

  return null;
}

/** 有効期限内のセッションを返す。無ければ null（期限切れ・日次リセット後も null）。 */
export async function findCurrentSession(c: Context<AppEnv>): Promise<SessionRow | null> {
  const sessionId = sessionIdCandidate(c);
  if (sessionId === null) return null;
  return c.get("repo").findActiveSession(sessionId, toIsoMillis(Date.now()));
}
