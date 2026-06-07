import api from "./api";

/**
 * ===============================
 * VEHICLE ASSIGNMENT SERVICE (ADMIN)
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

// GET semua assignment
export const getAssignments = async () => {
  try {
    const res = await api.get("/admin/vehicle-assignments");

    console.log("VEHICLE ASSIGNMENTS RAW:", res.data);

    return unwrapList(res.data);
  } catch (error) {
    console.error("GET ASSIGNMENTS ERROR:", error.response || error);
    throw error.response?.data || error.message;
  }
};

// CREATE assignment
export const createAssignment = async (data) => {
  try {
    const res = await api.post("/admin/vehicle-assignments", {
      vehicle_id: data.vehicle_id,
      driver_id: data.driver_id,
    });

    console.log("CREATE ASSIGNMENT RAW:", res.data);

    return unwrapItem(res.data);
  } catch (error) {
    console.error("CREATE ASSIGNMENT ERROR:", error.response || error);
    throw error.response?.data || error.message;
  }
};

// DELETE assignment
export const deleteAssignment = async (id) => {
  try {
    if (!id) {
      throw new Error("ID assignment tidak valid");
    }

    const res = await api.delete(`/admin/vehicle-assignments/${id}`);

    console.log("DELETE ASSIGNMENT RAW:", res.data);

    return res.data;
  } catch (error) {
    console.error("DELETE ASSIGNMENT ERROR:", error.response || error);
    throw error.response?.data || error.message;
  }
};