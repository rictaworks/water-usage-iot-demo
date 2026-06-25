export interface Reading {
  id: string;
  device_id: string;
  flow_rate: number;
  temperature: number | null;
  volume_total: number;
  recorded_at: string;
}

export interface Alert {
  id: string;
  device_id: string;
  rule_name: string;
  message: string;
  severity: 'warning' | 'caution';
  occurred_at: string;
}

export interface Device {
  id: string;
  label: string;
  pump_on: boolean;
  online_at: string | null;
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
