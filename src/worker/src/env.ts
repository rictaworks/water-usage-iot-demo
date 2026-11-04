import type { VirtualSimulator } from "./simulator/virtualSimulator";

/** Worker のバインディング（wrangler.jsonc と対応）。 */
export interface Bindings {
  DB: D1Database;
  ASSETS: Fetcher;
  SIMULATOR: DurableObjectNamespace<VirtualSimulator>;
  /** "production" のときのみ Cookie を Secure にする。 */
  APP_ENV: string;
  /** 日次リセット API の Bearer トークン（wrangler secret put で設定。未設定なら API は常に 401）。 */
  ADMIN_RESET_TOKEN?: string;
}

export function isProduction(env: Pick<Bindings, "APP_ENV">): boolean {
  return env.APP_ENV === "production";
}
