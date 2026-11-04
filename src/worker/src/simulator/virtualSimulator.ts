import { DurableObject } from "cloudflare:workers";
import type { Bindings } from "../env";
import { WaterRepository } from "../repo/waterRepository";
import { calculateFlowRate, type ScenarioPattern } from "./pattern";
import { tickSimulator } from "./simulatorCore";

export interface SimulatorOrder {
  sessionId: string;
  scenario: string;
  pattern: ScenarioPattern;
}

interface SimulatorState extends SimulatorOrder {
  running: boolean;
  tick: number;
}

const STATE_KEY = "simulator_state";
const MILLISECONDS_PER_SECOND = 1000;

/**
 * 仮想デバイスのシナリオ再生（Rails の VirtualSimulator スレッドの代替）。
 * セッションごとに1インスタンス。Alarm で周期（既定 5 秒）ごとに1件ずつ流量を記録する。
 * セッションが消えた場合は自分で停止する（日次リセット後にアラームが回り続けないように）。
 */
export class VirtualSimulator extends DurableObject<Bindings> {
  async start(order: SimulatorOrder): Promise<void> {
    const state: SimulatorState = { ...order, running: true, tick: 0 };
    await this.ctx.storage.put(STATE_KEY, state);
    // 開始直後に1件目を記録する（Rails と同じく最初の書き込みは待たない）。
    await this.ctx.storage.setAlarm(Date.now());
  }

  async stop(): Promise<void> {
    const state = await this.ctx.storage.get<SimulatorState>(STATE_KEY);
    if (state) {
      await this.ctx.storage.put(STATE_KEY, { ...state, running: false });
    }
    await this.ctx.storage.deleteAlarm();
  }

  async status(): Promise<{ running: boolean }> {
    const state = await this.ctx.storage.get<SimulatorState>(STATE_KEY);
    return { running: state?.running === true };
  }

  async alarm(): Promise<void> {
    const state = await this.ctx.storage.get<SimulatorState>(STATE_KEY);
    if (!state || !state.running) return;

    try {
      const flowRate = calculateFlowRate(state.pattern, state.tick);
      const outcome = await tickSimulator(new WaterRepository(this.env.DB), state.sessionId, flowRate, Date.now());
      if (outcome === "session_missing") {
        await this.ctx.storage.put(STATE_KEY, { ...state, running: false });
        return;
      }

      await this.ctx.storage.put(STATE_KEY, { ...state, tick: state.tick + 1 });
      await this.ctx.storage.setAlarm(Date.now() + state.pattern.intervalSec * MILLISECONDS_PER_SECOND);
    } catch (error) {
      // Rails 版はスレッドが例外で終了し、running? が false になる。同じ挙動にする。
      console.error(`VirtualSimulator error for session ${state.sessionId}`, error);
      await this.ctx.storage.put(STATE_KEY, { ...state, running: false });
    }
  }
}
