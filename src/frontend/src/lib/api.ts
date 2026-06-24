import type { Alert, Device, Reading, Scenario } from '@/types';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getSession(): Promise<{ session_id: string }> {
  return fetchJson<{ session_id: string }>('/api/session');
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
