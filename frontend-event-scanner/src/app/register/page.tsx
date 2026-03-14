'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/register', {
        name,
        email,
        studentId: studentId || undefined,
        password,
        role: 'student',
      });
      toast.success('Account created! Please login.');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <Toaster position="top-center" />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-8 sm:p-10 border-[4px] border-black">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Sign up</h1>
          <p className="text-neutral-600 text-sm font-medium mt-2">Create a student account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Full name</label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-neutral-800 rounded-xl text-black placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-neutral-800 rounded-xl text-black placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
              placeholder="name@college.edu"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Student ID <span className="text-neutral-400 font-normal normal-case">(optional)</span></label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-neutral-800 rounded-xl text-black placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
              placeholder="e.g. S12345"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-600 mt-6">
          Already have an account?{' '}
          <Link href="/" className="font-semibold text-black underline underline-offset-2 hover:no-underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
