'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminScanner() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(onScanSuccess, (err) => {});

    async function onScanSuccess(decodedText: string) {
      // SAFETY CHECK: Only pause if the scanner is actually in a scanning state
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        try {
          await scanner.pause(); // Using await here to ensure it stops
        } catch (e) {
          console.warn("Pause failed, but continuing:", e);
        }
      }

      try {
        const [userId, eventId] = decodedText.split('-');
        if (!userId || !eventId) throw new Error('Invalid QR Format');

        const res = await api.post(`/events/checkin/${eventId}/${userId}`);
        toast.success(res.data.message || 'Check-in successful!');

      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Check-in failed');
      }

      // Resume after 3 seconds
      setTimeout(() => {
        if (scanner.getState() === Html5QrcodeScannerState.PAUSED) {
          scanner.resume();
        }
      }, 3000);
    }

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Toaster position="top-center" />
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-6 text-center">
        <h1 className="text-2xl font-bold">Admin Scanner</h1>
        <div id="reader" className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300"></div>
      </div>
    </div>
  );
}