'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * Handles the Authentication logic
   * Communicates with the Render backend via the Axios instance
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(false); // Reset loading state if needed
    setLoading(true);

    try {
      // 1. Send credentials to the live Render API
      const response = await api.post('/auth/login', { email, password });
      
      // 2. Extract JWT and store it for subsequent authenticated requests
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      toast.success('Login successful!');

      // 3. Role-based routing
      // Admins are directed to the scanner; students to their event dashboard.
      if (email.includes('admin')) {
        router.push('/admin/scanner');
      } else {
        router.push('/student/dashboard');
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to login';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Toaster position="top-center" />
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to access the check-in system</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              required
              autoComplete="off" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Input Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Password
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex justify-center items-center shadow-md active:scale-[0.98]"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}