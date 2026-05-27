import api from "./api";

/**
 * ===============================
 * VEHICLE SERVICE (ADMIN)
 * ===============================
 */

// GET semua kendaraan
export const getVehicles = async () => {
  const res = await api.get("/admin/vehicles");
  return res.data;
};

// CREATE kendaraan
export const createVehicle = async (data) => {
  const res = await api.post("/admin/vehicles", data);
  return res.data;
};

// UPDATE kendaraan
export const updateVehicle = async (id, data) => {
  const res = await api.put(`/admin/vehicles/${id}`, data);
  return res.data;
};

// DELETE kendaraan
export const deleteVehicle = async (id) => {
  const res = await api.delete(`/admin/vehicles/${id}`);
  return res.data;
};