import type { Alert, Device, Reading, Scenario } from '@/types';

let sessionId: string | null = null;
let sessionPromise: Promise<{ session_id: string }> | null = null;

function sessionHeaders(): Record<string, string> {
  return sessionId ? { 'X-Session-Id': sessionId } : {};
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...sessionHeaders(),
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getSession(): Promise<{ session_id: string }> {
  if (sessionId) return { session_id: sessionId };
  if (!sessionPromise) {
    sessionPromise = fetchJson<{ session_id: string }>('/api/session').then((data) => {
      sessionId = data.session_id;
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

export async function registerDevice(label: string, token: string): Promise<Device> {
  return fetchJson<Device>('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, token }),
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
