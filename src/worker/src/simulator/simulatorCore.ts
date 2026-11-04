import { VIRTUAL_DEVICE_LABEL, VIRTUAL_DEVICE_TOKEN_BYTES } from "../config/constants";
import { saveReadingWithAlerts } from "../services/readingService";
import { toIsoMillis } from "../lib/time";
import type { DeviceRow, WaterRepository } from "../repo/waterRepository";

/** 仮想デバイスの1回の計測量を流量から求める除数（5秒周期 = 1/12 分。Rails と同じ）。 */
export const VIRTUAL_VOLUME_DIVISOR = 12.0;

export type TickOutcome = "persisted" | "duplicate" | "session_missing" | "no_virtual_device";

/**
 * シミュレーターの1回分。Rails VirtualSimulator#persist_reading の移植。
 * セッションが消えた場合は session_missing を返し、呼び出し側がシミュレーターを止める。
 */
export async function tickSimulator(
  repo: WaterRepository,
  sessionId: string,
  flowRate: number,
  nowMs: number
): Promise<TickOutcome> {
  const session = await repo.findSession(sessionId);
  if (!session) return "session_missing";

  const device = await repo.findVirtualDevice(sessionId);
  if (!device) return "no_virtual_device";

  const result = await saveReadingWithAlerts(
    repo,
    device,
    {
      flowRate,
      volumeDelta: flowRate / VIRTUAL_VOLUME_DIVISOR,
      temperature: null,
      receivedAtMs: nowMs,
      receivedAtSec: Math.floor(nowMs / 1000)
    },
    nowMs
  );
  return result.kind === "duplicate" ? "duplicate" : "persisted";
}

/** Rails SimulatorController#start の find_or_create_by!(is_virtual: true) に相当する。 */
export async function findOrCreateVirtualDevice(
  repo: WaterRepository,
  sessionId: string,
  nowMs: number,
  randomHex: () => string
): Promise<DeviceRow> {
  const existing = await repo.findVirtualDevice(sessionId);
  if (existing) return existing;

  const nowIso = toIsoMillis(nowMs);
  const id = crypto.randomUUID();
  await repo.runBatch([
    repo.insertDeviceStatement({
      id,
      sessionId,
      deviceToken: randomHex(),
      label: VIRTUAL_DEVICE_LABEL,
      isVirtual: true,
      createdAt: nowIso,
      onlineAt: nowIso
    })
  ]);

  const created = await repo.findVirtualDevice(sessionId);
  if (!created) throw new Error(`virtual device was not created for session ${sessionId}`);
  return created;
}

/** 仮想デバイス用のトークン（16 バイトの乱数を 16 進数で表す。Rails の SecureRandom.hex(16) と同じ長さ）。 */
export function randomHexToken(): string {
  const bytes = new Uint8Array(VIRTUAL_DEVICE_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
