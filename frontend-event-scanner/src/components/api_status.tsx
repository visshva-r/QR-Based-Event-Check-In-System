'use client';

import { useEffect, useState } from 'react';
import { getWithWakeRetry } from '@/lib/api';

export default function ApiStatus() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'waking'>('checking');

  useEffect(() => {
    let cancelled = false;

    getWithWakeRetry('/test')
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('waking');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const label = status === 'ready'
    ? 'API status: ready'
    : status === 'waking'
      ? 'API status: waking up — retry in a moment'
      : 'API status: checking';

  return (
    <p className="text-xs text-stone-500 font-mono" aria-live="polite">
      {label}
    </p>
  );
}
