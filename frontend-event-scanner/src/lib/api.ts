import axios from 'axios';

// 1. Create the base instance
const api = axios.create({
  baseURL: 'https://qr-based-event-check-in-system.onrender.com/api', // <-- Your live Render link!
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