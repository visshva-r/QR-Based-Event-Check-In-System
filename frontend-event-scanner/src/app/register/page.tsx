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
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-10 space-y-8 border-[6px] border-black">
        <div className="text-center">
          <h1 className="text-5xl font-black text-black tracking-tighter italic uppercase">Sign Up</h1>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-2">Create Student Account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Full Name</label>
            <input 
              type="text" 
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black rounded-xl text-black font-bold placeholder-gray-400 focus:bg-gray-50 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black rounded-xl text-black font-bold placeholder-gray-400 focus:bg-gray-50 outline-none transition-all"
              placeholder="name@college.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Student ID (optional)</label>
            <input 
              type="text" 
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 border-4 border-black rounded-xl text-black font-bold placeholder-gray-400 focus:bg-gray-50 outline-none transition-all"
              placeholder="e.g. S12345"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              required
              minLength={6}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm font-bold text-black">
          Already have an account?{' '}
          <Link href="/" className="underline decoration-4 hover:decoration-black">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
