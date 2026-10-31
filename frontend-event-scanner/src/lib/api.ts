import axios from 'axios';
import { clearAuth } from './auth';

export const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://qr-based-event-check-in-system.onrender.com/api';

export const socketUrl = apiBase.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: apiBase,
  timeout: 70000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function isApiUnavailable(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  return !error.response || error.response.status >= 500;
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== '/' && path !== '/register') {
        clearAuth();
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
