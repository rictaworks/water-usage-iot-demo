'use client';

import { useTranslations } from 'next-intl';
import AlertList from '@/components/AlertList';
import { useSSE } from '@/hooks/useSSE';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function AlertsPage() {
  const t = useTranslations('alerts');
  const { alerts } = useSSE(API_URL);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">{t('title')}</h1>
      <AlertList alerts={alerts} />
    </div>
  );
}
