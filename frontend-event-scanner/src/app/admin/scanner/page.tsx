'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';

export default function AdminScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessing = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Give the browser a moment to render the 'reader' div
    const timer = setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const qrConfig = { 
        fps: 20, 
        qrbox: { width: 260, height: 260 },
        videoConstraints: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      html5QrCode.start(
        { facingMode: "environment" }, 
        qrConfig,
        onScanSuccess,
        () => {} 
      ).then(() => setIsReady(true))
       .catch(err => console.error("HD Start Error:", err));
    }, 500); // 500ms delay to prevent 'id=reader not found'

    async function onScanSuccess(decodedText: string) {
      if (isProcessing.current) return;
      const parts = decodedText.trim().split('-');
      if (parts.length < 2) {
        toast.error('Invalid QR code format');
        return;
      }
      const [userId, eventId] = parts;
      if (!userId || !eventId) {
        toast.error('Invalid QR code');
        return;
      }
      isProcessing.current = true;

      const audio = new Audio('/beep.mp3');
      audio.play().catch(() => {});

      try {
        await api.post(`/events/checkin/${eventId}/${userId}`);
        
        toast.success('CHECK-IN SUCCESSFUL', {
          style: { background: '#000', color: '#00ff00', border: '2px solid #00ff00', fontWeight: '900' }
        });
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'CHECK-IN FAILED', {
          style: { background: '#000', color: '#ff0000', border: '2px solid #ff0000', fontWeight: '900' }
        });
      }

      setTimeout(() => { isProcessing.current = false; }, 2500);
    }

    return () => {
      clearTimeout(timer);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
    };
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-white p-6 sm:p-8 flex flex-col items-center">
        <div className="max-w-lg w-full mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">QR Scanner</h1>
            <p className="text-sm text-neutral-600 mt-1">Point at a ticket to check in</p>
          </header>

          <div className="relative border-4 border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900 aspect-square w-full">
            <div id="reader" className="w-full h-full min-h-[280px]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-[260px] h-[260px] border-4 rounded-2xl transition-all duration-300 ${isReady ? 'border-green-400 opacity-90' : 'border-white/30 opacity-70'}`} />
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/admin/dashboard'}
              className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Exit scanner
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}