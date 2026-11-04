import { beforeEach, describe, expect, it } from "vitest";
import { WaterRepository } from "../repo/waterRepository";
import { createHarness, createSession, jsonInit, type TestHarness } from "../testing/harness";
import { buildSessionEvents } from "./sessionEvents";

function parseEvents(chunk: string): { type: string; data: Record<string, unknown> }[] {
  return chunk
    .split("\n\n")
    .filter((block) => block.startsWith("data: "))
    .map((block) => JSON.parse(block.slice("data: ".length)) as { type: string; data: Record<string, unknown> });
}

describe("buildSessionEvents", () => {
  let h: TestHarness;
  let repo: WaterRepository;
  let sessionId: string;
  let deviceId: string;

  beforeEach(async () => {
    h = createHarness();
    repo = new WaterRepository(h.database.db);
    sessionId = await createSession(h);
    const created = (await (
      await h.request(
        "/api/devices",
        jsonInit("POST", { device_token: "STREAMDEV", label: "Main" }, { "X-Session-Id": sessionId })
      )
    ).json()) as { device_id: string };
    deviceId = created.device_id;

    const receivedAt = "2026-06-24T01:00:00.000Z";
    h.database.sqlite
      .prepare(
        "INSERT INTO flow_readings (id, device_id, flow_rate, volume_delta, temperature, received_at, received_at_sec) VALUES ('r1', ?, 1.5, 0.1, 20.5, ?, 1782262800)"
      )
      .run(deviceId, receivedAt);
    h.database.sqlite
      .prepare("INSERT INTO daily_summaries (id, device_id, date_jst, total_liters, updated_at) VALUES ('s1', ?, '2026-06-24', 12.5, ?)")
      .run(deviceId, receivedAt);
    h.database.sqlite
      .prepare(
        "INSERT INTO alerts (id, device_id, rule_id, message, severity, created_at) VALUES ('a1', ?, 'R02', 'msg', 'warning', ?)"
      )
      .run(deviceId, receivedAt);
  });

  it("sends the latest reading, device status, unsent alerts and the summary", async () => {
    const pushed = new Set<string>();
    const events = parseEvents(await buildSessionEvents(repo, sessionId, pushed));

    expect(events.map((event) => event.type)).toEqual(["reading", "device_status", "alert", "summary"]);

    const [reading, status, alert, summary] = events;
    expect(reading?.data).toEqual({
      id: "r1",
      device_id: deviceId,
      flow_rate: 1.5,
      temperature: 20.5,
      volume_total: 12.5,
      recorded_at: "2026-06-24T01:00:00Z"
    });
    // 登録時に online_at が現在時刻で入る（Rails の DevicesController と同じ）。
    expect(status?.data).toMatchObject({ id: deviceId, label: "Main", pump_on: false });
    expect(typeof status?.data.online_at).toBe("string");
    expect(alert?.data).toMatchObject({
      id: "a1",
      rule_name: "R02",
      severity: "warning",
      occurred_at: "2026-06-24T01:00:00Z"
    });
    expect(summary?.data).toEqual({ today_usage: 12.5, active_alerts: 1 });
    expect(pushed.has("a1")).toBe(true);
  });

  it("does not resend an alert that was already pushed on this connection", async () => {
    const events = parseEvents(await buildSessionEvents(repo, sessionId, new Set<string>(["a1"])));
    expect(events.map((event) => event.type)).not.toContain("alert");
    expect(events.at(-1)).toEqual({ type: "summary", data: { today_usage: 12.5, active_alerts: 1 } });
  });
});
