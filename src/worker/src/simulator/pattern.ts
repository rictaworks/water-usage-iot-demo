import { DEFAULT_SCENARIO_INTERVAL_SEC } from "../config/constants";

/** scenario_presets.pattern_json の形（Rails VirtualSimulator の calculate_flow_rate と同じ種別）。 */
export type ScenarioPattern =
  | { type: "normal"; min: number; max: number; intervalSec: number }
  | { type: "leak"; flowRate: number; intervalSec: number }
  | { type: "peak"; base: number; spike: number; spikeEvery: number; intervalSec: number };

function requireNumber(raw: Record<string, unknown>, key: string): number {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`invalid scenario pattern: ${key} must be a number`);
  }
  return value;
}

function optionalIntervalSec(raw: Record<string, unknown>): number {
  if (raw.interval_sec === undefined) return DEFAULT_SCENARIO_INTERVAL_SEC;
  const value = requireNumber(raw, "interval_sec");
  if (value <= 0) throw new Error("invalid scenario pattern: interval_sec must be positive");
  return value;
}

/**
 * pattern_json を検証付きで読む。不正な値は例外にする（黙って 0 にしない）。
 * interval_sec は Rails 版と同じく省略時 5 秒。
 */
export function parseScenarioPattern(patternJson: string): ScenarioPattern {
  let raw: unknown;
  try {
    raw = JSON.parse(patternJson);
  } catch {
    throw new Error("invalid scenario pattern: not JSON");
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("invalid scenario pattern: not an object");
  }
  const record = raw as Record<string, unknown>;
  const intervalSec = optionalIntervalSec(record);

  switch (record.type) {
    case "normal": {
      const min = requireNumber(record, "min");
      const max = requireNumber(record, "max");
      return { type: "normal", min, max, intervalSec };
    }
    case "leak":
      return { type: "leak", flowRate: requireNumber(record, "flow_rate"), intervalSec };
    case "peak": {
      const spikeEvery = requireNumber(record, "spike_every");
      if (!Number.isInteger(spikeEvery) || spikeEvery <= 0) {
        throw new Error("invalid scenario pattern: spike_every must be a positive integer");
      }
      return {
        type: "peak",
        base: requireNumber(record, "base"),
        spike: requireNumber(record, "spike"),
        spikeEvery,
        intervalSec
      };
    }
    default:
      throw new Error(`invalid scenario pattern: unknown type ${String(record.type)}`);
  }
}

/** 第 tick 回の流量（L/min）。normal は一様乱数で揺らす。 */
export function calculateFlowRate(pattern: ScenarioPattern, tick: number, random: () => number = Math.random): number {
  switch (pattern.type) {
    case "normal":
      return pattern.min + random() * (pattern.max - pattern.min);
    case "leak":
      return pattern.flowRate;
    case "peak":
      return tick % pattern.spikeEvery === 0 ? pattern.spike : pattern.base;
  }
}
