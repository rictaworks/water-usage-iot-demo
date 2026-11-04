import { createApp } from "../app";
import type { Bindings } from "../env";
import type { SimulatorOrder } from "../simulator/virtualSimulator";
import { createTestDatabase, type TestDatabase } from "./sqliteDatabase";

/** Durable Object の代わり。開始・停止の呼び出しを記録する。 */
export class FakeSimulatorNamespace {
  readonly orders: SimulatorOrder[] = [];
  running = false;

  idFromName(name: string): string {
    return name;
  }

  get(_id: string) {
    return {
      start: async (order: SimulatorOrder) => {
        this.running = true;
        this.orders.push(order);
      },
      stop: async () => {
        this.running = false;
      },
      status: async () => ({ running: this.running })
    };
  }
}

export interface TestHarness {
  database: TestDatabase;
  simulator: FakeSimulatorNamespace;
  env: Bindings;
  pending: Promise<unknown>[];
  executionCtx: ExecutionContext;
  /** 同期的なリクエスト送信。Set-Cookie 等は Response のまま返す。 */
  request: (path: string, init?: RequestInit) => Promise<Response>;
}

export const TEST_ADMIN_TOKEN = "test-admin-token";

export function createHarness(overrides: Partial<Bindings> = {}): TestHarness {
  const database = createTestDatabase();
  const honoApp = createApp();
  const simulator = new FakeSimulatorNamespace();
  const pending: Promise<unknown>[] = [];
  const executionCtx = {
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
    passThroughOnException() {}
  } as unknown as ExecutionContext;

  const env = {
    DB: database.db as unknown as D1Database,
    ASSETS: {} as Fetcher,
    SIMULATOR: simulator as unknown as Bindings["SIMULATOR"],
    APP_ENV: "development",
    ADMIN_RESET_TOKEN: TEST_ADMIN_TOKEN,
    ...overrides
  } satisfies Bindings;

  return {
    database,
    simulator,
    env,
    pending,
    executionCtx,
    request: (path, init) => Promise.resolve(honoApp.request(path, init, env, executionCtx))
  };
}

/** JSON で POST / PUT する。 */
export function jsonInit(method: string, body: unknown, headers: Record<string, string> = {}): RequestInit {
  return {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  };
}

/** Set-Cookie から session_id の値を取り出す。 */
export function sessionCookieFrom(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");
  if (setCookie === null) return null;
  const match = /session_id=([^;]+)/.exec(setCookie);
  return match?.[1] ?? null;
}

/** GET /api/session で新しいセッションを作り、ID を返す。 */
export async function createSession(harness: TestHarness): Promise<string> {
  const response = await harness.request("/api/session");
  const body = (await response.json()) as { session_id: string };
  return body.session_id;
}
