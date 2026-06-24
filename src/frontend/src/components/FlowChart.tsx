'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Reading } from '@/types';

interface FlowChartProps {
  readings: Reading[];
  title: string;
  noDataLabel: string;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export default function FlowChart({ readings, title, noDataLabel }: FlowChartProps) {
  const chartData = readings.slice(-60).map((r) => ({
    time: formatTime(r.recorded_at),
    flow: r.flow_rate,
  }));

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#0a1628' }}>
      <h3 className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {title}
      </h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-40" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {noDataLabel}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: '"DM Mono", monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: '"DM Mono", monospace' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#070e1c',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#ffffff',
                fontFamily: '"DM Mono", monospace',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="flow"
              stroke="#00c8ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00c8ff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
