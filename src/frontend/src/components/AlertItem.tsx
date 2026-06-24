import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import type { Alert } from '@/types';

interface AlertItemProps {
  alert: Alert;
  ruleNameLabel: string;
  occurredAtLabel: string;
}

const SEVERITY_STYLES = {
  warning: {
    border: 'rgba(255,80,80,0.4)',
    bg: 'rgba(255,80,80,0.08)',
    color: 'rgba(255,80,80,0.9)',
    icon: faTriangleExclamation,
  },
  caution: {
    border: 'rgba(255,200,80,0.4)',
    bg: 'rgba(255,200,80,0.08)',
    color: 'rgba(255,200,80,0.9)',
    icon: faCircleExclamation,
  },
} as const;

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AlertItem({ alert, ruleNameLabel, occurredAtLabel }: AlertItemProps) {
  const style = SEVERITY_STYLES[alert.severity];

  return (
    <div
      className="rounded-lg p-4 border"
      style={{ backgroundColor: style.bg, borderColor: style.border }}
    >
      <div className="flex items-start gap-3">
        <FontAwesomeIcon icon={style.icon} className="mt-0.5 flex-shrink-0" style={{ color: style.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm mb-1">{alert.message}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Mono", monospace' }}>
            <span>
              {ruleNameLabel}: <span style={{ color: style.color }}>{alert.rule_name}</span>
            </span>
            <span>
              {occurredAtLabel}: {formatDateTime(alert.occurred_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
