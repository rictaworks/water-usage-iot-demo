import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, createSession, jsonInit, type TestHarness } from "../testing/harness";

const DEVICE_TOKEN = "READDEV";

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

describe("POST /api/readings", () => {
  let h: TestHarness;
  let sessionId: string;

  beforeEach(async () => {
    h = createHarness();
    sessionId = await createSession(h);
    await h.request(
      "/api/devices",
      jsonInit("POST", { device_token: DEVICE_TOKEN, label: "Test" }, { "X-Session-Id": sessionId })
    );
  });

  function post(body: Record<string, unknown>): Promise<Response> {
    return h.request("/api/readings", jsonInit("POST", { device_token: DEVICE_TOKEN, ...body }));
  }

  function summaryTotal(): number {
    const row = h.database.sqlite
      .prepare("SELECT total_liters FROM daily_summaries d JOIN devices v ON v.id = d.device_id WHERE v.device_token = ?")
      .get(DEVICE_TOKEN) as { total_liters: number } | undefined;
    return row?.total_liters ?? 0;
  }

  it("stores the reading and returns 201 with the LED state and pump state", async () => {
    const response = await post({ flow_rate: 2.5, volume_delta: 0.2, temperature: 18.5, sent_at_sec: nowSeconds() });
    expect(response.status).toBe(201);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(typeof body.reading_id).toBe("string");
    expect(body.alerts).toEqual([]);
    expect(body.led_state).toEqual({ led_color: "green", led_blink_hz: 0, fan_speed_pct: 30 });
    expect(body.led_color).toBe("green");
    expect(body.led_blink_hz).toBe(0);
    expect(body.fan_speed_pct).toBe(30);
    expect(body.pump_on).toBe(false);
  });

  it("treats a repeated sent_at_sec as a duplicate and does not add its volume twice", async () => {
    const sec = nowSeconds();
    const first = await post({ flow_rate: 1.0, volume_delta: 0.1, sent_at_sec: sec });
    expect(first.status).toBe(201);

    const second = await post({ flow_rate: 1.0, volume_delta: 0.1, sent_at_sec: sec });
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ status: "duplicate", skipped: true });
    expect(summaryTotal()).toBeCloseTo(0.1, 6);
  });

  it("rejects an out-of-range flow_rate with 422 instead of storing it", async () => {
    const response = await post({ flow_rate: 1e9, sent_at_sec: nowSeconds() });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "flow_rate is out of range" });
  });

  it.each([1e20, -1, 253402300800])("rejects sent_at_sec %s with 422 instead of a 500", async (sentAt) => {
    const response = await post({ flow_rate: 1, sent_at_sec: sentAt });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "sent_at_sec is out of range" });
  });

  it("accepts the largest representable sent_at_sec", async () => {
    const response = await post({ flow_rate: 1, sent_at_sec: 253402300799 });
    expect(response.status).toBe(201);
  });

  it("accumulates the daily usage across readings", async () => {
    const sec = nowSeconds();
    await post({ flow_rate: 1.0, volume_delta: 0.25, sent_at_sec: sec });
    await post({ flow_rate: 1.0, volume_delta: 0.5, sent_at_sec: sec + 5 });
    expect(summaryTotal()).toBeCloseTo(0.75, 6);
  });

  it("returns 404 for an unknown device token", async () => {
    const response = await h.request(
      "/api/readings",
      jsonInit("POST", { device_token: "UNKNOWN", flow_rate: 1.0, sent_at_sec: nowSeconds() })
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Device not found" });
  });

  it("silently rejects a honeypot submission with 403", async () => {
    const response = await post({ flow_rate: 1.0, hp_field: "bot", sent_at_sec: nowSeconds() });
    expect(response.status).toBe(403);
  });

  it("raises a high-flow alert (R02), stores it and turns the LED red", async () => {
    const response = await post({ flow_rate: 25.0, volume_delta: 2.0, sent_at_sec: nowSeconds() });
    const body = (await response.json()) as { alerts: { rule_id: string; severity: string }[]; led_state: { led_color: string } };
    expect(body.alerts.map((alert) => alert.rule_id)).toContain("R02");
    expect(body.led_state.led_color).toBe("red");

    const stored = h.database.sqlite.prepare("SELECT rule_id FROM alerts").all() as { rule_id: string }[];
    expect(stored.map((row) => row.rule_id)).toContain("R02");
  });

  it("reports the pump state changed through PUT /api/devices/:id/pump", async () => {
    const device = h.database.sqlite.prepare("SELECT id FROM devices WHERE device_token = ?").get(DEVICE_TOKEN) as { id: string };
    await h.request(
      `/api/devices/${device.id}/pump`,
      jsonInit("PUT", { pump_on: true }, { "X-Session-Id": sessionId })
    );

    const response = await post({ flow_rate: 1.0, sent_at_sec: nowSeconds() });
    expect(((await response.json()) as { pump_on: boolean }).pump_on).toBe(true);
  });
});
