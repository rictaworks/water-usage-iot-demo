import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, createSession, type TestHarness } from "../testing/harness";

describe("GET /api/stream", () => {
  let h: TestHarness;

  beforeEach(() => {
    h = createHarness();
  });

  it("sends an error event and closes when there is no session", async () => {
    const response = await h.request("/api/stream");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(await response.text()).toBe('event: error\ndata: {"error":"Session not found"}\n\n');
  });

  it("opens an event stream for a session and starts with a heartbeat", async () => {
    const sessionId = await createSession(h);
    const response = await h.request(`/api/stream?session_id=${sessionId}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("x-accel-buffering")).toBe("no");

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    const first = await reader?.read();
    expect(new TextDecoder().decode(first?.value)).toBe(": heartbeat\n\n");
    await reader?.cancel();
  });
});
