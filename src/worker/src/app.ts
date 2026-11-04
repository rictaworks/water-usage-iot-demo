import { Hono } from "hono";
import { MESSAGES } from "./config/messages";
import { ApiError } from "./lib/errors";
import { readRequestParams } from "./lib/params";
import { WaterRepository } from "./repo/waterRepository";
import { registerAdminRoutes } from "./routes/admin";
import { registerDeviceRoutes } from "./routes/devices";
import { registerReadingRoutes } from "./routes/readings";
import { registerSessionRoutes } from "./routes/session";
import { registerSimulatorRoutes } from "./routes/simulator";
import { registerStreamRoutes } from "./routes/stream";
import type { AppEnv } from "./types";

/**
 * Hono アプリ本体。Rails の config/routes.rb と同じ API 面を提供する。
 * 静的ファイル（フロントエンド）は Workers Assets が配信し、この Worker は /api/* だけを実行する。
 */
export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.onError((error, c) => {
    if (error instanceof ApiError) {
      return c.json(error.body, error.status);
    }
    console.error("unhandled error", error);
    return c.json({ error: MESSAGES.internalError }, 500);
  });

  app.notFound((c) => c.json({ error: MESSAGES.notFound }, 404));

  app.use("/api/*", async (c, next) => {
    c.set("params", await readRequestParams(c.req.raw));
    c.set("repo", new WaterRepository(c.env.DB));
    await next();
  });

  registerSessionRoutes(app);
  registerDeviceRoutes(app);
  registerReadingRoutes(app);
  registerStreamRoutes(app);
  registerSimulatorRoutes(app);
  registerAdminRoutes(app);

  return app;
}
