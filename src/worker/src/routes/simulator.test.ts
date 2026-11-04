import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, createSession, jsonInit, type TestHarness } from "../testing/harness";

describe("simulator routes", () => {
  let h: TestHarness;
  let sessionId: string;

  beforeEach(async () => {
    h = createHarness();
    sessionId = await createSession(h);
  });

  it("returns 401 for start, stop and status without a session", async () => {
    expect((await h.request("/api/simulator/status")).status).toBe(401);
    expect((await h.request("/api/simulator/start", jsonInit("POST", { scenario: "normal" }))).status).toBe(401);
    expect((await h.request("/api/simulator/stop", jsonInit("POST", {}))).status).toBe(401);
  });

  it("starts a preset scenario, creates the virtual device and hands the pattern to the simulator", async () => {
    const response = await h.request(
      "/api/simulator/start",
      jsonInit("POST", { scenario: "peak" }, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "started", scenario: "peak" });

    const virtual = h.database.sqlite
      .prepare("SELECT label, is_virtual, length(device_token) AS token_length FROM devices WHERE session_id = ?")
      .all(sessionId) as { label: string; is_virtual: number; token_length: number }[];
    expect(virtual).toEqual([{ label: "仮想デバイス", is_virtual: 1, token_length: 32 }]);

    expect(h.simulator.orders).toHaveLength(1);
    expect(h.simulator.orders[0]?.pattern).toEqual({
      type: "peak",
      base: 2,
      spike: 25,
      spikeEvery: 10,
      intervalSec: 5
    });
  });

  it("reuses the same virtual device on a second start", async () => {
    await h.request("/api/simulator/start", jsonInit("POST", { scenario: "normal" }, { "X-Session-Id": sessionId }));
    await h.request("/api/simulator/start", jsonInit("POST", { scenario: "leak" }, { "X-Session-Id": sessionId }));

    const count = h.database.sqlite
      .prepare("SELECT COUNT(*) AS n FROM devices WHERE session_id = ? AND is_virtual = 1")
      .get(sessionId) as { n: number };
    expect(count.n).toBe(1);
  });

  it("rejects an unknown scenario with 422 (high_flow was renamed to peak)", async () => {
    const response = await h.request(
      "/api/simulator/start",
      jsonInit("POST", { scenario: "high_flow" }, { "X-Session-Id": sessionId })
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "Unknown scenario: high_flow" });
    expect(h.simulator.orders).toHaveLength(0);
  });

  it("reports running state and stops the simulator", async () => {
    await h.request("/api/simulator/start", jsonInit("POST", { scenario: "normal" }, { "X-Session-Id": sessionId }));

    const running = await h.request("/api/simulator/status", { headers: { "X-Session-Id": sessionId } });
    expect(await running.json()).toEqual({ running: true, scenario: null });

    const stopped = await h.request("/api/simulator/stop", jsonInit("POST", {}, { "X-Session-Id": sessionId }));
    expect(await stopped.json()).toEqual({ status: "stopped" });

    const after = await h.request("/api/simulator/status", { headers: { "X-Session-Id": sessionId } });
    expect(await after.json()).toEqual({ running: false, scenario: null });
  });
});
