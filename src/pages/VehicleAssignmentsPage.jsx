import { useEffect, useState } from "react";
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

  const fetchData = async () => {
    try {
      const [assignmentData, vehicleData, driverData] = await Promise.all([
        getAssignments(),
        getVehicles(),
        getDrivers(),
      ]);

      setAssignments(assignmentData);
      setVehicles(vehicleData);
      setDrivers(driverData);
    } catch (error) {
      console.error("FETCH ASSIGNMENT DATA ERROR:", error);
      alert(error.message || "Gagal mengambil data assignment");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      alert(error.message || "Gagal assign kendaraan");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (id) => {
    if (!confirm("Unassign kendaraan ini?")) return;

    try {
      await deleteAssignment(id);
      await fetchData();
    } catch (error) {
      console.error("DELETE ASSIGNMENT ERROR:", error);
      alert(error.message || "Gagal unassign kendaraan");
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
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.equipment_name} - {vehicle.plate_number}
              </option>
            ))}
          </select>

          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="bg-[#121212] p-3 rounded-lg outline-none"
            required
          >
            <option value="">Pilih Driver</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} - {driver.username}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="bg-djati-amber text-black font-bold rounded-lg px-4 py-3 disabled:opacity-50"
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
                <th className="p-4 text-left font-bold">Action</th>
              </tr>
            </thead>

            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="border-t border-white/10">
                  <td className="p-3">
                    {assignment.vehicle?.equipment_name || "-"}
                  </td>
                  <td className="p-3">
                    {assignment.vehicle?.plate_number || "-"}
                  </td>
                  <td className="p-3">{assignment.driver?.name || "-"}</td>
                  <td className="p-3">{assignment.assigned_at || "-"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleUnassign(assignment.id)}
                      className="px-3 py-1 rounded bg-red-500 text-white"
                    >
                      Unassign
                    </button>
                  </td>
                </tr>
              ))}

              {assignments.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-white/50">
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