import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, sessionCookieFrom, type TestHarness } from "../testing/harness";

describe("GET /api/session", () => {
  let h: TestHarness;

  beforeEach(() => {
    h = createHarness();
  });

  it("creates a session, sets the session_id cookie and returns the Rails response shape", async () => {
    const response = await h.request("/api/session");
    expect(response.status).toBe(200);

    const body = (await response.json()) as { session_id: string; facility_mode: boolean; expires_at: string };
    expect(body.session_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.facility_mode).toBe(false);
    expect(Number.isNaN(Date.parse(body.expires_at))).toBe(false);

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`session_id=${body.session_id}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toContain("Secure");
  });

  it("returns the same session when the cookie is sent back", async () => {
    const first = await h.request("/api/session");
    const sessionId = sessionCookieFrom(first);
    const firstBody = (await first.json()) as { session_id: string };

    const second = await h.request("/api/session", { headers: { Cookie: `session_id=${sessionId}` } });
    const secondBody = (await second.json()) as { session_id: string };
    expect(secondBody.session_id).toBe(firstBody.session_id);
    expect(second.headers.get("set-cookie")).toBeNull();
  });

  it("accepts the X-Session-Id header", async () => {
    const first = (await (await h.request("/api/session")).json()) as { session_id: string };
    const second = (await (
      await h.request("/api/session", { headers: { "X-Session-Id": first.session_id } })
    ).json()) as { session_id: string };
    expect(second.session_id).toBe(first.session_id);
  });

  it("issues a new session when the stored one has expired", async () => {
    const first = (await (await h.request("/api/session")).json()) as { session_id: string };
    h.database.sqlite
      .prepare("UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?")
      .run(first.session_id);

    const second = (await (
      await h.request("/api/session", { headers: { "X-Session-Id": first.session_id } })
    ).json()) as { session_id: string };
    expect(second.session_id).not.toBe(first.session_id);
  });

  it("marks the cookie Secure in production", async () => {
    const production = createHarness({ APP_ENV: "production" });
    const response = await production.request("/api/session");
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });
});
