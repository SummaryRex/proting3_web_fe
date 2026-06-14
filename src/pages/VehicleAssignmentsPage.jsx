import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Gauge,
  Link2,
  RefreshCcw,
  Search,
  Target,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import Sidebar from "../components/Sidebar";

import {
  getAssignments,
  createAssignment,
  deleteAssignment,
} from "../services/vehicleAssignment";

import { getVehicles } from "../services/vehicle";
import { getDrivers } from "../services/userService";

/**
 * ===============================
 * ERROR HANDLER
 * ===============================
 */

function sanitizeErrorText(value) {
  if (!value) return "";

  let text = "";

  if (typeof value === "string") {
    text = value;
  } else if (Array.isArray(value)) {
    text = value.join(" ");
  } else if (typeof value === "object") {
    text = Object.values(value).flat().filter(Boolean).join(" ");
  }

  text = String(text).trim();

  const containsTechnicalText =
    text.includes("localhost") ||
    text.includes("127.0.0.1") ||
    text.includes("http://") ||
    text.includes("https://") ||
    text.includes("AxiosError") ||
    text.includes("Network Error") ||
    text.includes("Request failed") ||
    text.includes("ERR_CONNECTION") ||
    text.includes("ECONNREFUSED");

  if (containsTechnicalText) return "";

  return text;
}

function getFriendlyErrorMessage(error, fallback) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  const validationMessage = sanitizeErrorText(data?.errors);
  const backendMessage = sanitizeErrorText(data?.message);
  const directMessage = sanitizeErrorText(error?.message);

  if (!error?.response) {
    return "Koneksi ke server belum berhasil. Pastikan backend berjalan dan konfigurasi API sudah benar.";
  }

  if (status === 400) {
    return (
      backendMessage ||
      "Data penempatan kendaraan belum sesuai. Periksa kembali kendaraan dan driver yang dipilih."
    );
  }

  if (status === 401) {
    return "Sesi login sudah berakhir. Silakan login ulang.";
  }

  if (status === 403) {
    return "Akun ini tidak memiliki akses untuk mengelola penempatan kendaraan.";
  }

  if (status === 404) {
    return "Data penempatan kendaraan belum dapat diakses. Periksa kembali route API di backend.";
  }

  if (status === 422) {
    return (
      validationMessage ||
      backendMessage ||
      "Validasi gagal. Pastikan kendaraan dan driver yang dipilih masih tersedia."
    );
  }

  if (status >= 500) {
    return "Terjadi kendala pada server. Silakan cek backend atau database penempatan kendaraan.";
  }

  return backendMessage || directMessage || fallback;
}

/**
 * ===============================
 * NORMALIZER / HELPER
 * ===============================
 */

function normalizeList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getUserRole(user) {
  const role =
    user?.role?.name ||
    user?.role_name ||
    user?.role ||
    user?.type ||
    "";

  return String(role).toLowerCase();
}

function isDriverUser(user) {
  const role = getUserRole(user);

  /**
   * Jika endpoint getDrivers() memang sudah khusus driver,
   * kadang backend tidak mengirim role.
   * Jadi role kosong tetap dianggap valid sebagai driver.
   */
  if (!role) return true;

  return role === "driver";
}

function getVehicleSerial(vehicle) {
  return (
    vehicle?.serial_number ||
    vehicle?.engine_serial_number ||
    vehicle?.machine_serial_number ||
    "-"
  );
}

function getVehicleHourMeter(vehicle) {
  return (
    vehicle?.initial_hour_meter ??
    vehicle?.initial_kpi ??
    vehicle?.hour_meter_awal ??
    vehicle?.kpi_awal ??
    ""
  );
}

function getVehicleTargetAvailability(vehicle) {
  return vehicle?.target_availability ?? vehicle?.target_ma ?? 90;
}

function getVehicleStatus(vehicle) {
  return String(vehicle?.status || vehicle?.unit_status || "active").toLowerCase();
}

function getVehicleLabel(vehicle) {
  const name = vehicle?.equipment_name || "Unit tanpa nama";
  const plate = vehicle?.plate_number || "Nomor lambung belum ada";
  const serial = getVehicleSerial(vehicle);

  return `${name} | Lambung/Plat: ${plate} | Serial: ${serial}`;
}

function getDriverLabel(driver) {
  const name = driver?.name || "Driver tanpa nama";
  const username = driver?.username || driver?.email || "Identitas belum ada";

  return `${name} | ${username}`;
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return number.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatPercentage(value) {
  if (value === "" || value === null || value === undefined) {
    return "-";
  }

  return `${formatNumber(value)}%`;
}

/**
 * ===============================
 * SMALL COMPONENTS
 * ===============================
 */

function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const isSuccess = notification.type === "success";
  const isWarning = notification.type === "warning";

  const colorClass = isSuccess
    ? "border-green-500/40 bg-green-500/10 text-green-400"
    : isWarning
    ? "border-djati-amber/40 bg-djati-amber/10 text-djati-amber"
    : "border-red-500/40 bg-red-500/10 text-red-400";

  const title = isSuccess
    ? "Berhasil"
    : isWarning
    ? "Perhatian"
    : "Terjadi Kendala";

  return (
    <div className="fixed right-5 top-5 z-[9999] w-[360px] max-w-[calc(100vw-2rem)]">
      <div
        className={`rounded-2xl border bg-[#171a23] px-4 py-3 shadow-2xl backdrop-blur ${colorClass}`}
      >
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold">{title}</h4>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
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
        <h3 className="text-lg font-bold text-djati-amber">{title}</h3>

        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Truck size={22} className="text-white/35" />
      </div>

      <p className="font-semibold text-white/70">
        Belum ada kendaraan yang ditempatkan
      </p>

      <p className="mt-1 text-xs text-white/35">
        Pilih unit kendaraan dan driver untuk membuat penempatan baru.
      </p>
    </div>
  );
}

function VehicleStatusBadge({ status }) {
  const statusValue = status || "active";

  const config = {
    active: {
      label: "Aktif",
      className: "bg-green-500/10 text-green-400 border-green-500/30",
    },
    maintenance: {
      label: "Maintenance",
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    },
    inactive: {
      label: "Tidak Aktif",
      className: "bg-red-500/10 text-red-400 border-red-500/30",
    },
  };

  const selected = config[statusValue] || {
    label: "-",
    className: "bg-white/5 text-white/50 border-white/10",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${selected.className}`}
    >
      {selected.label}
    </span>
  );
}

function ActivityStatusBadge({ locked }) {
  if (locked) {
    return (
      <span className="inline-flex items-center rounded-full border border-yellow-500/25 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-400">
        Aktivitas berjalan
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-green-500/25 bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400">
      Bisa dilepas
    </span>
  );
}

export default function VehicleAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [notification, setNotification] = useState(null);
  const [unassignTarget, setUnassignTarget] = useState(null);
  const [search, setSearch] = useState("");

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

  const fetchData = async () => {
    setFetchLoading(true);

    try {
      const [assignmentResponse, vehicleResponse, driverResponse] =
        await Promise.all([getAssignments(), getVehicles(), getDrivers()]);

      const assignmentList = normalizeList(assignmentResponse);
      const vehicleList = normalizeList(vehicleResponse);
      const driverList = normalizeList(driverResponse);

      const normalizedDrivers = driverList.filter((user) => isDriverUser(user));

      setAssignments(assignmentList);
      setVehicles(vehicleList);
      setDrivers(normalizedDrivers);
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(
        error,
        "Gagal mengambil data penempatan kendaraan."
      );

      console.warn("FETCH VEHICLE ASSIGNMENT DATA ERROR:", {
        status: error?.response?.status || "NO_RESPONSE",
        message: friendlyMessage,
      });

      showNotification("error", friendlyMessage);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      return !assignment.unassigned_at && !assignment.deleted_at;
    });
  }, [assignments]);

  const assignedVehicleIds = useMemo(() => {
    return activeAssignments
      .map((assignment) => assignment.vehicle_id || assignment.vehicle?.id)
      .filter(Boolean)
      .map(String);
  }, [activeAssignments]);

  const assignedDriverIds = useMemo(() => {
    return activeAssignments
      .map((assignment) => assignment.driver_id || assignment.driver?.id)
      .filter(Boolean)
      .map(String);
  }, [activeAssignments]);

  const availableVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const vehicleIsAssigned = assignedVehicleIds.includes(String(vehicle.id));
      const status = getVehicleStatus(vehicle);

      /**
       * Kendaraan inactive tidak ditampilkan.
       * Maintenance tetap boleh ditampilkan selama belum assigned.
       */
      const vehicleIsUsable = status !== "inactive";

      return !vehicleIsAssigned && vehicleIsUsable;
    });
  }, [vehicles, assignedVehicleIds]);

  const availableDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      return !assignedDriverIds.includes(String(driver.id));
    });
  }, [drivers, assignedDriverIds]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((vehicle) => String(vehicle.id) === String(vehicleId));
  }, [vehicles, vehicleId]);

  const selectedDriver = useMemo(() => {
    return drivers.find((driver) => String(driver.id) === String(driverId));
  }, [drivers, driverId]);

  const filteredAssignments = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return activeAssignments;

    return activeAssignments.filter((assignment) => {
      const vehicle = assignment.vehicle;
      const driver = assignment.driver;

      const searchableText = [
        vehicle?.equipment_name,
        vehicle?.plate_number,
        getVehicleSerial(vehicle),
        driver?.name,
        driver?.username,
        driver?.email,
        formatDateTime(assignment.assigned_at),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [activeAssignments, search]);

  const lockedAssignments = useMemo(() => {
    return activeAssignments.filter((assignment) => {
      return assignment.has_running_activity;
    }).length;
  }, [activeAssignments]);

  const handleAssign = async (event) => {
    event.preventDefault();

    if (!vehicleId || !driverId) {
      showNotification("warning", "Pilih unit kendaraan dan driver terlebih dahulu.");
      return;
    }

    setLoading(true);
    setNotification(null);

    try {
      await createAssignment({
        vehicle_id: Number(vehicleId),
        driver_id: Number(driverId),
      });

      setVehicleId("");
      setDriverId("");

      showNotification("success", "Kendaraan berhasil ditempatkan ke driver.");
      await fetchData();
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(
        error,
        "Gagal menempatkan kendaraan ke driver."
      );

      console.warn("CREATE VEHICLE ASSIGNMENT ERROR:", {
        status: error?.response?.status || "NO_RESPONSE",
        message: friendlyMessage,
      });

      showNotification("error", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = (assignment) => {
    if (assignment.has_running_activity) {
      showNotification(
        "warning",
        "Kendaraan tidak dapat dilepas dari driver karena masih memiliki report atau maintenance yang sedang berjalan."
      );
      return;
    }

    setUnassignTarget(assignment);
  };

  const confirmUnassign = async () => {
    if (!unassignTarget?.id) {
      showNotification("warning", "Data penempatan kendaraan tidak ditemukan.");
      return;
    }

    try {
      setDeletingId(unassignTarget.id);
      setNotification(null);

      await deleteAssignment(unassignTarget.id);

      setUnassignTarget(null);
      showNotification(
        "success",
        "Penempatan kendaraan berhasil dilepas dari driver."
      );

      await fetchData();
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(
        error,
        "Gagal melepas penempatan kendaraan."
      );

      console.warn("DELETE VEHICLE ASSIGNMENT ERROR:", {
        status: error?.response?.status || "NO_RESPONSE",
        message: friendlyMessage,
      });

      showNotification("error", friendlyMessage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      <Sidebar />

      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <ConfirmDialog
        open={Boolean(unassignTarget)}
        title="Lepas Penempatan Kendaraan"
        description={`Apakah Anda yakin ingin melepas penempatan ${
          unassignTarget?.vehicle?.equipment_name || "kendaraan ini"
        } (${unassignTarget?.vehicle?.plate_number || "-"}) dari ${
          unassignTarget?.driver?.name || "driver"
        }?`}
        confirmText="Ya, Lepas"
        cancelText="Batal"
        loading={Boolean(deletingId)}
        onConfirm={confirmUnassign}
        onCancel={() => {
          if (!deletingId) {
            setUnassignTarget(null);
          }
        }}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%)] p-5 md:p-7">
          <div className="mx-auto max-w-[1600px]">
            <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-djati-amber/20 bg-djati-amber/10 px-3 py-1 text-xs font-bold text-djati-amber">
                  Vehicle Assignment
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Penempatan Kendaraan ke Driver
                </h1>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">
                  Kelola hubungan antara unit kendaraan/equipment dengan driver.
                  Setiap kendaraan hanya dapat ditempatkan ke satu driver aktif,
                  dan setiap driver hanya dapat memiliki satu kendaraan aktif.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchData}
                disabled={fetchLoading || loading}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw
                  size={16}
                  className={fetchLoading ? "animate-spin" : ""}
                />
                {fetchLoading ? "Memuat..." : "Refresh Data"}
              </button>
            </header>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
                <p className="text-sm text-white/45">Penempatan Aktif</p>
                <h3 className="mt-2 text-3xl font-bold text-white">
                  {activeAssignments.length}
                </h3>
                <p className="mt-1 text-xs text-white/30">
                  Kendaraan sedang terhubung ke driver
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
                <p className="text-sm text-white/45">Kendaraan Tersedia</p>
                <h3 className="mt-2 text-3xl font-bold text-djati-amber">
                  {availableVehicles.length}
                </h3>
                <p className="mt-1 text-xs text-white/30">
                  Belum ditempatkan dan tidak inactive
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
                <p className="text-sm text-white/45">Driver Tersedia</p>
                <h3 className="mt-2 text-3xl font-bold text-blue-300">
                  {availableDrivers.length}
                </h3>
                <p className="mt-1 text-xs text-white/30">
                  Driver yang belum memiliki kendaraan
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
                <p className="text-sm text-white/45">Assignment Terkunci</p>
                <h3 className="mt-2 text-3xl font-bold text-yellow-300">
                  {lockedAssignments}
                </h3>
                <p className="mt-1 text-xs text-white/30">
                  Tidak bisa dilepas saat aktivitas berjalan
                </p>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-white/10 bg-[#171a23]/95 p-5 shadow-2xl shadow-black/20">
              <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-djati-amber">
                    Form Penempatan Kendaraan
                  </h2>

                  <p className="mt-1 max-w-3xl text-xs leading-5 text-white/40">
                    Pilih kendaraan berdasarkan nama unit, nomor plat/lambung,
                    nomor serial mesin, dan hour meter awal agar tidak tertukar
                    dengan unit lain.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAssign}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
                      Unit Kendaraan / Equipment Tersedia
                    </label>

                    <div className="relative">
                      <Truck
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                      />

                      <select
                        value={vehicleId}
                        onChange={(event) => setVehicleId(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#0f1117] py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
                        required
                      >
                        <option value="">
                          Pilih unit kendaraan / equipment
                        </option>

                        {availableVehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {getVehicleLabel(vehicle)}
                          </option>
                        ))}

                        {availableVehicles.length === 0 && (
                          <option value="" disabled>
                            Semua kendaraan sudah ditempatkan atau tidak aktif
                          </option>
                        )}
                      </select>
                    </div>

                    <p className="mt-2 text-xs text-white/35">
                      Kendaraan yang sudah ditempatkan tidak ditampilkan lagi.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
                      Driver Tersedia
                    </label>

                    <div className="relative">
                      <UserRound
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                      />

                      <select
                        value={driverId}
                        onChange={(event) => setDriverId(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#0f1117] py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
                        required
                      >
                        <option value="">Pilih driver</option>

                        {availableDrivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {getDriverLabel(driver)}
                          </option>
                        ))}

                        {availableDrivers.length === 0 && (
                          <option value="" disabled>
                            Semua driver sudah memiliki kendaraan
                          </option>
                        )}
                      </select>
                    </div>

                    <p className="mt-2 text-xs text-white/35">
                      Driver yang sudah memiliki kendaraan tidak ditampilkan
                      lagi.
                    </p>
                  </div>
                </div>

                {(selectedVehicle || selectedDriver) && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-white/45">
                      Ringkasan Penempatan
                    </p>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="rounded-xl bg-black/20 p-4">
                        <p className="mb-1 text-xs text-white/35">
                          Kendaraan yang dipilih
                        </p>

                        <p className="font-semibold text-white">
                          {selectedVehicle
                            ? getVehicleLabel(selectedVehicle)
                            : "Belum memilih kendaraan"}
                        </p>

                        {selectedVehicle && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-djati-amber/20 bg-djati-amber/10 px-2.5 py-1 text-xs font-bold text-djati-amber">
                              <Gauge size={13} />
                              HM Awal:{" "}
                              {formatNumber(
                                getVehicleHourMeter(selectedVehicle)
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-white/60">
                              <Target size={13} />
                              Target MA:{" "}
                              {formatPercentage(
                                getVehicleTargetAvailability(selectedVehicle)
                              )}
                            </span>

                            <VehicleStatusBadge
                              status={getVehicleStatus(selectedVehicle)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl bg-black/20 p-4">
                        <p className="mb-1 text-xs text-white/35">
                          Driver yang dipilih
                        </p>

                        <p className="font-semibold text-white">
                          {selectedDriver
                            ? getDriverLabel(selectedDriver)
                            : "Belum memilih driver"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-white/35">
                    Pastikan nomor lambung/plat dan serial mesin sudah sesuai
                    sebelum menyimpan penempatan.
                  </p>

                  <button
                    type="submit"
                    disabled={loading || fetchLoading}
                    className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-djati-amber px-5 py-3 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Link2 size={17} />
                    {loading ? "Menyimpan..." : "Simpan Penempatan"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#171a23]/95 shadow-2xl shadow-black/20">
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-djati-amber">
                      Daftar Penempatan Aktif
                    </h2>

                    <p className="mt-1 text-xs text-white/40">
                      Total {activeAssignments.length} kendaraan sedang
                      ditempatkan ke driver.
                    </p>
                  </div>

                  <div className="relative w-full lg:w-96">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0f1117] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
                      placeholder="Cari unit, plat, serial, driver..."
                    />
                  </div>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1280px] table-auto text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-djati-amber text-xs uppercase tracking-wide text-black">
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Unit / Equipment
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Plat / Lambung
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Serial Mesin
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        HM Awal
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Target MA
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Driver
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Waktu Penempatan
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Status Unit
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Status Aktivitas
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-right font-bold">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {fetchLoading ? (
                      <tr>
                        <td
                          colSpan="10"
                          className="px-5 py-10 text-center text-white/50"
                        >
                          Memuat data penempatan kendaraan...
                        </td>
                      </tr>
                    ) : filteredAssignments.length > 0 ? (
                      filteredAssignments.map((assignment) => {
                        const vehicle = assignment.vehicle;
                        const driver = assignment.driver;
                        const isLocked = assignment.has_running_activity;
                        const isDeleting = deletingId === assignment.id;

                        return (
                          <tr
                            key={assignment.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.04]"
                          >
                            <td className="px-5 py-4">
                              <div className="min-w-[180px]">
                                <div className="font-bold text-white">
                                  {vehicle?.equipment_name || "-"}
                                </div>

                                <div className="mt-1 text-xs text-white/35">
                                  Unit kendaraan / equipment
                                </div>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80">
                                {vehicle?.plate_number || "-"}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-white/70">
                              {getVehicleSerial(vehicle)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="inline-flex items-center rounded-full border border-djati-amber/20 bg-djati-amber/10 px-2.5 py-1 text-xs font-bold text-djati-amber">
                                {formatNumber(getVehicleHourMeter(vehicle))}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-white/75">
                              {formatPercentage(
                                getVehicleTargetAvailability(vehicle)
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="min-w-[180px]">
                                <div className="font-semibold text-white">
                                  {driver?.name || "-"}
                                </div>

                                <div className="mt-1 text-xs text-white/35">
                                  {driver?.username ||
                                    driver?.email ||
                                    "Identitas driver tidak tersedia"}
                                </div>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-white/70">
                              {formatDateTime(assignment.assigned_at)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <VehicleStatusBadge
                                status={getVehicleStatus(vehicle)}
                              />
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <ActivityStatusBadge locked={isLocked} />
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleUnassign(assignment)}
                                disabled={isLocked || isDeleting}
                                title={
                                  isLocked
                                    ? "Tidak bisa dilepas karena masih ada report atau maintenance berjalan"
                                    : "Lepas kendaraan dari driver"
                                }
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                  isLocked
                                    ? "border-white/10 bg-white/5 text-white/40"
                                    : "border-red-500/40 text-red-400 hover:bg-red-500/10"
                                }`}
                              >
                                <XCircle size={14} />

                                {isDeleting
                                  ? "Melepas..."
                                  : isLocked
                                  ? "Terkunci"
                                  : "Lepas"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10">
                          <EmptyState />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
                <p>
                  Menampilkan {filteredAssignments.length} dari{" "}
                  {activeAssignments.length} penempatan aktif.
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