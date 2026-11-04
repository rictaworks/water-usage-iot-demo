import { beforeEach, describe, expect, it } from "vitest";
import { WaterRepository } from "../repo/waterRepository";
import { createHarness, createSession, type TestHarness } from "../testing/harness";
import { findOrCreateVirtualDevice, tickSimulator, VIRTUAL_VOLUME_DIVISOR } from "./simulatorCore";

const NOW_MS = Date.UTC(2026, 5, 24, 1, 0, 5);

describe("tickSimulator (Rails VirtualSimulator#persist_reading の移植)", () => {
  let h: TestHarness;
  let repo: WaterRepository;
  let sessionId: string;

  beforeEach(async () => {
    h = createHarness();
    repo = new WaterRepository(h.database.db);
    sessionId = await createSession(h);
  });

  it("reports session_missing when the session no longer exists", async () => {
    expect(await tickSimulator(repo, "no-such-session", 1, NOW_MS)).toBe("session_missing");
  });

  it("reports no_virtual_device until the virtual device exists", async () => {
    expect(await tickSimulator(repo, sessionId, 1, NOW_MS)).toBe("no_virtual_device");
  });

  it("records a reading with volume = flow / 12 and adds it to the daily summary", async () => {
    await findOrCreateVirtualDevice(repo, sessionId, NOW_MS, () => "a".repeat(32));

    expect(await tickSimulator(repo, sessionId, 2.4, NOW_MS)).toBe("persisted");

    const reading = h.database.sqlite
      .prepare("SELECT flow_rate, volume_delta, received_at, received_at_sec FROM flow_readings")
      .get() as { flow_rate: number; volume_delta: number; received_at: string; received_at_sec: number };
    expect(reading.flow_rate).toBe(2.4);
    expect(reading.volume_delta).toBeCloseTo(2.4 / VIRTUAL_VOLUME_DIVISOR, 9);
    expect(reading.received_at).toBe("2026-06-24T01:00:05.000Z");
    expect(reading.received_at_sec).toBe(Math.floor(NOW_MS / 1000));

    const summary = h.database.sqlite.prepare("SELECT total_liters FROM daily_summaries").get() as { total_liters: number };
    expect(summary.total_liters).toBeCloseTo(2.4 / 12, 9);
  });

  it("reports duplicate when the same second is recorded twice", async () => {
    await findOrCreateVirtualDevice(repo, sessionId, NOW_MS, () => "b".repeat(32));
    expect(await tickSimulator(repo, sessionId, 1, NOW_MS)).toBe("persisted");
    expect(await tickSimulator(repo, sessionId, 1, NOW_MS)).toBe("duplicate");
  });

  it("writes an R02 alert when the simulated flow is high", async () => {
    await findOrCreateVirtualDevice(repo, sessionId, NOW_MS, () => "c".repeat(32));
    await tickSimulator(repo, sessionId, 25, NOW_MS);

    const alerts = h.database.sqlite.prepare("SELECT rule_id FROM alerts").all() as { rule_id: string }[];
    expect(alerts.map((row) => row.rule_id)).toEqual(["R02"]);
  });
});

describe("findOrCreateVirtualDevice", () => {
  it("creates one virtual device per session and reuses it afterwards", async () => {
    const h = createHarness();
    const repo = new WaterRepository(h.database.db);
    const sessionId = await createSession(h);

    const first = await findOrCreateVirtualDevice(repo, sessionId, NOW_MS, () => "d".repeat(32));
    const second = await findOrCreateVirtualDevice(repo, sessionId, NOW_MS, () => "e".repeat(32));
    expect(second.id).toBe(first.id);
    expect(first.label).toBe("仮想デバイス");
    expect(first.is_virtual).toBe(1);
    expect(first.device_token).toBe("d".repeat(32));
  });
});
