import { describe, expect, it } from "vitest";
import { castBoolean, isPresent, toFloatOrZero, toIntOrZero, toText } from "./values";
import { toIsoSeconds, toJstDate, toJstHour } from "./time";

describe("Rails 互換の値変換", () => {
  it("casts booleans the way ActiveModel::Type::Boolean does", () => {
    expect(castBoolean(true)).toBe(true);
    expect(castBoolean("true")).toBe(true);
    expect(castBoolean(false)).toBe(false);
    expect(castBoolean("false")).toBe(false);
    expect(castBoolean("0")).toBe(false);
    expect(castBoolean("off")).toBe(false);
    expect(castBoolean(0)).toBe(false);
    expect(castBoolean("")).toBeNull();
    expect(castBoolean(undefined)).toBeNull();
  });

  it("parses leading numbers and falls back to 0 like to_f / to_i", () => {
    expect(toFloatOrZero("2.5L")).toBe(2.5);
    expect(toFloatOrZero("abc")).toBe(0);
    expect(toFloatOrZero(1.25)).toBe(1.25);
    expect(toIntOrZero("1700000000.9")).toBe(1700000000);
    expect(toIntOrZero("x")).toBe(0);
  });

  it("treats only non-blank values as present", () => {
    expect(isPresent("bot")).toBe(true);
    expect(isPresent("  ")).toBe(false);
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent(false)).toBe(false);
    expect(isPresent([])).toBe(false);
  });

  it("returns text only for strings and numbers", () => {
    expect(toText("abc")).toBe("abc");
    expect(toText(12)).toBe("12");
    expect(toText({})).toBeNull();
  });
});

describe("time helpers", () => {
  it("drops milliseconds in the Rails iso8601 style", () => {
    expect(toIsoSeconds(Date.UTC(2026, 5, 24, 1, 2, 3, 456))).toBe("2026-06-24T01:02:03Z");
  });

  it("uses the JST calendar day and hour", () => {
    const threeAmJst = Date.UTC(2026, 5, 23, 18, 0, 0);
    expect(toJstHour(threeAmJst)).toBe(3);
    expect(toJstDate(threeAmJst)).toBe("2026-06-24");
  });
});
