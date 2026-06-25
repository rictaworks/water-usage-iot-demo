'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFan } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { setPump } from '@/lib/api';

interface PumpControlProps {
  deviceId: string;
  pumpOn: boolean;
  pumpLabel: string;
  onLabel: string;
  offLabel: string;
  onToggle: (pumpOn: boolean) => void;
}

export default function PumpControl({ deviceId, pumpOn, pumpLabel, onLabel, offLabel, onToggle }: PumpControlProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const result = await setPump(deviceId, !pumpOn);
      onToggle(result.pump_on);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl p-5 flex items-center gap-4" style={{ backgroundColor: '#0a1628' }}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: pumpOn ? 'rgba(0,200,255,0.15)' : 'rgba(255,255,255,0.05)' }}
      >
        <FontAwesomeIcon
          icon={faFan}
          className={pumpOn ? 'animate-spin' : ''}
          style={{ color: pumpOn ? '#00c8ff' : 'rgba(255,255,255,0.3)' }}
        />
      </div>

      <div className="flex-1">
        <span className="font-medium text-white">{pumpLabel}</span>
        <div className="text-xs mt-0.5" style={{ color: pumpOn ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
          {pumpOn ? onLabel : offLabel}
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          backgroundColor: pumpOn ? 'rgba(255,80,80,0.15)' : 'rgba(0,200,255,0.15)',
          color: pumpOn ? 'rgba(255,80,80,0.9)' : '#00c8ff',
          border: `1px solid ${pumpOn ? 'rgba(255,80,80,0.3)' : 'rgba(0,200,255,0.3)'}`,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {pumpOn ? offLabel : onLabel}
      </button>
    </div>
  );
}
