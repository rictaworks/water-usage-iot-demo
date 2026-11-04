import { JST_OFFSET_MS } from "../config/constants";

/** 保存・JSON 返却に使う ISO8601（UTC・ミリ秒つき）。 */
export function toIsoMillis(ms: number): string {
  return new Date(ms).toISOString();
}

/** Rails の Time#iso8601（小数秒なし）に合わせた表記。SSE の時刻に使う。 */
export function toIsoSeconds(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** JST の日付（YYYY-MM-DD）。Rails の Date.current（Tokyo）に相当。 */
export function toJstDate(ms: number): string {
  return new Date(ms + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/** JST の時（0〜23）。 */
export function toJstHour(ms: number): number {
  return new Date(ms + JST_OFFSET_MS).getUTCHours();
}
