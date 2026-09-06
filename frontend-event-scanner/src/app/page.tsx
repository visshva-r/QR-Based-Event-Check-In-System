'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      setAuth(token, {
        id: user.id,
        name: user.name,
        email: user.email || email,
        role: user.role === 'admin' ? 'admin' : 'student',
        studentId: user.studentId,
      });
      if (user?.role === 'admin') router.push('/admin/dashboard');
      else router.push('/student/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3efe6] grid lg:grid-cols-2">
      <Toaster position="top-center" />
      <section className="hidden lg:flex flex-col justify-between p-12 border-r border-stone-300">
        <p className="font-mono text-sm tracking-[0.22em]">GATE</p>
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-stone-900 leading-[1.1]">
            Show up.<br />Scan in.
          </h1>
          <p className="mt-6 max-w-sm text-stone-600 text-[15px] leading-relaxed">
            Campus event check-in with signed tickets. Staff see the door; students keep the pass on their phone.
          </p>
        </div>
        <p className="text-xs text-stone-500 font-mono">Door staff · student passes · live log</p>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="lg:hidden font-mono text-sm tracking-[0.22em] mb-10">GATE</p>
          <h2 className="text-2xl font-semibold text-stone-900">Sign in</h2>
          <p className="text-sm text-stone-500 mt-1 mb-8">Students and staff sign in here.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-stone-600 mb-1">College email</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-stone-400 text-stone-900 outline-none focus:border-stone-900"
                placeholder="name@college.edu"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-stone-400 text-stone-900 outline-none focus:border-stone-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 text-white py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-60"
            >
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </form>
          <p className="text-sm text-stone-600 mt-6">
            New student?{' '}
            <Link href="/register" className="text-stone-900 underline underline-offset-2">
              Get a pass account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
