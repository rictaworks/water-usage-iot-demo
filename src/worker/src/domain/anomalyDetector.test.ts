import { describe, expect, it } from "vitest";
import { detectAnomalies, type AnomalyInput } from "./anomalyDetector";

const NOW_MS = Date.UTC(2026, 5, 24, 1, 0, 0); // 2026-06-24 10:00 JST
const JST_3AM_MS = Date.UTC(2026, 5, 23, 18, 0, 0); // 2026-06-24 03:00 JST
const JST_10AM_MS = Date.UTC(2026, 5, 24, 1, 0, 0);

function input(overrides: Partial<AnomalyInput> = {}): AnomalyInput {
  return {
    flowRate: 1,
    receivedAtMs: NOW_MS,
    facilityMode: false,
    findOldestFlowingReceivedAtMs: async () => null,
    findDailyTotalLiters: async () => null,
    ...overrides
  };
}

function ruleIds(alerts: { rule_id: string }[]): string[] {
  return alerts.map((alert) => alert.rule_id);
}

describe("detectAnomalies (Rails AnomalyDetector の移植)", () => {
  describe("R01: continuous flow", () => {
    it("flags flow that has been running for 30+ minutes", async () => {
      const oldest = NOW_MS - 31 * 60_000;
      const alerts = await detectAnomalies(
        input({ flowRate: 0.5, findOldestFlowingReceivedAtMs: async () => oldest }),
        NOW_MS
      );
      expect(ruleIds(alerts)).toContain("R01");
    });

    it("does not flag a short run", async () => {
      const oldest = NOW_MS - 10 * 60_000;
      const alerts = await detectAnomalies(
        input({ flowRate: 0.5, findOldestFlowingReceivedAtMs: async () => oldest }),
        NOW_MS
      );
      expect(ruleIds(alerts)).not.toContain("R01");
    });

    it("does not look at history when the current flow is at or below 0.1", async () => {
      let queried = false;
      await detectAnomalies(
        input({
          flowRate: 0.1,
          findOldestFlowingReceivedAtMs: async () => {
            queried = true;
            return NOW_MS - 60 * 60_000;
          }
        }),
        NOW_MS
      );
      expect(queried).toBe(false);
    });
  });

  describe("R02: high flow", () => {
    it("flags a flow of 20.0 or more", async () => {
      expect(ruleIds(await detectAnomalies(input({ flowRate: 25 }), NOW_MS))).toContain("R02");
      expect(ruleIds(await detectAnomalies(input({ flowRate: 20 }), NOW_MS))).toContain("R02");
    });

    it("does not flag a flow below 20.0", async () => {
      expect(ruleIds(await detectAnomalies(input({ flowRate: 5 }), NOW_MS))).not.toContain("R02");
    });
  });

  describe("R03: daily usage", () => {
    it("flags usage above the normal limit of 200 L", async () => {
      const alerts = await detectAnomalies(input({ findDailyTotalLiters: async () => 250 }), NOW_MS);
      expect(ruleIds(alerts)).toContain("R03");
      expect(alerts.find((alert) => alert.rule_id === "R03")?.severity).toBe("caution");
    });

    it("uses the 1000 L limit in facility mode", async () => {
      const alerts = await detectAnomalies(
        input({ facilityMode: true, findDailyTotalLiters: async () => 250 }),
        NOW_MS
      );
      expect(ruleIds(alerts)).not.toContain("R03");
    });

    it("does nothing when there is no daily summary yet", async () => {
      expect(ruleIds(await detectAnomalies(input({ findDailyTotalLiters: async () => null }), NOW_MS))).not.toContain(
        "R03"
      );
    });
  });

  describe("R04: late-night flow (JST 02:00-04:59)", () => {
    it("flags flow at 03:00 JST", async () => {
      const alerts = await detectAnomalies(input({ receivedAtMs: JST_3AM_MS }), JST_3AM_MS);
      expect(ruleIds(alerts)).toContain("R04");
    });

    it("does not flag flow at 10:00 JST", async () => {
      const alerts = await detectAnomalies(input({ receivedAtMs: JST_10AM_MS }), JST_10AM_MS);
      expect(ruleIds(alerts)).not.toContain("R04");
    });
  });

  it("keeps the R01 to R04 order when several rules fire", async () => {
    const alerts = await detectAnomalies(
      input({
        flowRate: 25,
        receivedAtMs: JST_3AM_MS,
        findOldestFlowingReceivedAtMs: async () => JST_3AM_MS - 60 * 60_000,
        findDailyTotalLiters: async () => 300
      }),
      JST_3AM_MS
    );
    expect(ruleIds(alerts)).toEqual(["R01", "R02", "R03", "R04"]);
  });
});
