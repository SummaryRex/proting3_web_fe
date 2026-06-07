import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

import {
  getAssignments,
  createAssignment,
  deleteAssignment,
} from "../services/vehicleAssignment";

import { getVehicles } from "../services/vehicle";
import { getDrivers } from "../services/userService";

export default function VehicleAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const getErrorMessage = (error, fallback) => {
    if (typeof error === "string") return error;

    if (error?.message) return error.message;

    const errors = error?.errors;
    if (errors && typeof errors === "object") {
      const firstKey = Object.keys(errors)[0];

      if (firstKey && Array.isArray(errors[firstKey])) {
        return errors[firstKey][0];
      }
    }

    return fallback;
  };

  const fetchData = async () => {
    setFetchLoading(true);

    try {
      const [assignmentData, vehicleData, driverData] = await Promise.all([
        getAssignments(),
        getVehicles(),
        getDrivers(),
      ]);

      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);

      /**
       * Filter driver.
       * Kalau endpoint getDrivers() memang sudah hanya mengembalikan driver,
       * data tetap aman ditampilkan.
       */
      const normalizedDrivers = Array.isArray(driverData)
        ? driverData.filter((user) => {
            const role =
              user.role?.name ||
              user.role_name ||
              user.role ||
              user.type ||
              "";

            if (!role) return true;

            return String(role).toLowerCase() === "driver";
          })
        : [];

      setDrivers(normalizedDrivers);
    } catch (error) {
      console.error("FETCH ASSIGNMENT DATA ERROR:", error);
      alert(getErrorMessage(error, "Gagal mengambil data assignment"));
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Assignment aktif.
   * Kalau backend hanya mengirim assignment aktif, ini tetap aman.
   */
  const activeAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      return !assignment.unassigned_at && !assignment.deleted_at;
    });
  }, [assignments]);

  /**
   * Supaya kendaraan yang sudah di-assign tidak muncul lagi di dropdown.
   */
  const assignedVehicleIds = useMemo(() => {
    return activeAssignments.map((assignment) =>
      String(assignment.vehicle_id || assignment.vehicle?.id || "")
    );
  }, [activeAssignments]);

  /**
   * Supaya driver yang sudah punya kendaraan tidak muncul lagi di dropdown.
   */
  const assignedDriverIds = useMemo(() => {
    return activeAssignments.map((assignment) =>
      String(assignment.driver_id || assignment.driver?.id || "")
    );
  }, [activeAssignments]);

  const availableVehicles = useMemo(() => {
    return vehicles.filter(
      (vehicle) => !assignedVehicleIds.includes(String(vehicle.id))
    );
  }, [vehicles, assignedVehicleIds]);

  const availableDrivers = useMemo(() => {
    return drivers.filter(
      (driver) => !assignedDriverIds.includes(String(driver.id))
    );
  }, [drivers, assignedDriverIds]);

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!vehicleId || !driverId) {
      alert("Pilih kendaraan dan driver");
      return;
    }

    setLoading(true);

    try {
      await createAssignment({
        vehicle_id: vehicleId,
        driver_id: driverId,
      });

      setVehicleId("");
      setDriverId("");

      await fetchData();
    } catch (error) {
      console.error("CREATE ASSIGNMENT ERROR:", error);
      alert(getErrorMessage(error, "Gagal assign kendaraan"));
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (assignment) => {
    if (assignment.has_running_activity) {
      alert(
        "Kendaraan tidak dapat di-unassign karena masih memiliki report atau maintenance yang sedang berjalan."
      );
      return;
    }

    if (!window.confirm("Unassign kendaraan ini?")) return;

    try {
      await deleteAssignment(assignment.id);
      await fetchData();
    } catch (error) {
      console.error("DELETE ASSIGNMENT ERROR:", error);
      alert(getErrorMessage(error, "Gagal unassign kendaraan"));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121212]">
      <Sidebar />

      <main className="flex-1 p-6 text-white">
        <h1 className="text-2xl font-bold text-djati-amber mb-6">
          Vehicle Assignment
        </h1>

        <form
          onSubmit={handleAssign}
          className="bg-[#1E1E1E] p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="bg-[#121212] p-3 rounded-lg outline-none"
            required
          >
            <option value="">Pilih Kendaraan</option>

            {availableVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.equipment_name || "-"} - {vehicle.plate_number || "-"}
              </option>
            ))}

            {availableVehicles.length === 0 && (
              <option value="" disabled>
                Tidak ada kendaraan tersedia
              </option>
            )}
          </select>

          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="bg-[#121212] p-3 rounded-lg outline-none"
            required
          >
            <option value="">Pilih Driver</option>

            {availableDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name || "-"} - {driver.username || "-"}
              </option>
            ))}

            {availableDrivers.length === 0 && (
              <option value="" disabled>
                Tidak ada driver tersedia
              </option>
            )}
          </select>

          <button
            type="submit"
            disabled={loading || fetchLoading}
            className="bg-djati-amber text-black font-bold rounded-lg px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </form>

        <div className="bg-[#1E1E1E] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-djati-amber text-black">
              <tr>
                <th className="p-4 text-left font-bold">Equipment</th>
                <th className="p-4 text-left font-bold">Plate</th>
                <th className="p-4 text-left font-bold">Driver</th>
                <th className="p-4 text-left font-bold">Assigned At</th>
                <th className="p-4 text-left font-bold">Status</th>
                <th className="p-4 text-left font-bold">Action</th>
              </tr>
            </thead>

            <tbody>
              {fetchLoading ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-white/50">
                    Loading data assignment...
                  </td>
                </tr>
              ) : activeAssignments.length > 0 ? (
                activeAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-white/10">
                    <td className="p-3">
                      {assignment.vehicle?.equipment_name || "-"}
                    </td>

                    <td className="p-3">
                      {assignment.vehicle?.plate_number || "-"}
                    </td>

                    <td className="p-3">
                      {assignment.driver?.name || "-"}
                    </td>

                    <td className="p-3">
                      {assignment.assigned_at
                        ? new Date(assignment.assigned_at).toLocaleString(
                            "id-ID"
                          )
                        : "-"}
                    </td>

                    <td className="p-3">
                      {assignment.has_running_activity ? (
                        <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
                          Report Berjalan
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                          Aman
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => handleUnassign(assignment)}
                        disabled={assignment.has_running_activity}
                        title={
                          assignment.has_running_activity
                            ? "Tidak bisa unassign karena masih ada report atau maintenance berjalan"
                            : "Unassign kendaraan"
                        }
                        className={`px-3 py-1 rounded text-white ${
                          assignment.has_running_activity
                            ? "bg-gray-500 cursor-not-allowed opacity-70"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {assignment.has_running_activity
                          ? "Tidak Bisa"
                          : "Unassign"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-white/50">
                    Belum ada assignment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}