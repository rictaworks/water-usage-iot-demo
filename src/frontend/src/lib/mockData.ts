import type { Alert, Device, Reading } from '@/types';

const now = Date.now();

export const mockReadings: Reading[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  device_id: 1,
  flow_rate: parseFloat((0.5 + Math.sin(i * 0.5) * 1.2 + 1.3).toFixed(2)),
  volume_total: parseFloat((10.0 + i * 0.8).toFixed(1)),
  recorded_at: new Date(now - (19 - i) * 30000).toISOString(),
}));

export const mockAlerts: Alert[] = [
  {
    id: 1,
    device_id: 1,
    rule_name: 'high_flow_alert',
    message: 'Flow rate exceeded 4.0 L/min threshold',
    severity: 'warning',
    occurred_at: new Date(now - 600000).toISOString(),
  },
  {
    id: 2,
    device_id: 1,
    rule_name: 'continuous_flow',
    message: 'Continuous flow detected for over 30 minutes',
    severity: 'caution',
    occurred_at: new Date(now - 1800000).toISOString(),
  },
  {
    id: 3,
    device_id: 1,
    rule_name: 'leak_suspected',
    message: 'Low-level flow detected overnight',
    severity: 'caution',
    occurred_at: new Date(now - 3600000).toISOString(),
  },
];

export const mockDevice: Device = {
  id: 1,
  label: 'キッチン水道',
  token: 'mock-token-abc123',
  status: 'online',
  led_status: 'green',
  last_seen_at: new Date().toISOString(),
};
