import type { Bindings } from "./env";
import type { Params } from "./lib/params";
import type { WaterRepository } from "./repo/waterRepository";

/** Hono のコンテキスト型。ミドルウェアが params と repo を載せる。 */
export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    params: Params;
    repo: WaterRepository;
  };
};
