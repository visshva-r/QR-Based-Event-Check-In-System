'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
  }, [pathname]);

  if (pathname === '/' || pathname === '/register') return null;

  return (
    <nav className="bg-white border-b-4 border-black py-4 px-6 sm:px-8 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
        <div className="flex items-center gap-8 sm:gap-10">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            QR Check
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            {isAdmin ? (
              <>
                <NavLink href="/admin/dashboard" active={pathname === '/admin/dashboard'}>Dashboard</NavLink>
                <NavLink href="/admin/scanner" active={pathname === '/admin/scanner'}>Scanner</NavLink>
              </>
            ) : (
              <NavLink href="/student/dashboard" active={pathname === '/student/dashboard'}>Events</NavLink>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => { localStorage.clear(); router.push('/'); }}
          className="bg-black text-white px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm font-semibold transition-colors px-3 py-1.5 rounded-md ${
        active ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
      }`}
    >
      {children}
    </Link>
  );
}