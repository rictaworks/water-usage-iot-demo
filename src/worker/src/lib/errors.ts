import { MESSAGES } from "../config/messages";

/** HTTP ステータスと JSON 本文を持つ、クライアントに返すべきエラー。 */
export class ApiError extends Error {
  readonly status: 400 | 401 | 403 | 404 | 422 | 500;
  readonly body: Record<string, unknown>;

  constructor(status: 400 | 401 | 403 | 404 | 422 | 500, body: Record<string, unknown>) {
    super(typeof body.error === "string" ? body.error : JSON.stringify(body));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const errors = {
  forbidden: () => new ApiError(403, { error: MESSAGES.forbidden }),
  sessionNotFound: () => new ApiError(401, { error: MESSAGES.sessionNotFound }),
  deviceNotFound: () => new ApiError(404, { error: MESSAGES.deviceNotFound }),
  unauthorized: () => new ApiError(401, { error: MESSAGES.unauthorized }),
  invalidJson: () => new ApiError(400, { error: MESSAGES.invalidJson }),
  unknownScenario: (name: string) => new ApiError(422, { error: `${MESSAGES.unknownScenarioPrefix}${name}` })
} as const;

/** D1 / SQLite の UNIQUE 制約違反かどうか（重複の冪等処理に使う）。 */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed");
}
