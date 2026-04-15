import axios from 'axios';

/**
 * Axios instance with base URL and auth interceptor.
 * All service files should import this instead of raw axios.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request Interceptor: inject auth token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('djati_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 (expired token) ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('djati_token');
      localStorage.removeItem('djati_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to check if we should use mock data instead of real API.
 * Set VITE_USE_MOCK=false in .env when backend is ready.
 */
export const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export default api;
