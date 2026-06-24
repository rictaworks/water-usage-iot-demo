export interface Reading {
  id: number;
  device_id: number;
  flow_rate: number;
  volume_total: number;
  recorded_at: string;
}

export interface Alert {
  id: number;
  device_id: number;
  rule_name: string;
  message: string;
  severity: 'warning' | 'caution';
  occurred_at: string;
}

export interface Device {
  id: number;
  label: string;
  token: string;
  status: 'online' | 'offline';
  led_status: 'green' | 'yellow' | 'red' | 'off';
  last_seen_at: string;
}

export interface SSEReading {
  type: 'reading';
  data: Reading;
}

export interface SSEAlert {
  type: 'alert';
  data: Alert;
}

export interface SSESummary {
  type: 'summary';
  data: { today_usage: number; active_alerts: number };
}

export interface SSEDeviceStatus {
  type: 'device_status';
  data: Device;
}

export type SSEEvent = SSEReading | SSEAlert | SSESummary | SSEDeviceStatus;

export type Scenario = 'normal' | 'leak' | 'high_flow';
