import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  login as loginApi,
  logout as logoutApi,
  getStoredUser,
  getStoredToken,
  saveAuth,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─────────────────────────────
  // INIT SESSION
  // ─────────────────────────────
  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  // ─────────────────────────────
  // LOGIN
  // ─────────────────────────────
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginApi({ username, password });

      const { token, user } = response;

      if (!token || !user) {
        throw new Error("Login gagal: data tidak valid");
      }

      // single source of truth
      saveAuth(token, user);
      setUser(user);

      return user;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login gagal";

      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─────────────────────────────
  // LOGOUT
  // ─────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.warn("Logout API failed, forcing local logout");
    }

    localStorage.removeItem("djati_token");
    localStorage.removeItem("djati_user");

    setUser(null);
    setError(null);
  }, []);

  // ─────────────────────────────
  // CLEAR ERROR
  // ─────────────────────────────
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}