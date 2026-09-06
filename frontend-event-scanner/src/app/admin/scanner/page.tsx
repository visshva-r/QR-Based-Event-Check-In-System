'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';

type ScanStatus = 'idle' | 'ok' | 'duplicate' | 'invalid';

export default function AdminScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessing = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [result, setResult] = useState<{ status: ScanStatus; title: string; name?: string }>({
    status: 'idle',
    title: 'Ready',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 20,
          qrbox: { width: 240, height: 240 },
          videoConstraints: { facingMode: 'environment' },
        },
        onScanSuccess,
        () => {}
      ).then(() => setIsReady(true))
       .catch((err) => console.error('Camera start failed:', err));
    }, 400);

    async function onScanSuccess(decodedText: string) {
      if (isProcessing.current) return;
      const token = decodedText.trim();
      if (!token || !token.includes('.')) {
        flash({ status: 'invalid', title: 'INVALID' });
        return;
      }
      isProcessing.current = true;
      const audio = new Audio('/beep.mp3');
      audio.play().catch(() => {});

      try {
        const res = await api.post('/events/checkin', { token });
        flash({
          status: 'ok',
          title: 'IN',
          name: res.data.attendee?.name,
        });
      } catch (error: any) {
        const status = error.response?.data?.status === 'duplicate' ? 'duplicate' : 'invalid';
        flash({
          status,
          title: status === 'duplicate' ? 'ALREADY IN' : 'INVALID',
          name: error.response?.data?.attendee?.name,
        });
      }
    }

    function flash(next: { status: ScanStatus; title: string; name?: string }) {
      setResult(next);
      setTimeout(() => {
        isProcessing.current = false;
        setResult({ status: 'idle', title: 'Ready' });
      }, 2200);
    }

    return () => {
      clearTimeout(timer);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
    };
  }, []);

  const overlay =
    result.status === 'ok'
      ? 'bg-emerald-600'
      : result.status === 'duplicate'
        ? 'bg-amber-500'
        : result.status === 'invalid'
          ? 'bg-red-600'
          : null;

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <header className="flex items-center justify-between px-5 h-14 border-b border-white/10">
          <span className="font-mono text-sm tracking-[0.22em]">GATE · DOOR</span>
          <a href="/admin/dashboard" className="text-xs font-mono tracking-wider text-white/60 hover:text-white">
            Exit
          </a>
        </header>

        <div className="flex-1 relative bg-neutral-950">
          <div id="reader" className="absolute inset-0 w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
          {result.status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-56 h-56 border ${isReady ? 'border-white/80' : 'border-white/25'}`} />
            </div>
          )}
          {overlay && (
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${overlay}`}>
              <p className="text-6xl sm:text-7xl font-semibold tracking-tight">{result.title}</p>
              {result.name && <p className="mt-4 text-2xl font-medium">{result.name}</p>}
            </div>
          )}
        </div>

        <p className="px-5 py-4 text-center text-xs font-mono tracking-wider text-white/50">
          {result.status === 'idle' ? (isReady ? 'Aim at a signed pass' : 'Starting camera…') : result.title}
        </p>
      </div>
    </ProtectedRoute>
  );
}
