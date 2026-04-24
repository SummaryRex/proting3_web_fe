import axios from 'axios';

/**
 * Axios instance for Laravel API
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// ─────────────────────────────
// REQUEST INTERCEPTOR (AUTH)
// ─────────────────────────────
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

// ─────────────────────────────
// RESPONSE INTERCEPTOR
// ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('djati_token');
      localStorage.removeItem('djati_user');
      window.location.href = '/login';
    }

    if (status === 403) {
      console.warn('Access forbidden (role not allowed)');
    }

    console.error(
      'API ERROR:',
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

// ─────────────────────────────
// ENV FLAG (MOCK MODE)
// ─────────────────────────────
export const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export default api;