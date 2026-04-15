import api, { useMock } from './api';

/**
 * @typedef {Object} User
 * @property {string} name
 * @property {string} role - 'Admin' | 'Mechanic' | 'Operator'
 * @property {string} [avatar]
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} token
 * @property {User} user
 */

// ── Mock implementation (used until backend is ready) ──
const mockLogin = async (username, password) => {
  await new Promise((r) => setTimeout(r, 800)); // simulate network delay
  if (!username || !password) throw new Error('Username and password are required');

  return {
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      name: 'Windah Basudara',
      role: 'Admin',
      initials: 'W',
    },
  };
};

/**
 * Login with username and password.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<LoginResponse>}
 */
export async function login(username, password) {
  if (useMock) return mockLogin(username, password);

  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

/**
 * Logout — clear stored credentials.
 */
export function logout() {
  localStorage.removeItem('djati_token');
  localStorage.removeItem('djati_user');
}

/**
 * Get stored user from localStorage.
 * @returns {User|null}
 */
export function getStoredUser() {
  const raw = localStorage.getItem('djati_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get stored token.
 * @returns {string|null}
 */
export function getStoredToken() {
  return localStorage.getItem('djati_token');
}

/**
 * Save auth data to localStorage.
 * @param {string} token
 * @param {User} user
 */
export function saveAuth(token, user) {
  localStorage.setItem('djati_token', token);
  localStorage.setItem('djati_user', JSON.stringify(user));
}
