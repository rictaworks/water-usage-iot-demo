import type { Hono } from "hono";
import type { Bindings } from "../env";
import { errors } from "../lib/errors";
import { toText } from "../lib/values";
import { findCurrentSession } from "../session/currentSession";
import { parseScenarioPattern } from "../simulator/pattern";
import { findOrCreateVirtualDevice, randomHexToken } from "../simulator/simulatorCore";
import type { SimulatorOrder } from "../simulator/virtualSimulator";
import type { AppEnv } from "../types";

/** シミュレーター（セッションごとの Durable Object）へのアクセス。テストでは差し替える。 */
export interface SimulatorStub {
  start(order: SimulatorOrder): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<{ running: boolean }>;
}

export function simulatorStub(env: Pick<Bindings, "SIMULATOR">, sessionId: string): SimulatorStub {
  const id = env.SIMULATOR.idFromName(sessionId);
  return env.SIMULATOR.get(id) as unknown as SimulatorStub;
}

/** /api/simulator/status, /start, /stop。Rails SimulatorController の移植。 */
export function registerSimulatorRoutes(app: Hono<AppEnv>): void {
  app.get("/api/simulator/status", async (c) => {
    const session = await findCurrentSession(c);
    if (!session) throw errors.sessionNotFound();

    const { running } = await simulatorStub(c.env, session.id).status();
    return c.json({ running, scenario: null });
  });

  app.post("/api/simulator/start", async (c) => {
    const session = await findCurrentSession(c);
    if (!session) throw errors.sessionNotFound();

    const repo = c.get("repo");
    await findOrCreateVirtualDevice(repo, session.id, Date.now(), randomHexToken);

    const scenario = toText(c.get("params").scenario) ?? "";
    const preset = await repo.findPresetByName(scenario);
    if (!preset) throw errors.unknownScenario(scenario);

    // 不正な pattern_json は例外にする（黙って 0 L/min で動かさない）。
    const pattern = parseScenarioPattern(preset.pattern_json);
    await simulatorStub(c.env, session.id).start({ sessionId: session.id, scenario, pattern });
    return c.json({ status: "started", scenario });
  });

  app.post("/api/simulator/stop", async (c) => {
    const session = await findCurrentSession(c);
    if (!session) throw errors.sessionNotFound();

    await simulatorStub(c.env, session.id).stop();
    return c.json({ status: "stopped" });
  });
}
