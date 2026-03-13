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

  if (pathname === '/') return null;

  return (
    <nav className="bg-white border-b-8 border-black py-5 px-10 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center">
        
        {/* Brand & Links Group */}
        <div className="flex items-center gap-12"> 
          <Link href="/" className="text-4xl font-black italic tracking-tighter">
            QR_CHECK
          </Link>
          
          <div className="flex items-center gap-8">
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
          onClick={() => { localStorage.clear(); router.push('/'); }}
          className="bg-black text-white px-8 py-3 font-black uppercase text-sm hover:bg-red-600 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: any) {
  return (
    <Link 
      href={href} 
      className={`text-sm font-black uppercase tracking-[0.2em] transition-all px-2 ${
        active ? 'bg-black text-white px-4 py-1' : 'text-black hover:underline decoration-4 underline-offset-8'
      }`}
    >
      {children}
    </Link>
  );
}