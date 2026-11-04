import { describe, expect, it } from "vitest";
import { computeLedState } from "./ledController";

describe("computeLedState (Rails LedController の移植)", () => {
  it("returns off when there are no alerts and the flow is 0", () => {
    expect(computeLedState([], 0)).toEqual({ led_color: "off", led_blink_hz: 0, fan_speed_pct: 0 });
  });

  it("returns green when there are no alerts and the flow is above 0", () => {
    expect(computeLedState([], 1.5)).toEqual({ led_color: "green", led_blink_hz: 0, fan_speed_pct: 30 });
  });

  it("returns yellow for the R03 caution alert", () => {
    expect(computeLedState([{ rule_id: "R03" }], 1)).toEqual({ led_color: "yellow", led_blink_hz: 1, fan_speed_pct: 60 });
  });

  it.each(["R01", "R02", "R04"])("returns red for the %s warning alert", (ruleId) => {
    expect(computeLedState([{ rule_id: ruleId }], 1)).toEqual({ led_color: "red", led_blink_hz: 4, fan_speed_pct: 100 });
  });

  it("gives warning precedence over caution", () => {
    expect(computeLedState([{ rule_id: "R03" }, { rule_id: "R01" }], 1)).toEqual({
      led_color: "red",
      led_blink_hz: 4,
      fan_speed_pct: 100
    });
  });
});
