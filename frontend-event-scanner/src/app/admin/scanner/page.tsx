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
      isProcessing.current = true;

      // Play Success Sound
      const audio = new Audio('/beep.mp3');
      audio.play().catch(e => console.warn("Audio play blocked:", e));

      try {
        const [userId, eventId] = decodedText.split('-');
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
      <div className="min-h-screen bg-white p-10 flex flex-col items-center">
        <div className="max-w-[1400px] w-full mx-auto">
          
          <header className="mb-10 text-center">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-black">Scanner_HD</h1>
            <p className="text-xs font-black tracking-[0.4em] uppercase mt-2">Ready to Scan</p>
          </header>

          {/* 2. THE TARGET DIV */}
          <div className="relative border-[12px] border-black rounded-[40px] overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] bg-black aspect-square max-w-lg mx-auto">
            <div id="reader" className="w-full h-full"></div>
            
            {/* Visual HUD overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className={`w-[260px] h-[260px] border-[6px] rounded-3xl transition-all duration-500 ${isReady ? 'border-green-400 opacity-100' : 'border-white opacity-20'}`}></div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => window.location.href = '/admin/dashboard'}
              className="px-12 py-4 bg-black text-white font-black text-xl rounded-2xl hover:bg-zinc-900 active:scale-95 transition-all uppercase tracking-widest shadow-xl"
            >
              Exit Scanner
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}