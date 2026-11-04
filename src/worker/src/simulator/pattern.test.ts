import { describe, expect, it } from "vitest";
import { calculateFlowRate, parseScenarioPattern } from "./pattern";

describe("parseScenarioPattern", () => {
  it("reads the normal, leak and peak presets with snake_case keys", () => {
    expect(parseScenarioPattern('{"type":"normal","min":1.0,"max":3.0,"interval_sec":5}')).toEqual({
      type: "normal",
      min: 1,
      max: 3,
      intervalSec: 5
    });
    expect(parseScenarioPattern('{"type":"leak","flow_rate":0.2,"duration_min":35,"interval_sec":5}')).toEqual({
      type: "leak",
      flowRate: 0.2,
      intervalSec: 5
    });
    expect(
      parseScenarioPattern('{"type":"peak","base":2.0,"spike":25.0,"spike_every":10,"interval_sec":5}')
    ).toEqual({ type: "peak", base: 2, spike: 25, spikeEvery: 10, intervalSec: 5 });
  });

  it("defaults interval_sec to 5 when it is omitted (Rails 版と同じ)", () => {
    const pattern = parseScenarioPattern('{"type":"leak","flow_rate":0.2}');
    expect(pattern.intervalSec).toBe(5);
  });

  it.each([
    ["not JSON", "{"],
    ["unknown type", '{"type":"storm"}'],
    ["missing number", '{"type":"normal","min":1}'],
    ["zero spike_every", '{"type":"peak","base":1,"spike":2,"spike_every":0}'],
    ["non-positive interval", '{"type":"leak","flow_rate":0.2,"interval_sec":0}']
  ])("rejects an invalid pattern (%s) instead of guessing", (_label, json) => {
    expect(() => parseScenarioPattern(json)).toThrow(/invalid scenario pattern/);
  });
});

describe("calculateFlowRate", () => {
  it("returns the leak rate every tick", () => {
    const pattern = parseScenarioPattern('{"type":"leak","flow_rate":0.2}');
    expect(calculateFlowRate(pattern, 0)).toBe(0.2);
    expect(calculateFlowRate(pattern, 99)).toBe(0.2);
  });

  it("spikes on every spike_every-th tick, starting at tick 0", () => {
    const pattern = parseScenarioPattern('{"type":"peak","base":2,"spike":25,"spike_every":10}');
    expect(calculateFlowRate(pattern, 0)).toBe(25);
    expect(calculateFlowRate(pattern, 1)).toBe(2);
    expect(calculateFlowRate(pattern, 10)).toBe(25);
  });

  it("maps the random value into the normal range", () => {
    const pattern = parseScenarioPattern('{"type":"normal","min":1,"max":3}');
    expect(calculateFlowRate(pattern, 0, () => 0)).toBe(1);
    expect(calculateFlowRate(pattern, 0, () => 0.5)).toBe(2);
  });
});
