/**
 * Rails の型変換（to_f / to_i / ActiveModel::Type::Boolean）に合わせた値の変換。
 * 変換できない値は Rails と同じく 0 として扱う（数値系）。真偽値は null を「不明」として返す。
 */

const LEADING_FLOAT = /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/;
const LEADING_INT = /^\s*[+-]?\d+/;
const FALSE_VALUES: readonly unknown[] = [false, 0, "0", "f", "F", "false", "FALSE", "off", "OFF"];

export function toText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

export function toFloatOrZero(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const match = LEADING_FLOAT.exec(value);
    return match ? Number.parseFloat(match[0]) : 0;
  }
  return 0;
}

export function toIntOrZero(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : 0;
  if (typeof value === "string") {
    const match = LEADING_INT.exec(value);
    return match ? Number.parseInt(match[0], 10) : 0;
  }
  return 0;
}

/** ActiveModel::Type::Boolean の cast。空文字・null・未指定は null（不明）。 */
export function castBoolean(value: unknown): boolean | null {
  if (value === undefined || value === null || value === "") return null;
  return !FALSE_VALUES.includes(value);
}

/** Rails の present?（nil・空文字・空の配列/ハッシュ・false は不在扱い）。 */
export function isPresent(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}
