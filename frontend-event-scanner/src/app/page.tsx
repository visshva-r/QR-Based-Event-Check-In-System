'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Send credentials to your backend
      const response = await api.post('/auth/login', { email, password });
      
      // 2. Extract token and user from response
      const { token, user } = response.data;

      // 3. Save token, email, role, and userId to localStorage (role from JWT for secure admin check)
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', user?.role || 'student');
      if (user?.id) localStorage.setItem('userId', user.id);
      
      toast.success('Login successful!');

      // 4. Role-based routing using JWT role
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <Toaster position="top-center" />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-8 sm:p-10 border-[4px] border-black">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Login</h1>
          <p className="text-neutral-600 text-sm font-medium mt-2">QR Event Check-In System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-neutral-800 rounded-xl text-black placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
              placeholder="name@college.edu"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-neutral-800 rounded-xl text-black placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-neutral-800 transition-colors active:scale-[0.99] disabled:opacity-70 text-base"
          >
            {loading ? 'Signing in…' : 'Enter'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-black underline underline-offset-2 hover:no-underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}