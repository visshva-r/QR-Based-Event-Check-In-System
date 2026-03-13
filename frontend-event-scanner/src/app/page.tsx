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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <Toaster position="top-center" />
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-10 space-y-8 border-[6px] border-black">
        <div className="text-center">
          <h1 className="text-5xl font-black text-black tracking-tighter italic uppercase">Login</h1>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-2">QR_CHECK_SYSTEM_V1</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black rounded-xl text-black font-bold placeholder-gray-400 focus:bg-gray-50 outline-none transition-all"
              placeholder="name@college.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black rounded-xl text-black font-bold placeholder-gray-400 focus:bg-gray-50 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 uppercase tracking-widest shadow-lg"
          >
            {loading ? 'Authenticating...' : 'Enter System'}
          </button>
        </form>

        <p className="text-center text-sm font-bold text-black mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="underline decoration-4 hover:decoration-black">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}