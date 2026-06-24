import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: IconDefinition;
  accent?: boolean;
}

export default function MetricCard({ label, value, unit, icon, accent = false }: MetricCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: '#0a1628' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {label}
        </span>
        <FontAwesomeIcon
          icon={icon}
          className="w-4 h-4"
          style={{ color: accent ? '#00c8ff' : 'rgba(255,255,255,0.3)' }}
        />
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-4xl font-bold"
          style={{
            fontFamily: '"DM Mono", monospace',
            color: accent ? '#00c8ff' : '#ffffff',
          }}
        >
          {value}
        </span>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Mono", monospace' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}
