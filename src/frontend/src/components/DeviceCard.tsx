import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip } from '@fortawesome/free-solid-svg-icons';
import type { Device } from '@/types';

interface DeviceCardProps {
  device: Device;
  onlineLabel: string;
  offlineLabel: string;
}

function isOnline(onlineAt: string | null): boolean {
  if (!onlineAt) return false;
  return Date.now() - new Date(onlineAt).getTime() < 60_000;
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
  const online = isOnline(device.online_at);

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
              backgroundColor: online ? 'rgba(34,197,94,0.15)' : 'rgba(255,80,80,0.15)',
              color: online ? '#22c55e' : 'rgba(255,80,80,0.9)',
            }}
          >
            {online ? onlineLabel : offlineLabel}
          </span>
        </div>
        {device.online_at && (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Mono", monospace' }}>
            {formatDateTime(device.online_at)}
          </span>
        )}
      </div>

      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: online ? '#22c55e' : 'rgba(255,255,255,0.2)' }}
      />
    </div>
  );
}
