'use client';

import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop, faFlaskVial } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import { getSimulatorStatus, startSimulator, stopSimulator } from '@/lib/api';
import type { Scenario } from '@/types';

const SCENARIOS: Scenario[] = ['normal', 'leak', 'high_flow'];

const SCENARIO_LABEL_KEYS = {
  normal: 'scenarioNormal',
  leak: 'scenarioLeak',
  high_flow: 'scenarioHighFlow',
} as const;

export default function SimulatorPanel() {
  const t = useTranslations('simulator');
  const [running, setRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('normal');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await getSimulatorStatus();
      setRunning(status.running);
      if (status.scenario !== null) {
        setSelectedScenario(status.scenario);
      }
    } catch (err) {
      console.error('Failed to fetch simulator status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const handleStart = async () => {
    setError(null);
    try {
      await startSimulator(selectedScenario);
      setRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulator');
    }
  };

  const handleStop = async () => {
    setError(null);
    try {
      await stopSimulator();
      setRunning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop simulator');
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#0a1628', color: 'rgba(255,255,255,0.4)' }}>
        <span style={{ fontFamily: '"DM Mono", monospace' }}>...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#0a1628' }}>
      <div className="flex items-center gap-3 mb-6">
        <FontAwesomeIcon icon={faFlaskVial} style={{ color: '#00c8ff' }} />
        <h2 className="text-white font-medium">{t('title')}</h2>
      </div>

      <div className="mb-6">
        <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('selectScenario')}
        </p>
        <div className="flex gap-3">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario}
              type="button"
              disabled={running}
              onClick={() => setSelectedScenario(scenario)}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor:
                  selectedScenario === scenario ? 'rgba(0,200,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: selectedScenario === scenario ? '#00c8ff' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${selectedScenario === scenario ? 'rgba(0,200,255,0.4)' : 'transparent'}`,
                cursor: running ? 'not-allowed' : 'pointer',
              }}
            >
              {t(SCENARIO_LABEL_KEYS[scenario])}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {running ? (
          <button
            type="button"
            onClick={() => void handleStop()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'rgba(255,80,80,0.15)', color: 'rgba(255,80,80,0.9)', border: '1px solid rgba(255,80,80,0.3)' }}
          >
            <FontAwesomeIcon icon={faStop} />
            <span>{t('stop')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleStart()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'rgba(0,200,255,0.15)', color: '#00c8ff', border: '1px solid rgba(0,200,255,0.3)' }}
          >
            <FontAwesomeIcon icon={faPlay} />
            <span>{t('start')}</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: running ? '#22c55e' : 'rgba(255,255,255,0.2)' }}
          />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Mono", monospace' }}>
            {running ? t('running') : t('stopped')}
          </span>
        </div>
      </div>

      {error !== null && (
        <p className="mt-4 text-sm" style={{ color: 'rgba(255,80,80,0.9)', fontFamily: '"DM Mono", monospace' }}>
          {error}
        </p>
      )}
    </div>
  );
}
