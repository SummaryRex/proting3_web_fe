import axios from "axios";

/**
 * ===============================
 * BASE CONFIG
 * ===============================
 */

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: BASE_URL,

  headers: {
    "Content-Type":
      "application/json",

    Accept:
      "application/json",
  },

  // DIPERBESAR AGAR TIDAK TIMEOUT
  timeout: 60000,
});

/**
 * ===============================
 * REQUEST INTERCEPTOR
 * ===============================
 */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "djati_token"
      );

    if (
      token &&
      token !== "null" &&
      token !== "undefined"
    ) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    console.log(
      "[API REQUEST]",
      {
        method:
          config.method?.toUpperCase(),

        url:
          config.baseURL +
          config.url,

        params:
          config.params || null,

        data:
          config.data || null,
      }
    );

    return config;
  },

  (error) => {
    console.error(
      "[REQUEST ERROR]",
      error
    );

    return Promise.reject(
      error
    );
  }
);

/**
 * ===============================
 * RESPONSE INTERCEPTOR
 * ===============================
 */

api.interceptors.response.use(
  (response) => {
    console.log(
      "[API RESPONSE]",
      {
        url:
          response.config?.url,

        status:
          response.status,

        data:
          response.data,
      }
    );

    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    const data =
      error.response?.data;

    console.error(
      "[API ERROR]",
      {
        url:
          error.config?.url,

        method:
          error.config?.method,

        status,

        data,

        message:
          error.message,
      }
    );

    // -----------------------------------------------------------------
    // TOKEN EXPIRED
    // -----------------------------------------------------------------

    if (status === 401) {
      clearAuth();
      redirectToLogin();
    }

    // -----------------------------------------------------------------
    // FORBIDDEN
    // -----------------------------------------------------------------

    if (status === 403) {
      console.warn(
        "Forbidden: role tidak diizinkan"
      );
    }

    // -----------------------------------------------------------------
    // HTML RESPONSE
    // biasanya redirect login laravel
    // -----------------------------------------------------------------

    const isHtml =
      typeof data ===
        "string" &&
      data.includes(
        "<!DOCTYPE html"
      );

    if (isHtml) {
      clearAuth();
      redirectToLogin();
    }

    // -----------------------------------------------------------------
    // TIMEOUT ERROR
    // -----------------------------------------------------------------

    if (
      error.code ===
      "ECONNABORTED"
    ) {
      console.error(
        "REQUEST TIMEOUT: Backend terlalu lama merespon"
      );
    }

    // -----------------------------------------------------------------
    // NETWORK ERROR
    // -----------------------------------------------------------------

    if (
      error.message ===
      "Network Error"
    ) {
      console.error(
        "Tidak dapat terhubung ke backend Laravel"
      );
    }

    return Promise.reject(
      error
    );
  }
);

/**
 * ===============================
 * AUTH STORAGE
 * ===============================
 */

export const setToken = (
  token
) => {
  if (token) {
    localStorage.setItem(
      "djati_token",
      token
    );
  }
};

export const setUser = (
  user
) => {
  localStorage.setItem(
    "djati_user",
    JSON.stringify(user)
  );
};

export const getToken = () => {
  return localStorage.getItem(
    "djati_token"
  );
};

export const getUser = () => {
  const raw =
    localStorage.getItem(
      "djati_user"
    );

  return raw
    ? JSON.parse(raw)
    : null;
};

export const clearAuth = () => {
  localStorage.removeItem(
    "djati_token"
  );

  localStorage.removeItem(
    "djati_user"
  );
};

const redirectToLogin = () => {
  if (
    window.location.pathname !==
    "/login"
  ) {
    window.location.href =
      "/login";
  }
};

/**
 * ===============================
 * AUTH API
 * ===============================
 */

// LOGIN

export const loginApi =
  async ({
    username,
    password,
  }) => {
    const res =
      await api.post(
        "/login",
        {
          username,
          password,
        }
      );

    const {
      token,
      user,
    } = res.data;

    setToken(token);
    setUser(user);

    return res.data;
  };

// GET CURRENT USER

export const meApi =
  async () => {
    const res =
      await api.get("/me");

    return res.data;
  };

// LOGOUT

export const logoutApi =
  async () => {
    try {
      await api.post(
        "/logout"
      );
    } catch (err) {
      console.warn(
        "Logout error ignored"
      );
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

export const getVehicles =
  async () => {
    const res =
      await api.get(
        "/admin/vehicles"
      );

    return res.data;
  };

// CREATE VEHICLE

export const createVehicle =
  async (data) => {
    const res =
      await api.post(
        "/admin/vehicles",
        data
      );

    return res.data;
  };

// UPDATE VEHICLE

export const updateVehicle =
  async (
    id,
    data
  ) => {
    const res =
      await api.put(
        `/admin/vehicles/${id}`,
        data
      );

    return res.data;
  };

// DELETE VEHICLE

export const deleteVehicle =
  async (id) => {
    const res =
      await api.delete(
        `/admin/vehicles/${id}`
      );

    return res.data;
  };

/**
 * ===============================
 * VEHICLE ASSIGNMENT API
 * ===============================
 */

// GET ALL ASSIGNMENTS

export const getAssignments =
  async () => {
    const res =
      await api.get(
        "/admin/vehicle-assignments"
      );

    return res.data;
  };

// CREATE ASSIGNMENT

export const createAssignment =
  async (data) => {
    const res =
      await api.post(
        "/admin/vehicle-assignments",
        data
      );

    return res.data;
  };

// DELETE ASSIGNMENT

export const deleteAssignment =
  async (id) => {
    const res =
      await api.delete(
        `/admin/vehicle-assignments/${id}`
      );

    return res.data;
  };

/**
 * ===============================
 * USER API
 * ===============================
 */

// GET ALL USERS

export const getUsers =
  async () => {
    const res =
      await api.get(
        "/admin/users"
      );

    return res.data;
  };

/**
 * ===============================
 * TECHNICIAN API
 * ===============================
 */

// GET TECHNICIANS

export const getTechniciansApi =
  async () => {
    try {
      const res =
        await api.get(
          "/admin/technicians"
        );

      return res.data;
    } catch (error) {
      console.warn(
        "Fallback technicians endpoint..."
      );

      try {
        const res =
          await api.get(
            "/technicians"
          );

        return res.data;
      } catch (
        fallbackError
      ) {
        console.error(
          "GET TECHNICIANS FAILED",
          fallbackError
        );

        return [];
      }
    }
  };

/**
 * ===============================
 * ADMIN PART / INVENTORY API
 * ===============================
 */

// GET ALL PARTS / SPAREPARTS

export const getPartsApi =
  async (search = "") => {
    const res =
      await api.get(
        "/admin/parts",
        {
          params:
            search
              ? { search }
              : {},
        }
      );

    return res.data;
  };

// CREATE PART / SPAREPART

export const createPartApi =
  async (data) => {
    const res =
      await api.post(
        "/admin/parts",
        data
      );

    return res.data;
  };

// UPDATE PART / SPAREPART

export const updatePartApi =
  async (
    id,
    data
  ) => {
    const res =
      await api.put(
        `/admin/parts/${id}`,
        data
      );

    return res.data;
  };

// DELETE PART / SPAREPART

export const deletePartApi =
  async (id) => {
    const res =
      await api.delete(
        `/admin/parts/${id}`
      );

    return res.data;
  };

/**
 * ===============================
 * ADMIN STOCK MOVEMENT API
 * ===============================
 */

// GET STOCK MOVEMENTS

export const getStockMovementsApi =
  async (limit = 50) => {
    const res =
      await api.get(
        "/admin/stock-movements",
        {
          params: {
            limit,
          },
        }
      );

    return res.data;
  };

// CREATE STOCK IN
// type wajib IN dari backend

export const createStockInApi =
  async (data) => {
    const res =
      await api.post(
        "/admin/stock-movements",
        {
          ...data,
          type: "IN",
        }
      );

    return res.data;
  };

/**
 * ===============================
 * ADMIN PART USAGE APPROVAL API
 * ===============================
 */

// GET PART USAGE REQUESTS

export const getPartUsagesApi =
  async ({
    status = "pending",
    limit = 50,
  } = {}) => {
    const res =
      await api.get(
        "/admin/part-usages",
        {
          params: {
            status,
            limit,
          },
        }
      );

    return res.data;
  };

// APPROVE PART USAGE

export const approvePartUsageApi =
  async (
    id,
    data = {}
  ) => {
    const res =
      await api.post(
        `/admin/part-usages/${id}/approve`,
        data
      );

    return res.data;
  };

// REJECT PART USAGE

export const rejectPartUsageApi =
  async (
    id,
    data = {}
  ) => {
    const res =
      await api.post(
        `/admin/part-usages/${id}/reject`,
        data
      );

    return res.data;
  };

/**
 * ===============================
 * ADMIN COST ESTIMATE APPROVAL API
 * ===============================
 */

// GET COST ESTIMATES

export const getCostEstimatesApi =
  async (status = "submitted") => {
    const res =
      await api.get(
        "/admin/cost-estimates",
        {
          params: {
            status,
          },
        }
      );

    return res.data;
  };

// APPROVE COST ESTIMATE

export const approveCostEstimateApi =
  async (id) => {
    const res =
      await api.post(
        `/admin/cost-estimates/${id}/approve`
      );

    return res.data;
  };

// REJECT COST ESTIMATE

export const rejectCostEstimateApi =
  async (
    id,
    data = {}
  ) => {
    const res =
      await api.post(
        `/admin/cost-estimates/${id}/reject`,
        data
      );

    return res.data;
  };

/**
 * ===============================
 * ADMIN FINANCE TRANSACTION API
 * ===============================
 */

// GET FINANCE TRANSACTIONS

export const getFinanceTransactionsApi =
  async ({
    month = "",
    type = "",
    source = "",
  } = {}) => {
    const params = {};

    if (month) {
      params.month = month;
    }

    if (type) {
      params.type = type;
    }

    if (source) {
      params.source = source;
    }

    const res =
      await api.get(
        "/admin/transactions",
        {
          params,
        }
      );

    return res.data;
  };

// CREATE FINANCE TRANSACTION
// Untuk manual, gunakan type income.
// Expense manual akan ditolak backend.

export const createFinanceTransactionApi =
  async (data) => {
    const res =
      await api.post(
        "/admin/transactions",
        data
      );

    return res.data;
  };

// UPDATE FINANCE TRANSACTION
// Hanya income manual yang boleh diedit.

export const updateFinanceTransactionApi =
  async (
    id,
    data
  ) => {
    const res =
      await api.put(
        `/admin/transactions/${id}`,
        data
      );

    return res.data;
  };

// DELETE FINANCE TRANSACTION
// Hanya income manual yang boleh dihapus.

export const deleteFinanceTransactionApi =
  async (id) => {
    const res =
      await api.delete(
        `/admin/transactions/${id}`
      );

    return res.data;
  };

/**
 * ===============================
 * EXPORT INSTANCE
 * ===============================
 */

export default api; 