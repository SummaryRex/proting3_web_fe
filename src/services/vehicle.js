import api from "./api";

/**
 * ===============================
 * VEHICLE SERVICE (ADMIN)
 * ===============================
 *
 * File ini dipakai oleh VehiclesPage.jsx untuk:
 * - mengambil semua data kendaraan
 * - menambah kendaraan
 * - mengubah kendaraan
 * - menghapus kendaraan
 *
 * Struktur function tetap dipertahankan agar tidak mengubah pola pemanggilan
 * di frontend yang sudah ada.
 */

/**
 * ===============================
 * HELPER
 * ===============================
 */

const toNumberOrZero = (value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);

  return Number.isNaN(number) ? 0 : number;
};

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
};

const cleanString = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return value.toString().trim();
};

/**
 * ===============================
 * NORMALIZER
 * ===============================
 *
 * Tujuannya:
 * - memastikan payload dari VehiclesPage.jsx rapi sebelum dikirim ke backend
 * - menyesuaikan field:
 *   initial_hour_meter
 *   current_hour_meter
 *   latest_hour_meter
 *   final_hour_meter
 *   hour_meter_terbaru
 *   target_availability
 *   status
 *
 * Catatan:
 * Backend tetap menyimpan HM Awal di initial_kpi.
 * Frontend mengirim initial_hour_meter agar nama field lebih jelas.
 */

const normalizeVehiclePayload = (data = {}) => {
  /**
   * HM Awal
   *
   * Di frontend: initial_hour_meter
   * Di backend lama/database: initial_kpi
   */
  const initialHourMeter = toNumberOrZero(
    data.initial_hour_meter ?? data.initial_kpi ?? 0
  );

  /**
   * HM Terbaru
   *
   * Diutamakan dari:
   * - current_hour_meter
   * - latest_hour_meter
   * - final_hour_meter
   * - hour_meter_terbaru
   *
   * Kalau kosong, fallback ke initialHourMeter.
   */
  const currentHourMeter =
    toNumberOrNull(
      data.current_hour_meter ??
        data.latest_hour_meter ??
        data.final_hour_meter ??
        data.hour_meter_terbaru
    ) ?? initialHourMeter;

  const totalOperatingHours = toNumberOrZero(data.total_operating_hours ?? 0);
  const totalRepairTime = toNumberOrZero(data.total_repair_time ?? 0);

  const targetAvailability = toNumberOrZero(
    data.target_availability ?? data.target_ma ?? 90
  );

  return {
    equipment_name: data.equipment_name?.trim() || "",
    plate_number: data.plate_number?.trim() || "",
    serial_number: data.serial_number?.trim() || "",

    /**
     * HM Awal.
     * Backend VehicleController akan mapping ke initial_kpi.
     */
    initial_hour_meter: initialHourMeter,

    /**
     * HM Terbaru.
     * Backend akan menyimpan ke:
     * - current_hour_meter
     * - latest_hour_meter
     * - final_hour_meter
     */
    current_hour_meter: currentHourMeter,
    latest_hour_meter: currentHourMeter,
    final_hour_meter: currentHourMeter,
    hour_meter_terbaru: currentHourMeter,

    /**
     * Target MA.
     */
    target_availability: targetAvailability,
    target_ma: targetAvailability,

    /**
     * Data pendukung.
     * Mechanical Availability tetap dihitung backend,
     * bukan dihitung di frontend.
     */
    total_operating_hours: totalOperatingHours,
    total_repair_time: totalRepairTime,

    brand: cleanString(data.brand),
    model: cleanString(data.model),
    year: data.year ? Number(data.year) : null,

    status: data.status || "active",
  };
};

/**
 * ===============================
 * GET SEMUA KENDARAAN
 * ===============================
 *
 * Endpoint:
 * GET /api/admin/vehicles
 */

export const getVehicles = async () => {
  const res = await api.get("/admin/vehicles");
  return res.data;
};

/**
 * ===============================
 * CREATE KENDARAAN
 * ===============================
 *
 * Endpoint:
 * POST /api/admin/vehicles
 */

export const createVehicle = async (data) => {
  const payload = normalizeVehiclePayload(data);

  const res = await api.post("/admin/vehicles", payload);
  return res.data;
};

/**
 * ===============================
 * UPDATE KENDARAAN
 * ===============================
 *
 * Endpoint:
 * PUT /api/admin/vehicles/{id}
 */

export const updateVehicle = async (id, data) => {
  const payload = normalizeVehiclePayload(data);

  const res = await api.put(`/admin/vehicles/${id}`, payload);
  return res.data;
};

/**
 * ===============================
 * DELETE KENDARAAN
 * ===============================
 *
 * Endpoint:
 * DELETE /api/admin/vehicles/{id}
 */

export const deleteVehicle = async (id) => {
  const res = await api.delete(`/admin/vehicles/${id}`);
  return res.data;
};