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
      });
      toast.success('Account ready. Sign in to grab your passes.');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full px-3 py-2.5 bg-white border border-stone-400 text-stone-900 outline-none focus:border-stone-900';

  return (
    <div className="min-h-screen bg-[#f3efe6] flex items-center justify-center px-6 py-16">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <p className="font-mono text-sm tracking-[0.22em] mb-10">GATE</p>
        <h1 className="text-2xl font-semibold text-stone-900">Student account</h1>
        <p className="text-sm text-stone-500 mt-1 mb-8">Door staff accounts are issued by the college, not this form.</p>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-stone-600 mb-1">Full name</label>
            <input type="text" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">College email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="name@college.edu" />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">Student ID <span className="text-stone-400">(optional)</span></label>
            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-stone-900 text-white py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-60">
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-stone-600 mt-6">
          Already have an account?{' '}
          <Link href="/" className="text-stone-900 underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
