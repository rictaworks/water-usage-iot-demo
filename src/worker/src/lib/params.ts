import { errors } from "./errors";

/** Rails の params に相当する、クエリ・ボディを合わせた値（後勝ち。ボディがクエリを上書きする）。 */
export type Params = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * リクエストのクエリとボディを読む。ボディは JSON・フォーム（urlencoded / multipart）に対応する。
 * リクエストボディは一度しか読めないため、ミドルウェアで1回だけ呼ぶこと。
 */
export async function readRequestParams(request: Request): Promise<Params> {
  const query: Params = Object.fromEntries(new URL(request.url).searchParams.entries());
  if (request.method === "GET" || request.method === "HEAD") {
    return query;
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch {
      throw errors.invalidJson();
    }
    return { ...query, ...(isPlainObject(parsed) ? parsed : {}) };
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return { ...query, ...Object.fromEntries(form.entries()) };
  }

  return query;
}
