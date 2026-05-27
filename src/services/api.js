import axios from "axios";

/**
 * ===============================
 * BASE CONFIG
 * ===============================
 */
const BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

/**
 * ===============================
 * REQUEST INTERCEPTOR
 * ===============================
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("djati_token");

    if (token && token !== "null" && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("[REQUEST ERROR]", error);
    return Promise.reject(error);
  }
);

/**
 * ===============================
 * RESPONSE INTERCEPTOR
 * ===============================
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    console.error("[API ERROR]", {
      status,
      data,
      message: error.message,
    });

    if (status === 401) {
      clearAuth();
      redirectToLogin();
    }

    if (status === 403) {
      console.warn("Forbidden: role tidak diizinkan");
    }

    const isHtml =
      typeof data === "string" && data.includes("<!DOCTYPE html");

    if (isHtml) {
      clearAuth();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

/**
 * ===============================
 * AUTH STORAGE
 * ===============================
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem("djati_token", token);
  }
};

export const setUser = (user) => {
  localStorage.setItem("djati_user", JSON.stringify(user));
};

export const getToken = () => {
  return localStorage.getItem("djati_token");
};

export const getUser = () => {
  const raw = localStorage.getItem("djati_user");
  return raw ? JSON.parse(raw) : null;
};

export const clearAuth = () => {
  localStorage.removeItem("djati_token");
  localStorage.removeItem("djati_user");
};

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

/**
 * ===============================
 * AUTH API
 * ===============================
 */

// LOGIN
export const loginApi = async ({ username, password }) => {
  const res = await api.post("/login", {
    username,
    password,
  });

  const { token, user } = res.data;

  setToken(token);
  setUser(user);

  return res.data;
};

// GET CURRENT USER
export const meApi = async () => {
  const res = await api.get("/me");
  return res.data;
};

// LOGOUT
export const logoutApi = async () => {
  try {
    await api.post("/logout");
  } catch (err) {
    console.warn("Logout error ignored");
  } finally {
    clearAuth();
    redirectToLogin();
  }
};

/**
 * ===============================
 * VEHICLE API
 * ===============================
 */

// GET ALL VEHICLES
export const getVehicles = async () => {
  const res = await api.get("/admin/vehicles");
  return res.data;
};

// CREATE VEHICLE
export const createVehicle = async (data) => {
  const res = await api.post("/admin/vehicles", data);
  return res.data;
};

// UPDATE VEHICLE
export const updateVehicle = async (id, data) => {
  const res = await api.put(`/admin/vehicles/${id}`, data);
  return res.data;
};

// DELETE VEHICLE
export const deleteVehicle = async (id) => {
  const res = await api.delete(`/admin/vehicles/${id}`);
  return res.data;
};

/**
 * ===============================
 * VEHICLE ASSIGNMENT API
 * ===============================
 */

// GET ALL ASSIGNMENTS
export const getAssignments = async () => {
  const res = await api.get("/admin/vehicle-assignments");
  return res.data;
};

// CREATE ASSIGNMENT
export const createAssignment = async (data) => {
  const res = await api.post("/admin/vehicle-assignments", data);
  return res.data;
};

// DELETE ASSIGNMENT
export const deleteAssignment = async (id) => {
  const res = await api.delete(`/admin/vehicle-assignments/${id}`);
  return res.data;
};

/**
 * ===============================
 * USER API
 * ===============================
 */

// GET ALL USERS (UNTUK DRIVER DROPDOWN)
export const getUsers = async () => {
  const res = await api.get("/admin/users");
  return res.data;
};

/**
 * ===============================
 * EXPORT INSTANCE
 * ===============================
 */
export default api;