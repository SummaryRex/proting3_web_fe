import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../services/vehicle";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    equipment_name: "",
    plate_number: "",
    brand: "",
    model: "",
    year: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error("GET VEHICLES ERROR:", error);
      alert(error.message || "Gagal mengambil data kendaraan");
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const resetForm = () => {
    setForm({
      equipment_name: "",
      plate_number: "",
      brand: "",
      model: "",
      year: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        equipment_name: form.equipment_name,
        plate_number: form.plate_number,
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? Number(form.year) : null,
      };

      if (editingId) {
        await updateVehicle(editingId, payload);
      } else {
        await createVehicle(payload);
      }

      resetForm();
      await fetchVehicles();
    } catch (error) {
      console.error("SAVE VEHICLE ERROR:", error);
      alert(error.message || "Gagal menyimpan kendaraan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      equipment_name: vehicle.equipment_name || "",
      plate_number: vehicle.plate_number || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus kendaraan ini?")) return;

    try {
      await deleteVehicle(id);
      await fetchVehicles();
    } catch (error) {
      console.error("DELETE VEHICLE ERROR:", error);
      alert(error.message || "Gagal menghapus kendaraan");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121212]">
      <Sidebar />

      <main className="flex-1 p-6 text-white">
        <h1 className="text-2xl font-bold text-djati-amber mb-6">
          Vehicles
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1E1E1E] p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <input
            placeholder="Equipment Name"
            value={form.equipment_name}
            onChange={(e) =>
              setForm({ ...form, equipment_name: e.target.value })
            }
            className="bg-[#121212] p-3 rounded-lg outline-none"
            required
          />

          <input
            placeholder="Plate Number"
            value={form.plate_number}
            onChange={(e) =>
              setForm({ ...form, plate_number: e.target.value })
            }
            className="bg-[#121212] p-3 rounded-lg outline-none"
            required
          />

          <input
            placeholder="Brand"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="bg-[#121212] p-3 rounded-lg outline-none"
          />

          <input
            placeholder="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="bg-[#121212] p-3 rounded-lg outline-none"
          />

          <input
            placeholder="Year"
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="bg-[#121212] p-3 rounded-lg outline-none"
          />

          <div className="md:col-span-5 flex gap-3">
            <button
              disabled={loading}
              className="bg-djati-amber text-black font-bold px-5 py-3 rounded-lg disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Vehicle"
                : "Add Vehicle"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-white/10 text-white font-bold px-5 py-3 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="bg-[#1E1E1E] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-djati-amber text-black">
              <tr>
                <th className="p-3 text-left">Equipment</th>
                <th className="p-3 text-left">Plate</th>
                <th className="p-3 text-left">Brand</th>
                <th className="p-3 text-left">Model</th>
                <th className="p-3 text-left">Year</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-white/10">
                  <td className="p-3">{vehicle.equipment_name}</td>
                  <td className="p-3">{vehicle.plate_number}</td>
                  <td className="p-3">{vehicle.brand || "-"}</td>
                  <td className="p-3">{vehicle.model || "-"}</td>
                  <td className="p-3">{vehicle.year || "-"}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="px-3 py-1 rounded bg-blue-500 text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="px-3 py-1 rounded bg-red-500 text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-white/50">
                    Belum ada kendaraan
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