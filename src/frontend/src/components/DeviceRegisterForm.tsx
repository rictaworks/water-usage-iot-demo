'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faKey } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import { getSession, registerDevice } from '@/lib/api';
import type { RegisteredDevice } from '@/types';

export default function DeviceRegisterForm() {
  const t = useTranslations('register');
  const tCommon = useTranslations('common');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [label, setLabel] = useState('');
  const [success, setSuccess] = useState<RegisteredDevice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const fetchSession = useCallback(async () => {
    try {
      const session = await getSession();
      setSessionToken(session.session_id);
    } catch (err) {
      console.error('Failed to fetch session:', err);
    }
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (honeypotRef.current?.value) {
      return;
    }

    if (!label.trim()) {
      setError('Label is required');
      return;
    }

    setSubmitting(true);
    try {
      const device = await registerDevice(label.trim(), sessionToken);
      setSuccess(device);
      setLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl p-6 max-w-lg" style={{ backgroundColor: '#0a1628' }}>
      <h2 className="text-white font-medium mb-6">{t('title')}</h2>

      {success !== null && (
        <div
          className="rounded-lg p-4 mb-6 flex items-start gap-3"
          style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <FontAwesomeIcon icon={faCheckCircle} className="mt-0.5" style={{ color: '#22c55e' }} />
          <div>
            <p className="text-white text-sm font-medium">{t('success')}</p>
            <p
              className="text-xs mt-1"
              style={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Mono", monospace' }}
            >
              {success.device_token}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} noValidate>
        <input
          ref={honeypotRef}
          type="text"
          name="hp_field"
          tabIndex={-1}
          aria-hidden="true"
          style={{ display: 'none' }}
        />

        <div className="mb-4">
          <label className="block text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('deviceToken')}
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: '#070e1c',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#00c8ff',
              fontFamily: '"DM Mono", monospace',
            }}
          >
            <FontAwesomeIcon icon={faKey} className="text-xs" style={{ color: 'rgba(0,200,255,0.5)' }} />
            <span className="truncate">{sessionToken || '...'}</span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {t('tokenHint')}
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="device-label" className="block text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('deviceLabel')}
          </label>
          <input
            id="device-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('labelPlaceholder')}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
            style={{
              backgroundColor: '#070e1c',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        </div>

        {error !== null && (
          <p className="mb-4 text-sm" style={{ color: 'rgba(255,80,80,0.9)', fontFamily: '"DM Mono", monospace' }}>
            {tCommon('error')}: {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: submitting ? 'rgba(0,200,255,0.08)' : 'rgba(0,200,255,0.15)',
            color: submitting ? 'rgba(0,200,255,0.4)' : '#00c8ff',
            border: '1px solid rgba(0,200,255,0.3)',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? tCommon('loading') : t('register')}
        </button>
      </form>
    </div>
  );
}
