import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip } from '@fortawesome/free-solid-svg-icons';
import type { Device } from '@/types';

const LED_COLORS: Record<Device['led_status'], string> = {
  green: '#22c55e',
  yellow: 'rgba(255,200,80,0.9)',
  red: 'rgba(255,80,80,0.9)',
  off: 'rgba(255,255,255,0.2)',
};

interface DeviceCardProps {
  device: Device;
  onlineLabel: string;
  offlineLabel: string;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DeviceCard({ device, onlineLabel, offlineLabel }: DeviceCardProps) {
  const isOnline = device.status === 'online';

  return (
    <div className="rounded-xl p-5 flex items-center gap-4" style={{ backgroundColor: '#0a1628' }}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,200,255,0.1)' }}
      >
        <FontAwesomeIcon icon={faMicrochip} style={{ color: '#00c8ff' }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white truncate">{device.label}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: isOnline ? 'rgba(34,197,94,0.15)' : 'rgba(255,80,80,0.15)',
              color: isOnline ? '#22c55e' : 'rgba(255,80,80,0.9)',
            }}
          >
            {isOnline ? onlineLabel : offlineLabel}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Mono", monospace' }}>
          {formatDateTime(device.last_seen_at)}
        </span>
      </div>

      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: LED_COLORS[device.led_status] }}
        aria-label={`LED: ${device.led_status}`}
      />
    </div>
  );
}
