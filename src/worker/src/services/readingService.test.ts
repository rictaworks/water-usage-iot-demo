import { beforeEach, describe, expect, it } from "vitest";
import { WaterRepository, type DeviceRow } from "../repo/waterRepository";
import { createHarness, createSession, jsonInit, type TestHarness } from "../testing/harness";
import { saveReadingWithAlerts } from "./readingService";

const NOW_MS = Date.UTC(2026, 5, 24, 1, 0, 0); // 10:00 JST
const NOW_SEC = Math.floor(NOW_MS / 1000);

describe("saveReadingWithAlerts", () => {
  let h: TestHarness;
  let repo: WaterRepository;
  let device: DeviceRow;

  beforeEach(async () => {
    h = createHarness();
    repo = new WaterRepository(h.database.db);
    const sessionId = await createSession(h);
    const created = (await (
      await h.request(
        "/api/devices",
        jsonInit("POST", { device_token: "SVCDEV", label: "Svc" }, { "X-Session-Id": sessionId })
      )
    ).json()) as { device_id: string };
    device = (await repo.findDeviceByToken("SVCDEV")) as DeviceRow;
    expect(device.id).toBe(created.device_id);
  });

  function input(flowRate: number, receivedAtSec: number, volumeDelta = 0.1) {
    return {
      flowRate,
      volumeDelta,
      temperature: null,
      receivedAtMs: receivedAtSec * 1000,
      receivedAtSec
    };
  }

  it("raises R01 when the flow has been running for more than 30 minutes", async () => {
    // 31 分前から毎分 0.5 L/min の読み取りを積んでおく。
    for (let minute = 31; minute >= 1; minute -= 1) {
      const sec = NOW_SEC - minute * 60;
      await repo.runBatch([
        repo.insertReadingStatement({
          id: `old-${minute}`,
          deviceId: device.id,
          flowRate: 0.5,
          volumeDelta: 0.01,
          temperature: null,
          receivedAt: new Date(sec * 1000).toISOString(),
          receivedAtSec: sec
        })
      ]);
    }

    const result = await saveReadingWithAlerts(repo, device, input(0.5, NOW_SEC), NOW_MS);
    expect(result.kind).toBe("saved");
    if (result.kind === "saved") {
      expect(result.alerts.map((alert) => alert.rule_id)).toContain("R01");
    }
  });

  it("applies the 1000 L limit to a facility session", async () => {
    h.database.sqlite.prepare("UPDATE sessions SET facility_mode = 1").run();
    h.database.sqlite
      .prepare(
        "INSERT INTO daily_summaries (id, device_id, date_jst, total_liters, updated_at) VALUES ('sum', ?, '2026-06-24', 500, ?)"
      )
      .run(device.id, new Date(NOW_MS).toISOString());

    const result = await saveReadingWithAlerts(repo, device, input(1, NOW_SEC), NOW_MS);
    expect(result.kind === "saved" && result.alerts.map((alert) => alert.rule_id)).not.toContain("R03");
  });

  it("raises R03 for a normal session above 200 L and stores the alert", async () => {
    h.database.sqlite
      .prepare(
        "INSERT INTO daily_summaries (id, device_id, date_jst, total_liters, updated_at) VALUES ('sum', ?, '2026-06-24', 199.95, ?)"
      )
      .run(device.id, new Date(NOW_MS).toISOString());

    const result = await saveReadingWithAlerts(repo, device, input(1, NOW_SEC, 0.1), NOW_MS);
    expect(result.kind === "saved" && result.alerts.map((alert) => alert.rule_id)).toContain("R03");

    const stored = h.database.sqlite.prepare("SELECT severity FROM alerts WHERE rule_id = 'R03'").get() as { severity: string };
    expect(stored.severity).toBe("caution");
  });

  it("updates online_at of the device after a saved reading", async () => {
    await saveReadingWithAlerts(repo, device, input(1, NOW_SEC), NOW_MS);
    const row = (await repo.findDeviceByToken("SVCDEV")) as DeviceRow;
    expect(row.online_at).toBe(new Date(NOW_MS).toISOString());
  });
});
