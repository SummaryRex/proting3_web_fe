import api from "./api";

/**
 * ===============================
 * VEHICLE ASSIGNMENT SERVICE
 * ===============================
 *
 * Digunakan untuk:
 * - Admin melihat semua penempatan kendaraan
 * - Admin assign kendaraan ke driver
 * - Admin unassign kendaraan dari driver
 * - Driver melihat kendaraan miliknya
 *
 * Catatan penting:
 * Jangan throw error.response.data secara langsung,
 * karena VehicleAssignmentsPage.jsx membutuhkan struktur Axios error:
 * error.response.status
 * error.response.data.message
 * error.response.data.errors
 */

/**
 * ===============================
 * HELPER
 * ===============================
 */

const unwrapList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
};

const unwrapItem = (payload) => {
  if (payload?.data) {
    return payload.data;
  }

  return payload;
};

const normalizeAssignmentPayload = (data = {}) => {
  return {
    vehicle_id: Number(data.vehicle_id),
    driver_id: Number(data.driver_id),
  };
};

const handleServiceError = (label, error) => {
  console.error(label, {
    status: error?.response?.status || "NO_RESPONSE",
    data: error?.response?.data || null,
    message: error?.message || "Unknown error",
  });

  /**
   * Penting:
   * Lempar error asli dari Axios agar page bisa membaca:
   * error.response.status
   * error.response.data.message
   */
  throw error;
};

/**
 * ===============================
 * GET SEMUA ASSIGNMENT
 * ===============================
 *
 * Backend:
 * GET /api/admin/vehicle-assignments
 */

export const getAssignments = async () => {
  try {
    const res = await api.get("/admin/vehicle-assignments");

    return unwrapList(res.data);
  } catch (error) {
    handleServiceError("GET ASSIGNMENTS ERROR:", error);
  }
};

/**
 * ===============================
 * CREATE ASSIGNMENT
 * ===============================
 *
 * Backend:
 * POST /api/admin/vehicle-assignments
 *
 * Payload:
 * {
 *   vehicle_id: 1,
 *   driver_id: 2
 * }
 */

export const createAssignment = async (data) => {
  try {
    const payload = normalizeAssignmentPayload(data);

    const res = await api.post("/admin/vehicle-assignments", payload);

    return unwrapItem(res.data);
  } catch (error) {
    handleServiceError("CREATE ASSIGNMENT ERROR:", error);
  }
};

/**
 * ===============================
 * DELETE / UNASSIGN ASSIGNMENT
 * ===============================
 *
 * Backend:
 * DELETE /api/admin/vehicle-assignments/{id}
 */

export const deleteAssignment = async (id) => {
  try {
    if (!id) {
      throw new Error("ID assignment tidak valid.");
    }

    const res = await api.delete(`/admin/vehicle-assignments/${id}`);

    return res.data;
  } catch (error) {
    handleServiceError("DELETE ASSIGNMENT ERROR:", error);
  }
};

/**
 * ===============================
 * DRIVER - GET MY VEHICLE
 * ===============================
 *
 * Backend:
 * GET /api/driver/my-vehicle
 *
 * Dipakai jika halaman driver ingin melihat kendaraan
 * yang sedang di-assign ke dirinya.
 */

export const getMyVehicleAssignment = async () => {
  try {
    const res = await api.get("/driver/my-vehicle");

    return unwrapItem(res.data);
  } catch (error) {
    handleServiceError("GET MY VEHICLE ASSIGNMENT ERROR:", error);
  }
};