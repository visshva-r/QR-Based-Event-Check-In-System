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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-[6px] border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-black uppercase tracking-widest text-xs">Verifying Access...</p>
      </div>
    );
  }

  return <>{children}</>;
}