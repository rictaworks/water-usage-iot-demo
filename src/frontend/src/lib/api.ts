import type { Alert, Device, Reading, RegisteredDevice, Scenario } from '@/types';

const SESSION_STORAGE_KEY = 'water_iot_session_id';

let sessionId: string | null = null;
let sessionPromise: Promise<{ session_id: string }> | null = null;

function sessionHeaders(): Record<string, string> {
  return sessionId ? { 'X-Session-Id': sessionId } : {};
}

function clearSession() {
  sessionId = null;
  sessionPromise = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

async function fetchJson<T>(path: string, options?: RequestInit & { _skipSessionWait?: boolean; _isRetry?: boolean }): Promise<T> {
  // Wait for in-flight session initialization (skip for the session endpoint itself to avoid deadlock)
  if (sessionPromise && !sessionId && !options?._skipSessionWait) {
    await sessionPromise;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _skipSessionWait, _isRetry, ...fetchOptions } = options ?? {};
  const response = await fetch(path, {
    credentials: 'include',
    ...fetchOptions,
    headers: {
      ...sessionHeaders(),
      ...(fetchOptions.headers as Record<string, string> | undefined),
    },
  });

  // On 401 with a stale session, clear and retry once with a fresh session
  if (response.status === 401 && !_skipSessionWait && !_isRetry) {
    clearSession();
    await getSession();
    return fetchJson<T>(path, { ...options, _isRetry: true });
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getSession(): Promise<{ session_id: string }> {
  if (!sessionId && typeof window !== 'undefined') {
    sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  }
  if (sessionId) return { session_id: sessionId };
  if (!sessionPromise) {
    sessionPromise = fetchJson<{ session_id: string }>('/api/session', { _skipSessionWait: true }).then((data) => {
      sessionId = data.session_id;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
      }
      return data;
    });
  }
  return sessionPromise;
}

export function getSessionId(): string | null {
  return sessionId;
}

export async function getDevices(): Promise<Device[]> {
  return fetchJson<Device[]>('/api/devices');
}

export async function registerDevice(label: string, token: string): Promise<RegisteredDevice> {
  return fetchJson<RegisteredDevice>('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, device_token: token }),
  });
}

export async function getAlerts(deviceId: number): Promise<Alert[]> {
  return fetchJson<Alert[]>(`/api/devices/${deviceId}/alerts`);
}

export async function getReadings(deviceId: number): Promise<Reading[]> {
  return fetchJson<Reading[]>(`/api/devices/${deviceId}/readings`);
}

export async function startSimulator(scenario: Scenario): Promise<void> {
  await fetchJson<unknown>('/api/simulator/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
}

export async function stopSimulator(): Promise<void> {
  await fetchJson<unknown>('/api/simulator/stop', { method: 'POST' });
}

export async function getSimulatorStatus(): Promise<{ running: boolean; scenario: Scenario | null }> {
  return fetchJson<{ running: boolean; scenario: Scenario | null }>('/api/simulator/status');
}

export async function setPump(deviceId: string, pumpOn: boolean): Promise<{ pump_on: boolean }> {
  return fetchJson<{ pump_on: boolean }>(`/api/devices/${deviceId}/pump`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pump_on: pumpOn }),
  });
}
