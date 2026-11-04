import { createApp } from "./app";
import { DEFAULT_LOCALE_PATH } from "./config/constants";
import type { Bindings } from "./env";
import { WaterRepository } from "./repo/waterRepository";

export { VirtualSimulator } from "./simulator/virtualSimulator";

const app = createApp();

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    // ルートは既定ロケールのダッシュボードへ転送する（静的書き出しのルートページは使わない）。
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return Response.redirect(new URL(DEFAULT_LOCALE_PATH, url).toString(), 302);
    }
    return app.fetch(request, env, ctx);
  },

  /** JST 03:00（UTC 18:00）の日次リセット。全データを削除する（Rails の DailyResetJob 相当）。 */
  async scheduled(_controller: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(new WaterRepository(env.DB).resetDailyData());
  }
} satisfies ExportedHandler<Bindings>;
