'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole') || 'student';

    // 1. If no token, they aren't logged in at all
    if (!token) {
      router.push('/');
      return;
    }

    // 2. If admin access is required but user role is not admin (use JWT role, not email)
    if (requireAdmin && userRole !== 'admin') {
      router.push('/student/dashboard'); // Redirect students away from admin pages
      return;
    }

    // 3. If all checks pass, authorize the view
    setAuthorized(true);
  }, [router, requireAdmin]);

  // Show a black high-contrast loader while checking
  if (!authorized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="size-10 border-2 border-neutral-300 border-t-black rounded-full animate-spin" aria-hidden />
        <p className="text-sm font-medium text-neutral-600">Verifying access…</p>
      </div>
    );
  }

  return <>{children}</>;
}