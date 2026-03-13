import axios from 'axios';

// 1. Create the base instance (use env for local dev, fallback to Render)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://qr-based-event-check-in-system.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. The Interceptor: Automatically attach the JWT token if it exists
api.interceptors.request.use(
  (config) => {
    // Check if we are in the browser (Next.js SSR safety check)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;