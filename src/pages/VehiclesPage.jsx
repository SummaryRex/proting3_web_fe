import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../services/vehicle";

function isTechnicalMessage(message) {
  const value = String(message || "").toLowerCase();

  return (
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    value.includes("endpoint") ||
    value.includes("network error") ||
    value.includes("request failed") ||
    value.includes("axios") ||
    value.includes("http://") ||
    value.includes("https://")
  );
}

function getFriendlyErrorMessage(error, fallback) {
  if (error?.errors) {
    const messages = Object.values(error.errors).flat().join("\n");
    return messages || fallback;
  }

  if (error?.response?.data?.errors) {
    const messages = Object.values(error.response.data.errors).flat().join("\n");
    return messages || fallback;
  }

  const serverMessage =
    error?.response?.data?.message ||
    error?.message ||
    "";

  if (serverMessage && !isTechnicalMessage(serverMessage)) {
    return serverMessage;
  }

  return fallback;
}

function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const colorClass =
    notification.type === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : notification.type === "warning"
      ? "border-orange-400/40 bg-orange-500/10 text-orange-300"
      : "border-red-500/40 bg-red-500/10 text-red-300";

  const title =
    notification.type === "success"
      ? "Berhasil"
      : notification.type === "warning"
      ? "Perhatian"
      : "Terjadi Kendala";

  return (
    <div className="fixed right-5 top-5 z-[9999] w-[360px] max-w-[calc(100vw-2rem)]">
      <div
        className={`rounded-2xl border bg-[#171a23] px-4 py-3 shadow-2xl backdrop-blur ${colorClass}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold">{title}</h4>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed opacity-90">
              {notification.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-lg leading-none opacity-70 transition hover:opacity-100"
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171a23] p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-orange-300">{title}</h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}



export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);

  const [form, setForm] = useState({
    equipment_name: "",
    plate_number: "",
    serial_number: "",
    brand: "",
    model: "",
    year: "",
    initial_hour_meter: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");

  const [notification, setNotification] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
    });
  };

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [notification]);

  const getInitialHourMeter = (vehicle) => {
    if (!vehicle) return "";

    return (
      vehicle.initial_hour_meter ??
      vehicle.initial_kpi ??
      vehicle.hour_meter_awal ??
      vehicle.kpi_awal ??
      ""
    );
  };

  const getCurrentHourMeter = (vehicle) => {
    if (!vehicle) return "";

    return (
      vehicle.current_hour_meter ??
      vehicle.latest_hour_meter ??
      vehicle.final_hour_meter ??
      vehicle.hour_meter_terbaru ??
      getInitialHourMeter(vehicle) ??
      ""
    );
  };

  const getMechanicalAvailability = (vehicle) => {
    if (!vehicle) return "";

    return (
      vehicle.current_ma ??
      vehicle.ma ??
      vehicle.mechanical_availability ??
      vehicle.maintenance_availability ??
      ""
    );
  };

  const formatValue = (value) => {
    if (value === "" || value === null || value === undefined) {
      return "-";
    }

    return value;
  };

  const formatNumber = (value) => {
    if (value === "" || value === null || value === undefined) {
      return "-";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return value;
    }

    return number.toLocaleString("id-ID");
  };

  const formatMechanicalAvailability = (value) => {
    if (value === "" || value === null || value === undefined) {
      return "-";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return `${value}%`;
    }

    return `${number.toFixed(2)}%`;
  };

  const getMaBadgeClass = (value) => {
    const number = Number(value);

    if (
      value === "" ||
      value === null ||
      value === undefined ||
      Number.isNaN(number)
    ) {
      return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }

    if (number >= 90) {
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    }

    if (number >= 75) {
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    }

    return "bg-red-500/10 text-red-300 border-red-500/30";
  };

  const fetchVehicles = async () => {
    try {
      setFetching(true);

      const response = await getVehicles();
      const data = Array.isArray(response) ? response : response?.data || [];

      setVehicles(data);
    } catch (error) {
      console.error("GET VEHICLES ERROR:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Data kendaraan belum dapat dimuat. Periksa koneksi atau coba beberapa saat lagi."
        )
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const resetForm = () => {
    setForm({
      equipment_name: "",
      plate_number: "",
      serial_number: "",
      brand: "",
      model: "",
      year: "",
      initial_hour_meter: "",
    });

    setEditingId(null);
    setEditingVehicle(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildPayload = () => {
    /**
     * Admin hanya mengirim HM Awal.
     * HM Terbaru tidak dikirim dari form ini karena HM Terbaru harus datang
     * otomatis dari teknisi melalui proses penyelesaian maintenance.
     */
    const initialHourMeter = form.initial_hour_meter || 0;

    return {
      equipment_name: form.equipment_name,
      plate_number: form.plate_number,
      serial_number: form.serial_number,
      brand: form.brand || null,
      model: form.model || null,
      year: form.year || null,

      /**
       * Backend VehicleController akan memetakan initial_hour_meter
       * ke kolom database lama, misalnya initial_kpi.
       */
      initial_hour_meter: initialHourMeter,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const payload = buildPayload();

      if (editingId) {
        await updateVehicle(editingId, payload);
        showNotification("success", "Data kendaraan berhasil diperbarui.");
      } else {
        await createVehicle(payload);
        showNotification("success", "Data kendaraan berhasil ditambahkan.");
      }

      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("SAVE VEHICLE ERROR:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Data kendaraan belum dapat disimpan. Periksa kembali data yang diisi."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setEditingVehicle(vehicle);

    setForm({
      equipment_name: vehicle.equipment_name || "",
      plate_number: vehicle.plate_number || "",
      serial_number: vehicle.serial_number || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      initial_hour_meter: getInitialHourMeter(vehicle),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = (vehicle) => {
    setDeleteTarget(vehicle);
  };

  const confirmDeleteVehicle = async () => {
    if (!deleteTarget?.id) {
      showNotification("warning", "Data kendaraan tidak ditemukan.");
      return;
    }

    try {
      setLoading(true);
      setNotification(null);

      await deleteVehicle(deleteTarget.id);

      showNotification("success", "Data kendaraan berhasil dihapus.");

      if (editingId === deleteTarget.id) {
        resetForm();
      }

      setDeleteTarget(null);
      fetchVehicles();
    } catch (error) {
      console.error("DELETE VEHICLE ERROR:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Data kendaraan belum dapat dihapus. Pastikan kendaraan tidak masih digunakan pada data aktif."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return vehicles;

    return vehicles.filter((vehicle) => {
      const searchableText = [
        vehicle.equipment_name,
        vehicle.plate_number,
        vehicle.serial_number,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [vehicles, search]);

  const totalVehicles = vehicles.length;

  const vehiclesWithMa = vehicles.filter((vehicle) => {
    const ma = getMechanicalAvailability(vehicle);

    return ma !== "" && ma !== null && ma !== undefined;
  }).length;

  const averageMa = useMemo(() => {
    const values = vehicles
      .map((vehicle) => Number(getMechanicalAvailability(vehicle)))
      .filter((value) => !Number.isNaN(value));

    if (values.length === 0) return "-";

    const total = values.reduce((sum, value) => sum + value, 0);

    return `${(total / values.length).toFixed(2)}%`;
  }, [vehicles]);

  const editingLatestHm = editingVehicle
    ? getCurrentHourMeter(editingVehicle)
    : "";

  const editingMa = editingVehicle
    ? getMechanicalAvailability(editingVehicle)
    : "";

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      <Sidebar />

      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Data Kendaraan"
        description={`Apakah Anda yakin ingin menghapus ${
          deleteTarget?.equipment_name || "kendaraan ini"
        }? Data tidak dapat dihapus jika masih digunakan pada assignment, laporan, booking service, atau data maintenance aktif.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={loading}
        onConfirm={confirmDeleteVehicle}
        onCancel={() => {
          if (!loading) {
            setDeleteTarget(null);
          }
        }}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%)] p-5 md:p-7">
          <div className="mx-auto max-w-[1600px]">
            <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
                  Vehicle Master Data
                </div>

                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Data Kendaraan
                </h1>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                  Kelola data master kendaraan. HM Terbaru dan Mechanical
                  Availability berasal dari hasil teknisi/backend, sehingga
                  hanya ditampilkan sebagai informasi dan tidak menjadi inputan
                  admin.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={fetchVehicles}
                  disabled={fetching || loading}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {fetching ? "Memuat..." : "Refresh Data"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </header>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
                <p className="text-sm text-slate-400">Total Kendaraan</p>
                <h3 className="mt-2 text-3xl font-bold">{totalVehicles}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Seluruh unit yang terdaftar
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
                <p className="text-sm text-slate-400">Data MA Tersedia</p>
                <h3 className="mt-2 text-3xl font-bold">{vehiclesWithMa}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Dari hasil maintenance teknisi
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
                <p className="text-sm text-slate-400">Rata-rata MA</p>
                <h3 className="mt-2 text-3xl font-bold text-orange-300">
                  {averageMa}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Hasil hitung dari backend
                </p>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-white/10 bg-[#171a23]/95 p-5 shadow-2xl shadow-black/20">
              <div className="mb-5">
                <h2 className="text-lg font-bold">
                  {editingId ? "Edit Kendaraan" : "Tambah Kendaraan"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Form ini hanya untuk data master kendaraan dan HM Awal. HM
                  Terbaru serta MA tidak diinput dari halaman admin.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Nama Unit / Equipment
                  </label>
                  <input
                    type="text"
                    name="equipment_name"
                    value={form.equipment_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Contoh: Dump Truck 01"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Nomor Plat / Lambung
                  </label>
                  <input
                    type="text"
                    name="plate_number"
                    value={form.plate_number}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Contoh: B 1234 ABC"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Nomor Serial Mesin
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    value={form.serial_number}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Contoh: SN-001-2026"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Hour Meter Awal
                  </label>
                  <input
                    type="number"
                    name="initial_hour_meter"
                    value={form.initial_hour_meter}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Contoh: 1000"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Contoh: Hino"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Contoh: Dutro"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Tahun
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    min="1980"
                    max="2100"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Contoh: 2024"
                  />
                </div>

                <div className="flex items-end gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Menyimpan..."
                      : editingId
                      ? "Update Kendaraan"
                      : "Tambah Kendaraan"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Batal
                    </button>
                  )}
                </div>

                {editingId && (
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 md:col-span-2 xl:col-span-4">
                    <p className="text-sm font-semibold text-blue-200">
                      Informasi dari Teknisi / Backend
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-xs text-slate-400">HM Terbaru</p>
                        <p className="mt-1 text-sm font-bold text-orange-300">
                          {formatNumber(editingLatestHm)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-xs text-slate-400">
                          Mechanical Availability
                        </p>
                        <p className="mt-1 text-sm font-bold text-emerald-300">
                          {formatMechanicalAvailability(editingMa)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Data ini hanya ditampilkan sebagai referensi. Admin tidak
                      mengubah HM Terbaru atau MA dari halaman ini.
                    </p>
                  </div>
                )}
              </form>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#171a23]/95 shadow-2xl shadow-black/20">
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Daftar Kendaraan</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      HM Terbaru dan MA berasal dari hasil teknisi/backend,
                      hanya untuk dilihat.
                    </p>
                  </div>

                  <div className="w-full lg:w-96">
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/10"
                      placeholder="Cari unit, plat, serial, brand..."
                    />
                  </div>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1250px] table-auto text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#0f1117]/80 text-xs uppercase tracking-wide text-slate-400">
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        Unit
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        Plat / Lambung
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        Serial Mesin
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        HM Awal
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        HM Terbaru
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        MA
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        Brand
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        Model
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left">
                        Tahun
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {fetching ? (
                      <tr>
                        <td
                          colSpan="10"
                          className="px-5 py-10 text-center text-slate-400"
                        >
                          Memuat data kendaraan...
                        </td>
                      </tr>
                    ) : filteredVehicles.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-5 py-10 text-center">
                          <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                            <p className="font-semibold text-slate-200">
                              Data kendaraan tidak ditemukan
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Tambahkan kendaraan baru atau ubah kata kunci
                              pencarian.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredVehicles.map((vehicle) => {
                        const ma = getMechanicalAvailability(vehicle);
                        const initialHourMeter = getInitialHourMeter(vehicle);
                        const currentHourMeter = getCurrentHourMeter(vehicle);

                        return (
                          <tr
                            key={vehicle.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.04]"
                          >
                            <td className="px-5 py-4">
                              <div className="min-w-[180px]">
                                <p className="font-semibold text-slate-100">
                                  {vehicle.equipment_name || "-"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Master kendaraan
                                </p>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200">
                                {vehicle.plate_number || "-"}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                              {vehicle.serial_number || "-"}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                              {formatNumber(initialHourMeter)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="font-bold text-orange-300">
                                {formatNumber(currentHourMeter)}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getMaBadgeClass(
                                  ma
                                )}`}
                              >
                                {formatMechanicalAvailability(ma)}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                              {formatValue(vehicle.brand)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                              {formatValue(vehicle.model)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                              {formatValue(vehicle.year)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(vehicle)}
                                  disabled={loading}
                                  className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(vehicle)}
                                  disabled={loading}
                                  className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                <p>
                  Menampilkan {filteredVehicles.length} dari {vehicles.length}{" "}
                  kendaraan.
                </p>

                <p>
                  Geser tabel ke samping jika kolom tidak muat di layar kecil.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 