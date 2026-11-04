import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, createSession, jsonInit, type TestHarness } from "../testing/harness";

describe("POST /api/devices", () => {
  let h: TestHarness;
  let sessionId: string;

  beforeEach(async () => {
    h = createHarness();
    sessionId = await createSession(h);
  });

  it("registers a device for the session and returns 201", async () => {
    const response = await h.request(
      "/api/devices",
      jsonInit("POST", { device_token: "TOKEN123", label: "Kitchen" }, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as { device_id: string; label: string; device_token: string };
    expect(body.device_id).toBeTruthy();
    expect(body.label).toBe("Kitchen");
    expect(body.device_token).toBe("TOKEN123");

    const row = h.database.sqlite
      .prepare("SELECT session_id, pump_on, is_virtual FROM devices WHERE id = ?")
      .get(body.device_id) as { session_id: string; pump_on: number; is_virtual: number };
    expect(row).toEqual({ session_id: sessionId, pump_on: 0, is_virtual: 0 });
  });

  it("accepts form-encoded bodies as well", async () => {
    const response = await h.request("/api/devices", {
      method: "POST",
      headers: { "X-Session-Id": sessionId, "content-type": "application/x-www-form-urlencoded" },
      body: "device_token=FORMTOKEN&label=Bath"
    });
    expect(response.status).toBe(201);
  });

  it("silently rejects a bot that fills the honeypot field with 403", async () => {
    const response = await h.request(
      "/api/devices",
      jsonInit("POST", { device_token: "TOKEN456", label: "Bath", hp_field: "bot" }, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  it("returns 401 when there is no session", async () => {
    const response = await h.request("/api/devices", jsonInit("POST", { device_token: "TOKEN789" }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Session not found" });
  });

  it("rejects a label longer than 100 characters with 422", async () => {
    const tooLong = "あ".repeat(101);
    const response = await h.request(
      "/api/devices",
      jsonInit("POST", { device_token: "LONGLABEL", label: tooLong }, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ errors: ["Label is too long (maximum is 100 characters)"] });
  });

  it("accepts a label of exactly 100 characters", async () => {
    const response = await h.request(
      "/api/devices",
      jsonInit("POST", { device_token: "EDGELABEL", label: "a".repeat(100) }, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(201);
  });

  it("returns 422 with the Rails message for a blank token", async () => {
    const response = await h.request(
      "/api/devices",
      jsonInit("POST", { device_token: "   " }, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ errors: ["Device token can't be blank"] });
  });

  it("returns 422 for a duplicate token", async () => {
    await h.request("/api/devices", jsonInit("POST", { device_token: "DUPTOKEN", label: "A" }, { "X-Session-Id": sessionId }));
    const response = await h.request(
      "/api/devices",
      jsonInit("POST", { device_token: "DUPTOKEN", label: "B" }, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ errors: ["Device token has already been taken"] });
  });
});

describe("PUT /api/devices/:id/pump", () => {
  let h: TestHarness;
  let sessionId: string;
  let deviceId: string;

  beforeEach(async () => {
    h = createHarness();
    sessionId = await createSession(h);
    const created = (await (
      await h.request(
        "/api/devices",
        jsonInit("POST", { device_token: "PUMPDEV", label: "Pump" }, { "X-Session-Id": sessionId })
      )
    ).json()) as { device_id: string };
    deviceId = created.device_id;
  });

  it("switches the pump on and off for a device in the same session", async () => {
    const on = await h.request(
      `/api/devices/${deviceId}/pump`,
      jsonInit("PUT", { pump_on: true }, { "X-Session-Id": sessionId })
    );
    expect(on.status).toBe(200);
    expect(await on.json()).toEqual({ pump_on: true });

    const off = await h.request(
      `/api/devices/${deviceId}/pump`,
      jsonInit("PUT", { pump_on: "false" }, { "X-Session-Id": sessionId })
    );
    expect(await off.json()).toEqual({ pump_on: false });
  });

  it("returns 404 for a device that belongs to another session", async () => {
    const otherSession = await createSession(h);
    const response = await h.request(
      `/api/devices/${deviceId}/pump`,
      jsonInit("PUT", { pump_on: true }, { "X-Session-Id": otherSession })
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Device not found" });
  });

  it("returns 422 when pump_on is missing", async () => {
    const response = await h.request(
      `/api/devices/${deviceId}/pump`,
      jsonInit("PUT", {}, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(422);
  });
});
