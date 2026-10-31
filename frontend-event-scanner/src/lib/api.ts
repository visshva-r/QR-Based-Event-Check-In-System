import axios from 'axios';
import { clearAuth } from './auth';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://qr-based-event-check-in-system.onrender.com/api';
export const API_TIMEOUT_MS = 70_000;

export const socketUrl = apiBase.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: apiBase,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export function isWakeUpError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  return !error.response || [502, 503, 504].includes(error.response.status);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isWakeUpError(error)) return 'The API may be waking up. Retry in a moment.';
  if (axios.isAxiosError(error) && typeof error.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  return fallback;
}

export async function getWithWakeRetry<T>(path: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await api.get<T>(path);
    } catch (error) {
      if (attempt === 1 || !isWakeUpError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  throw new Error('API request failed');
}

export default api;
