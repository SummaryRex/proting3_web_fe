import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi, getStoredUser, getStoredToken, saveAuth } from '../services/authService';

/**
 * @typedef {Object} AuthContextValue
 * @property {Object|null} user - Current logged-in user
 * @property {boolean} isAuthenticated - Whether user is logged in
 * @property {boolean} isLoading - Whether auth check is in progress
 * @property {string|null} error - Login error message
 * @property {(username: string, password: string) => Promise<void>} login
 * @property {() => void} logout
 * @property {() => void} clearError
 */

const AuthContext = createContext(null);

/**
 * Auth provider — wraps the app and provides login/logout/user state.
 *
 * Usage:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true on mount = checking stored session
  const [error, setError] = useState(null);

  // ── On mount: check for existing session ──
  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // ── Login ──
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, user: userData } = await loginApi(username, password);
      saveAuth(token, userData);
      setUser(userData);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(() => {
    logoutApi();
    setUser(null);
    setError(null);
  }, []);

  // ── Clear error ──
  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access auth context.
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
