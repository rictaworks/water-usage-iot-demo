'use client';

import { useTranslations } from 'next-intl';
import { faDroplet, faChartLine, faBell } from '@fortawesome/free-solid-svg-icons';
import MetricCard from '@/components/MetricCard';
import FlowChart from '@/components/FlowChart';
import DeviceCard from '@/components/DeviceCard';
import { useSSE } from '@/hooks/useSSE';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { readings, summary, deviceStatus } = useSSE();

  const currentFlow = readings.length > 0 ? readings[readings.length - 1].flow_rate : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">{t('title')}</h1>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <MetricCard
          label={t('currentFlow')}
          value={currentFlow.toFixed(2)}
          unit={t('flowUnit')}
          icon={faDroplet}
          accent={true}
        />
        <MetricCard
          label={t('todayUsage')}
          value={summary.today_usage.toFixed(1)}
          unit={t('usageUnit')}
          icon={faChartLine}
        />
        <MetricCard
          label={t('activeAlerts')}
          value={summary.active_alerts}
          unit=""
          icon={faBell}
        />
      </div>

      <div className="mb-6">
        <FlowChart
          readings={readings}
          title={t('realtimeChart')}
          noDataLabel={t('noData')}
        />
      </div>

      {deviceStatus !== null && (
        <DeviceCard
          device={deviceStatus}
          onlineLabel={t('online')}
          offlineLabel={t('offline')}
        />
      )}
    </div>
  );
}
