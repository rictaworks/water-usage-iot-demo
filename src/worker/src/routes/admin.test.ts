import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, createSession, jsonInit, TEST_ADMIN_TOKEN, type TestHarness } from "../testing/harness";
import { isAuthorizedAdmin } from "./admin";

describe("isAuthorizedAdmin", () => {
  it("accepts only the exact Bearer token", () => {
    expect(isAuthorizedAdmin(`Bearer ${TEST_ADMIN_TOKEN}`, TEST_ADMIN_TOKEN)).toBe(true);
    expect(isAuthorizedAdmin(`Bearer ${TEST_ADMIN_TOKEN}x`, TEST_ADMIN_TOKEN)).toBe(false);
    expect(isAuthorizedAdmin(TEST_ADMIN_TOKEN, TEST_ADMIN_TOKEN)).toBe(false);
    expect(isAuthorizedAdmin(undefined, TEST_ADMIN_TOKEN)).toBe(false);
  });

  it("denies everything when no token is configured", () => {
    expect(isAuthorizedAdmin("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedAdmin("Bearer ", "")).toBe(false);
  });
});

describe("POST /api/admin/daily-reset", () => {
  let h: TestHarness;

  beforeEach(async () => {
    h = createHarness();
    const sessionId = await createSession(h);
    await h.request(
      "/api/devices",
      jsonInit("POST", { device_token: "RESETDEV", label: "Reset" }, { "X-Session-Id": sessionId })
    );
  });

  it("returns 401 without the correct token", async () => {
    const response = await h.request("/api/admin/daily-reset", { method: "POST" });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("clears session data in the background and keeps the scenario presets", async () => {
    const response = await h.request("/api/admin/daily-reset", {
      method: "POST",
      headers: { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` }
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "scheduled" });

    await Promise.all(h.pending);

    const count = (table: string) =>
      (h.database.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
    expect(count("sessions")).toBe(0);
    expect(count("devices")).toBe(0);
    expect(count("scenario_presets")).toBe(3);
  });
});
