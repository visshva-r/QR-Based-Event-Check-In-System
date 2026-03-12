'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initialize the scanner to look for the "reader" div
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false // Use false to disable the default verbose logging
    );

    scanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText: string) {
      // Pause the scanner instantly so it doesn't fire 50 API calls in one second
      scanner.pause();
      setScanResult(decodedText);

      try {
        // Your backend formats the QR as: userId-eventId
        const [userId, eventId] = decodedText.split('-');

        if (!userId || !eventId) {
          toast.error('Invalid QR Code format');
          setTimeout(() => scanner.resume(), 3000);
          return;
        }

        // Fire the check-in request using your auto-token Axios setup!
        const res = await api.post(`/events/checkin/${eventId}/${userId}`);
        toast.success(res.data.message || 'Check-in successful!');

      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Check-in failed or already checked in');
      }

      // Wait 3 seconds, clear the result, and turn the camera back on
      setTimeout(() => {
        setScanResult(null);
        scanner.resume();
      }, 3000);
    }

    function onScanFailure(error: any) {
      // The library throws an error every single frame it doesn't see a QR code.
      // We keep this function empty so it doesn't flood your console.
    }

    // Cleanup: Turn off the camera when the user leaves the page
    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Toaster position="top-center" />
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Live Check-In Scanner</h1>
        <p className="text-gray-500 text-sm">Point your camera at the attendee's QR ticket</p>
        
        {/* The library will automatically inject the camera video feed into this exact div */}
        <div 
          id="reader" 
          className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300"
        ></div>

        {scanResult && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm font-medium animate-pulse">
            Processing scan...
          </div>
        )}
      </div>
    </div>
  );
}