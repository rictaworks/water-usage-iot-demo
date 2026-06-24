'use client';

import { useEffect } from 'react';
import { getSession } from '@/lib/api';

export default function SessionInit() {
  useEffect(() => {
    getSession().catch(() => {});
  }, []);

  return null;
}
