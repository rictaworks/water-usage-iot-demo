import type { Hono } from "hono";
import {
  STREAM_DATA_PUSH_INTERVAL_MS,
  STREAM_HEADERS,
  STREAM_HEARTBEAT_CHUNK,
  STREAM_HEARTBEAT_INTERVAL_MS
} from "../config/constants";
import { MESSAGES } from "../config/messages";
import { buildSessionEvents } from "../stream/sessionEvents";
import { findCurrentSession } from "../session/currentSession";
import type { WaterRepository } from "../repo/waterRepository";
import type { AppEnv } from "../types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /api/stream（SSE）。Rails StreamsController の移植。
 * 接続ごとに、10 秒ごとのデータ送信と 5 秒ごとのハートビートを行う。
 * クライアントが切断すると cancel が呼ばれ、ループを終える。
 */
export function registerStreamRoutes(app: Hono<AppEnv>): void {
  app.get("/api/stream", async (c) => {
    const session = await findCurrentSession(c);
    if (!session) {
      const body = `event: error\ndata: ${JSON.stringify({ error: MESSAGES.sessionNotFound })}\n\n`;
      return new Response(body, { headers: STREAM_HEADERS });
    }

    return new Response(createSessionStream(c.get("repo"), session.id), { headers: STREAM_HEADERS });
  });
}

export function createSessionStream(repo: WaterRepository, sessionId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let closed = false;

  const pump = async (controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> => {
    const pushedAlertIds = new Set<string>();
    let lastPushMs = Date.now();
    try {
      while (!closed) {
        let chunk = "";
        if (Date.now() - lastPushMs >= STREAM_DATA_PUSH_INTERVAL_MS) {
          chunk += await buildSessionEvents(repo, sessionId, pushedAlertIds);
          lastPushMs = Date.now();
        }
        chunk += STREAM_HEARTBEAT_CHUNK;
        controller.enqueue(encoder.encode(chunk));
        await sleep(STREAM_HEARTBEAT_INTERVAL_MS);
      }
    } catch (error) {
      if (!closed) console.error(`SSE stream error for session ${sessionId}`, error);
    } finally {
      closed = true;
      try {
        controller.close();
      } catch {
        // 既に切断されている場合は閉じる必要がない。
      }
    }
  };

  return new ReadableStream<Uint8Array>({
    start(controller) {
      void pump(controller);
    },
    cancel() {
      closed = true;
    }
  });
}
