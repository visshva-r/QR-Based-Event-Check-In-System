'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWithWakeRetry } from '@/lib/api';
import { clearAuth } from '@/lib/auth';

interface AuthMeResponse {
  role: string;
  id: string;
  email: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const { data } = await getWithWakeRetry<AuthMeResponse>('/auth/me');
        if (cancelled) return;
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userEmail', data.email);

        if (requireAdmin && data.role !== 'admin') {
          router.push('/student/dashboard');
          return;
        }
        if (!requireAdmin && data.role === 'admin' && window.location.pathname.startsWith('/student')) {
          router.push('/admin/dashboard');
          return;
        }
        setAuthorized(true);
      } catch {
        if (cancelled) return;
        clearAuth();
        router.push('/');
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [router, requireAdmin]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="size-10 border-2 border-neutral-300 border-t-black rounded-full animate-spin" aria-hidden />
        <p className="text-sm font-medium text-neutral-600">Checking your pass…</p>
      </div>
    );
  }

  return <>{children}</>;
}
