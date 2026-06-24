'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Alert, Device, Reading } from '@/types';
import { mockAlerts, mockDevice, mockReadings } from '@/lib/mockData';

const MAX_READINGS = 60;
const RECONNECT_DELAY_MS = 3000;
const IS_DEV = process.env.NEXT_PUBLIC_ENV === 'development';

interface SSEState {
  readings: Reading[];
  alerts: Alert[];
  summary: { today_usage: number; active_alerts: number };
  deviceStatus: Device | null;
  connected: boolean;
}

export function useSSE(): SSEState {
  const [state, setState] = useState<SSEState>({
    readings: [],
    alerts: [],
    summary: { today_usage: 0, active_alerts: 0 },
    deviceStatus: null,
    connected: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failedRef = useRef(false);

  const loadMockData = useCallback(() => {
    setState({
      readings: mockReadings,
      alerts: mockAlerts,
      summary: {
        today_usage: mockReadings.reduce((acc, r) => acc + r.volume_total, 0),
        active_alerts: mockAlerts.length,
      },
      deviceStatus: mockDevice,
      connected: false,
    });
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/stream', { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => {
      failedRef.current = false;
      setState((prev) => ({ ...prev, connected: true }));
    };

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string; data: unknown };

        if (parsed.type === 'reading') {
          const reading = parsed.data as Reading;
          setState((prev) => ({
            ...prev,
            readings: [...prev.readings.slice(-(MAX_READINGS - 1)), reading],
          }));
        } else if (parsed.type === 'alert') {
          const alertItem = parsed.data as Alert;
          setState((prev) => ({
            ...prev,
            alerts: [alertItem, ...prev.alerts],
          }));
        } else if (parsed.type === 'summary') {
          const summary = parsed.data as { today_usage: number; active_alerts: number };
          setState((prev) => ({ ...prev, summary }));
        } else if (parsed.type === 'device_status') {
          const device = parsed.data as Device;
          setState((prev) => ({ ...prev, deviceStatus: device }));
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    es.onerror = () => {
      es.close();
      setState((prev) => ({ ...prev, connected: false }));

      if (IS_DEV && !failedRef.current) {
        failedRef.current = true;
        loadMockData();
        return;
      }

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY_MS);
    };
  }, [loadMockData]);

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);

  return state;
}
