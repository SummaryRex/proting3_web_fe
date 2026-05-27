import {
  loginApi,
  logoutApi,
  meApi,
  getUser,
  getToken,
  setToken,
  setUser,
  clearAuth,
} from "./api";

/**
 * ===============================
 * LOGIN
 * ===============================
 */
export async function login({ username, password }) {
  try {
    const res = await loginApi({ username, password });

    const { token, user } = res;

    if (!token || !user) {
      throw new Error("Response login tidak valid");
    }

    return { token, user };
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    throw (
      error?.response?.data || {
        message: error?.message || "Login gagal",
      }
    );
  }
}

/**
 * ===============================
 * LOGOUT
 * ===============================
 */
export async function logout() {
  try {
    await logoutApi();
  } catch (error) {
    console.warn("Logout API error ignored:", error);
  } finally {
    clearAuth();
  }
}

/**
 * ===============================
 * GET CURRENT USER
 * ===============================
 */
export async function getMe() {
  try {
    const user = await meApi();
    return user;
  } catch (error) {
    console.error("ME ERROR:", error);
    throw error?.response?.data || error?.message || error;
  }
}

/**
 * ===============================
 * LOCAL STORAGE HELPERS
 * ===============================
 */
export function saveAuth(token, user) {
  setToken(token);
  setUser(user);
}

export function getStoredUser() {
  return getUser();
}

export function getStoredToken() {
  return getToken();
}

export function isAuthenticated() {
  return !!getToken();
}

export function clearSession() {
  clearAuth();
}

/**
 * ===============================
 * REFRESH USER
 * ===============================
 */
export async function refreshUser() {
  try {
    const user = await meApi();

    setUser(user);

    return user;
  } catch (error) {
    console.warn("REFRESH USER FAILED:", error);

    clearAuth();
    return null;
  }
}