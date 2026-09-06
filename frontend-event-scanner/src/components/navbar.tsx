'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { clearAuth } from '@/lib/auth';
import { disconnectSocket } from '@/lib/socket';

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAdmin(false);
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => {
        setIsAdmin(data.role === 'admin');
        localStorage.setItem('userRole', data.role);
        if (data.name) localStorage.setItem('userName', data.name);
      })
      .catch(() => setIsAdmin(localStorage.getItem('userRole') === 'admin'));
  }, [pathname]);

  if (pathname === '/' || pathname === '/register' || pathname === '/admin/scanner') return null;

  const staff = isAdmin;

  return (
    <nav className={staff
      ? 'bg-neutral-950 text-neutral-100 border-b border-neutral-800'
      : 'bg-[#f3efe6] text-stone-900 border-b border-stone-300'
    }>
      <div className="max-w-5xl mx-auto flex justify-between items-center gap-4 px-5 sm:px-8 h-14">
        <div className="flex items-center gap-8">
          <Link href={staff ? '/admin/dashboard' : '/student/dashboard'} className="font-mono text-sm tracking-[0.22em]">
            GATE
          </Link>
          <div className="flex items-center gap-5 text-sm">
            {staff ? (
              <>
                <NavLink href="/admin/dashboard" active={pathname.startsWith('/admin/dashboard') || pathname.startsWith('/admin/events')} invert>
                  Events
                </NavLink>
                <NavLink href="/admin/scanner" active={false} invert>
                  Door
                </NavLink>
              </>
            ) : (
              <NavLink href="/student/dashboard" active={pathname === '/student/dashboard'}>
                Passes
              </NavLink>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            disconnectSocket();
            clearAuth();
            router.push('/');
          }}
          className={staff
            ? 'text-xs font-mono tracking-wider text-neutral-400 hover:text-white'
            : 'text-xs font-mono tracking-wider text-stone-500 hover:text-stone-900'
          }
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  active,
  invert = false,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  invert?: boolean;
}) {
  const on = invert
    ? active ? 'text-white' : 'text-neutral-400 hover:text-white'
    : active ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900';
  return (
    <Link href={href} className={on}>
      {children}
    </Link>
  );
}
