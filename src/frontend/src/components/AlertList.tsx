'use client';

import { useTranslations } from 'next-intl';
import AlertItem from './AlertItem';
import type { Alert } from '@/types';

interface AlertListProps {
  alerts: Alert[];
}

export default function AlertList({ alerts }: AlertListProps) {
  const t = useTranslations('alerts');

  if (alerts.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: '#0a1628', color: 'rgba(255,255,255,0.3)' }}
      >
        <p>{t('noAlerts')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          ruleNameLabel={t('ruleName')}
          occurredAtLabel={t('occurredAt')}
        />
      ))}
    </div>
  );
}
