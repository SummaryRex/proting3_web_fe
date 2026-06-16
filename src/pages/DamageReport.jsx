import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import StatusBadge from "../components/ui/StatusBadge";
import DamageDetailModal from "../components/modals/DamageDetailModal";

import {
  getReports,
  getReportById,
  approveFollowUp,
} from "../services/reportService";

const tableColumns = [
  { label: "ID LAPORAN" },
  { label: "FOTO" },
  { label: "KENDARAAN / UNIT" },
  { label: "NAMA PENGEMUDI" },
  { label: "TANGGAL LAPORAN" },
  { label: "STATUS" },
  { label: "KPI" },
  { label: "AKSI" },
];

const statusFilters = [
  "Semua",
  "Dilaporkan",
  "Dalam Proses",
  "Selesai",
  "Ditolak",
  "Dibatalkan",
];

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const API_STORAGE_URL = String(
  import.meta.env.VITE_STORAGE_URL ||
    import.meta.env.VITE_API_STORAGE_URL ||
    (API_BASE_URL ? `${API_BASE_URL}/storage` : "/storage")
).replace(/\/$/, "");

function isEmptyValue(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "-" ||
    String(value).trim().toLowerCase() === "null" ||
    String(value).trim().toLowerCase() === "undefined"
  );
}

function firstValid(...values) {
  return values.find((value) => !isEmptyValue(value)) ?? null;
}

function firstValidArray(...arrays) {
  return arrays.find((item) => Array.isArray(item) && item.length > 0) || [];
}

function normalizeStatusValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");
}

function collectStatusValues(report) {
  return [
    report?.displayStatus,
    report?.display_status,
    report?.computedStatus,
    report?.computed_status,
    report?.damageReportStatus,
    report?.damage_report_status,
    report?.status,
    report?.rawStatus,
    report?.bookingStatus,
    report?.rawBookingStatus,

    report?.booking?.status,
    report?.serviceBooking?.status,
    report?.latestServiceBooking?.status,

    report?.raw?.display_status,
    report?.raw?.displayStatus,
    report?.raw?.computed_status,
    report?.raw?.computedStatus,
    report?.raw?.damage_report_status,
    report?.raw?.damageReportStatus,
    report?.raw?.status,

    report?.raw?.booking_status,
    report?.raw?.bookingStatus,
    report?.raw?.service_booking_status,
    report?.raw?.serviceBookingStatus,

    report?.raw?.latest_service_booking?.status,
    report?.raw?.latestServiceBooking?.status,
    report?.raw?.service_booking?.status,
    report?.raw?.serviceBooking?.status,
    report?.raw?.booking?.status,

    report?.raw?.latest_technician_response?.status,
    report?.raw?.latestTechnicianResponse?.status,
  ].map(normalizeStatusValue);
}

function collectBookingStatusValues(report) {
  return [
    report?.bookingStatus,
    report?.booking_status,
    report?.serviceBookingStatus,
    report?.service_booking_status,
    report?.rawBookingStatus,

    report?.booking?.status,
    report?.serviceBooking?.status,
    report?.latestServiceBooking?.status,

    report?.raw?.booking_status,
    report?.raw?.bookingStatus,
    report?.raw?.service_booking_status,
    report?.raw?.serviceBookingStatus,
    report?.raw?.latest_service_booking?.status,
    report?.raw?.latestServiceBooking?.status,
    report?.raw?.service_booking?.status,
    report?.raw?.serviceBooking?.status,
    report?.raw?.booking?.status,
  ].map(normalizeStatusValue);
}

function collectTechnicianStatusValues(report) {
  return [
    report?.latestTechnicianResponse?.status,
    report?.latest_technician_response?.status,
    report?.technicianResponse?.status,
    report?.technician_response?.status,

    report?.raw?.latest_technician_response?.status,
    report?.raw?.latestTechnicianResponse?.status,
    report?.raw?.technician_response?.status,
    report?.raw?.technicianResponse?.status,
  ].map(normalizeStatusValue);
}

function hasStartedTimestamp(report) {
  return !isEmptyValue(
    firstValid(
      report?.startedAt,
      report?.started_at,
      report?.serviceStartedAt,
      report?.service_started_at,
      report?.repairStartedAt,
      report?.repair_started_at,

      report?.booking?.started_at,
      report?.serviceBooking?.started_at,
      report?.latestServiceBooking?.started_at,

      report?.raw?.started_at,
      report?.raw?.service_started_at,
      report?.raw?.repair_started_at,
      report?.raw?.latest_service_booking?.started_at,
      report?.raw?.latestServiceBooking?.started_at,
      report?.raw?.service_booking?.started_at,
      report?.raw?.serviceBooking?.started_at,
      report?.raw?.booking?.started_at
    )
  );
}

function isBookingApprovedOrScheduled(report) {
  const bookingValues = collectBookingStatusValues(report);

  return bookingValues.some((value) =>
    ["approved", "scheduled", "rescheduled"].includes(value)
  );
}

function hasRealTechnicianStartSignal(report) {
  const bookingValues = collectBookingStatusValues(report);
  const technicianValues = collectTechnicianStatusValues(report);

  const progressValues = [
    "proses",
    "diproses",
    "dalam_proses",
    "sedang_diproses",
    "ongoing",
    "in_progress",
    "progress",
    "started",
    "start_job",
    "job_started",
    "repair_started",
    "repair_in_progress",
    "technician_started",
    "working",
    "on_progress",
  ];

  return (
    bookingValues.some((value) => progressValues.includes(value)) ||
    technicianValues.some((value) => progressValues.includes(value)) ||
    hasStartedTimestamp(report)
  );
}

function isApprovedBookingWithoutTechnicianStart(report) {
  return (
    isBookingApprovedOrScheduled(report) &&
    !hasRealTechnicianStartSignal(report) &&
    !isWaitingPartsReport(report) &&
    !isCompletedReport(report) &&
    !isCanceledOrRejected(report) &&
    !isFatalReport(report)
  );
}

function isCompletedReport(report) {
  const values = collectStatusValues(report);

  return values.some((value) =>
    [
      "selesai",
      "finished",
      "completed",
      "complete",
      "done",
      "selesai_diperbaiki",
    ].includes(value)
  );
}

function isWaitingPartsReport(report) {
  const values = collectStatusValues(report);

  return values.some((value) =>
    [
      "waiting_parts",
      "waiting_part",
      "on_hold",
      "butuh_followup_admin",
      "butuh_followup",
      "menunggu_sparepart",
      "menunggu_spareparts",
      "menunggu_part",
      "menunggu_parts",
      "waiting_sparepart",
      "waiting_spareparts",
      "sparepart_pending",
      "parts_pending",
    ].includes(value)
  );
}

function isStartedOrInProgressReport(report) {
  if (isApprovedBookingWithoutTechnicianStart(report)) {
    return false;
  }

  const values = collectStatusValues(report);

  return values.some((value) =>
    [
      "proses",
      "diproses",
      "dalam_proses",
      "sedang_diproses",
      "ongoing",
      "in_progress",
      "progress",
      "started",
      "start_job",
      "job_started",
      "repair_started",
      "repair_in_progress",
      "technician_started",
      "working",
      "on_progress",
    ].includes(value)
  );
}

function isRejectedReport(report) {
  const values = collectStatusValues(report);

  return values.some((value) =>
    ["reject", "rejected", "ditolak"].includes(value)
  );
}

function isCanceledReport(report) {
  const values = collectStatusValues(report);

  return values.some((value) =>
    ["cancel", "canceled", "cancelled", "dibatalkan"].includes(value)
  );
}

function isCanceledOrRejected(report) {
  return isRejectedReport(report) || isCanceledReport(report);
}

function isFatalReport(report) {
  const values = collectStatusValues(report);

  return values.some((value) => value === "fatal");
}

function isReportedReport(report) {
  if (isApprovedBookingWithoutTechnicianStart(report)) {
    return true;
  }

  const values = collectStatusValues(report);

  return values.some((value) =>
    [
      "reported",
      "dilaporkan",
      "laporan_baru",
      "new",
      "menunggu",
      "waiting",
      "requested",
      "pending",
    ].includes(value)
  );
}

function matchesStatusFilter(report, filter) {
  if (filter === "Semua") return true;

  if (filter === "Dilaporkan") {
    return (
      isReportedReport(report) &&
      !isStartedOrInProgressReport(report) &&
      !isWaitingPartsReport(report) &&
      !isCompletedReport(report) &&
      !isCanceledOrRejected(report) &&
      !isFatalReport(report)
    );
  }

  if (filter === "Dalam Proses") {
    return (
      isStartedOrInProgressReport(report) &&
      !isWaitingPartsReport(report) &&
      !isCompletedReport(report) &&
      !isCanceledOrRejected(report) &&
      !isFatalReport(report)
    );
  }

  if (filter === "Selesai") {
    return isCompletedReport(report);
  }

  if (filter === "Ditolak") {
    return isRejectedReport(report);
  }

  if (filter === "Dibatalkan") {
    return isCanceledReport(report);
  }

  return true;
}

function formatDate(value) {
  if (!value || value === "-") return "-";

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return value;
  }
}

function getImagePath(report) {
  return (
    report?.image ||
    report?.imageUrl ||
    report?.damageImage ||
    report?.damage_image ||
    report?.photo ||
    report?.raw?.image_url ||
    report?.raw?.imageUrl ||
    report?.raw?.damage_image_url ||
    report?.raw?.damageImageUrl ||
    report?.raw?.photo_url ||
    report?.raw?.photoUrl ||
    report?.raw?.image ||
    report?.raw?.damage_image ||
    report?.raw?.damageImage ||
    report?.raw?.photo ||
    report?.raw?.image_path ||
    report?.raw?.imagePath ||
    null
  );
}

function getImageUrl(path) {
  if (!path || path === "null" || path === "-") {
    return null;
  }

  const stringPath = String(path);

  if (stringPath.startsWith("http")) {
    return stringPath;
  }

  let cleanPath = stringPath.replace(/^\/+/, "");

  if (cleanPath.startsWith("storage/")) {
    cleanPath = cleanPath.replace(/^storage\//, "");
  }

  return `${API_STORAGE_URL}/${cleanPath}`;
}

function getKpiValueFromReport(report, key) {
  const upperKey = String(key || "").toUpperCase();

  return (
    report?.[key] ??
    report?.[upperKey] ??
    report?.booking?.[key] ??
    report?.booking?.[upperKey] ??
    report?.serviceBooking?.[key] ??
    report?.serviceBooking?.[upperKey] ??
    report?.latestServiceBooking?.[key] ??
    report?.latestServiceBooking?.[upperKey] ??
    report?.raw?.[key] ??
    report?.raw?.[upperKey] ??
    report?.raw?.kpi?.[key] ??
    report?.raw?.kpi?.[upperKey] ??
    report?.raw?.performance?.[key] ??
    report?.raw?.performance?.[upperKey] ??
    report?.raw?.latest_service_booking?.[key] ??
    report?.raw?.latest_service_booking?.[upperKey] ??
    report?.raw?.latestServiceBooking?.[key] ??
    report?.raw?.latestServiceBooking?.[upperKey] ??
    report?.raw?.service_booking?.[key] ??
    report?.raw?.service_booking?.[upperKey] ??
    report?.raw?.serviceBooking?.[key] ??
    report?.raw?.serviceBooking?.[upperKey] ??
    report?.raw?.booking?.[key] ??
    report?.raw?.booking?.[upperKey] ??
    report?.raw?.latest_technician_response?.[key] ??
    report?.raw?.latest_technician_response?.[upperKey] ??
    report?.raw?.latestTechnicianResponse?.[key] ??
    report?.raw?.latestTechnicianResponse?.[upperKey] ??
    null
  );
}

function hasKpi(report) {
  return ["mttr", "mtbf", "ma"].some((key) => {
    const value = getKpiValueFromReport(report, key);
    return !isEmptyValue(value);
  });
}

function formatKpiValue(value, suffix = "") {
  if (isEmptyValue(value)) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `${value}${suffix}`;
  }

  return `${number.toFixed(2)}${suffix}`;
}

function getSparePartsForMerge(report) {
  return firstValidArray(
    report?.spareParts,
    report?.requestedSpareParts,
    report?.partUsages,
    report?.part_usages,
    report?.sparePartUsages,
    report?.spare_part_usages,
    report?.usedParts,
    report?.used_parts,
    report?.partsUsed,
    report?.parts_used,

    report?.raw?.spare_parts,
    report?.raw?.requested_spare_parts,
    report?.raw?.part_usages,
    report?.raw?.spare_part_usages,
    report?.raw?.used_parts,
    report?.raw?.parts_used,
    report?.raw?.parts,

    report?.raw?.repair?.part_usages,
    report?.raw?.repair?.used_parts,

    report?.raw?.latest_technician_response?.part_usages,
    report?.raw?.technician_response?.part_usages,

    report?.raw?.latest_service_booking?.part_usages,
    report?.raw?.service_booking?.part_usages,
    report?.raw?.booking?.part_usages
  );
}

function mergeReportForModal(listReport, detailReport) {
  const mttr = firstValid(
    getKpiValueFromReport(detailReport, "mttr"),
    getKpiValueFromReport(listReport, "mttr")
  );

  const mtbf = firstValid(
    getKpiValueFromReport(detailReport, "mtbf"),
    getKpiValueFromReport(listReport, "mtbf")
  );

  const ma = firstValid(
    getKpiValueFromReport(detailReport, "ma"),
    getKpiValueFromReport(listReport, "ma")
  );

  const image = firstValid(getImagePath(detailReport), getImagePath(listReport));

  const spareParts = firstValidArray(
    getSparePartsForMerge(detailReport),
    getSparePartsForMerge(listReport)
  );

  const mergedReport = {
    ...listReport,
    ...detailReport,

    id: firstValid(detailReport?.id, listReport?.id),
    damageReportId: firstValid(
      detailReport?.damageReportId,
      listReport?.damageReportId,
      detailReport?.id,
      listReport?.id
    ),

    equipmentName: firstValid(
      detailReport?.equipmentName,
      listReport?.equipmentName,
      detailReport?.equipName,
      listReport?.equipName,
      detailReport?.equip,
      listReport?.equip
    ),

    plateNumber: firstValid(detailReport?.plateNumber, listReport?.plateNumber),

    driverName: firstValid(
      detailReport?.driverName,
      listReport?.driverName,
      detailReport?.operator,
      listReport?.operator
    ),

    submitDate: firstValid(
      detailReport?.submitDate,
      detailReport?.createdAt,
      detailReport?.created_at,
      detailReport?.date,
      detailReport?.raw?.created_at,
      listReport?.submitDate,
      listReport?.createdAt,
      listReport?.created_at,
      listReport?.date,
      listReport?.raw?.created_at
    ),

    severity: firstValid(detailReport?.severity, listReport?.severity),

    technicianName: firstValid(
      detailReport?.technicianName,
      listReport?.technicianName
    ),

    technicianNote: firstValid(
      detailReport?.technicianNote,
      listReport?.technicianNote
    ),

    image,
    damage_image: image,
    imageUrl: getImageUrl(image),

    mttr,
    mtbf,
    ma,

    spareParts,
    partUsages: spareParts,
    part_usages: spareParts,

    raw: {
      ...(listReport?.raw || {}),
      ...(detailReport?.raw || {}),
      mttr,
      mtbf,
      ma,
      spare_parts: spareParts,
      part_usages: spareParts,
    },
  };

  const displayStatus = getDisplayStatus(mergedReport);

  return {
    ...mergedReport,
    status: displayStatus,
    displayStatus,
    display_status: displayStatus,
    computedStatus: displayStatus,
    computed_status: displayStatus,
  };
}

function getDisplayStatus(report) {
  if (isFatalReport(report)) return "Fatal";
  if (isRejectedReport(report)) return "Ditolak";
  if (isCanceledReport(report)) return "Dibatalkan";
  if (isCompletedReport(report)) return "Selesai";
  if (isWaitingPartsReport(report)) return "Menunggu Sparepart";
  if (isStartedOrInProgressReport(report)) return "Dalam Proses";
  if (isReportedReport(report)) return "Dilaporkan";

  return firstValid(report?.status, report?.raw?.status, "-");
}

function getStatusBadgeVariant(report) {
  if (isFatalReport(report)) return "fatal";
  if (isRejectedReport(report)) return "rejected";
  if (isCanceledReport(report)) return "canceled";
  if (isCompletedReport(report)) return "selesai";
  if (isWaitingPartsReport(report)) return "butuh_followup_admin";
  if (isStartedOrInProgressReport(report)) return "proses";
  if (isReportedReport(report)) return "reported";

  return normalizeStatusValue(
    firstValid(
      report?.computed_status,
      report?.computedStatus,
      report?.display_status,
      report?.displayStatus,
      report?.status,
      report?.raw?.computed_status,
      report?.raw?.computedStatus,
      report?.raw?.status
    )
  );
}

function getReportId(report) {
  return report?.id || report?.damageReportId || report?.raw?.id || null;
}

function getReportDate(report) {
  return (
    report?.submitDate ||
    report?.createdAt ||
    report?.created_at ||
    report?.date ||
    report?.raw?.created_at ||
    report?.raw?.reported_at ||
    "-"
  );
}

function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const colorClass =
    notification.type === "success"
      ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
      : notification.type === "warning"
      ? "border-amber-500/40 bg-amber-950/90 text-amber-100"
      : "border-red-500/40 bg-red-950/90 text-red-100";

  const title =
    notification.type === "success"
      ? "Berhasil"
      : notification.type === "warning"
      ? "Perhatian"
      : "Terjadi Kendala";

  return (
    <div className="fixed right-5 top-5 z-[9999] w-[340px] max-w-[calc(100vw-2rem)]">
      <div
        className={`
          ${colorClass}
          rounded-2xl
          border
          px-4
          py-3
          shadow-2xl
          backdrop-blur
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold">{title}</div>
            <div className="mt-1 text-xs leading-relaxed opacity-90">
              {notification.message}
            </div>
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

export default function DamageReport() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [allReports, setAllReports] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [notification]);

  const reports = useMemo(() => {
    return allReports.filter((report) =>
      matchesStatusFilter(report, activeFilter)
    );
  }, [allReports, activeFilter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);

      const filters = {};

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const data = await getReports(filters);
      const safeData = Array.isArray(data) ? data : [];

      setAllReports(safeData);
    } catch (err) {
      console.error("GAGAL MENGAMBIL DATA LAPORAN:", err);
      setAllReports([]);

      showNotification(
        "error",
        "Data laporan belum dapat dimuat. Periksa koneksi atau coba muat ulang halaman."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchReports();
    }, 300);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const openDetail = async (report) => {
    try {
      const reportId = getReportId(report);

      if (!reportId) {
        setModalData(report);
        return;
      }

      const detail = await getReportById(reportId);
      const mergedData = mergeReportForModal(report, detail);

      setModalData(mergedData);
    } catch (err) {
      console.error("GAGAL MEMBUKA DETAIL LAPORAN:", err);

      setModalData(report);

      showNotification(
        "warning",
        "Detail lengkap belum dapat dimuat. Data ringkas tetap ditampilkan."
      );
    }
  };

  const closeDetail = () => setModalData(null);

  const handleApprove = async (id) => {
    if (!id) {
      showNotification("warning", "ID laporan tidak ditemukan.");
      return;
    }

    try {
      await approveFollowUp(id, {
        note: "Follow-up disetujui oleh admin.",
      });

      closeDetail();
      await fetchReports();

      showNotification("success", "Follow-up laporan berhasil disetujui.");
    } catch (err) {
      console.error("GAGAL MENYETUJUI FOLLOW-UP:", err);

      showNotification(
        "error",
        "Follow-up laporan belum dapat disetujui. Periksa data atau coba beberapa saat lagi."
      );
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      <Sidebar />

      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%)] p-5 md:p-7">
          <div className="mx-auto max-w-[1600px]">
            <header className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 to-[#171717]/95 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-djati-amber/80">
                DAMAGE REPORT
              </p>

              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Laporan Kerusakan
              </h1>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">
                Pantau laporan kerusakan kendaraan, lihat detail foto dan KPI,
                serta proses follow-up laporan tanpa mengubah bentuk tabel yang
                sudah ada.
              </p>
            </header>

            <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#171a23]/95 px-5 py-4 shadow-2xl shadow-black/20 lg:flex-row lg:items-center lg:justify-between">
              <SearchInput
                placeholder="Cari laporan, kendaraan, atau pengemudi..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full lg:flex-[0_1_420px]"
              />

              <div className="flex items-center gap-3">
                <label
                  htmlFor="status-filter"
                  className="text-[0.8rem] text-djati-muted font-medium whitespace-nowrap"
                >
                  Filter Status:
                </label>

                <div className="relative">
                  <select
                    id="status-filter"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="
                      min-w-[220px]
                      appearance-none
                      rounded-lg
                      border
                      border-djati-border-light
                      bg-[#0f1117]
                      px-4
                      py-2.5
                      pr-10
                      text-[0.82rem]
                      font-semibold
                      text-djati-amber
                      outline-none
                      transition-all
                      duration-200
                      hover:border-djati-amber
                      focus:border-djati-amber
                      focus:ring-4
                      focus:ring-djati-amber/10
                      cursor-pointer
                    "
                  >
                    {statusFilters.map((status) => (
                      <option
                        key={status}
                        value={status}
                        className="bg-[#0f1117] text-white"
                      >
                        {status}
                      </option>
                    ))}
                  </select>

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-djati-amber text-[0.7rem]">
                    ▼
                  </span>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#171a23]/95 shadow-2xl shadow-black/20">
              <DataTable
                columns={tableColumns}
                data={reports}
                className="!rounded-b-none !border-b-0"
                renderRow={(report, index) => {
                  const reportId = getReportId(report) || `TEMP-${index + 1}`;

                  const isWaitingParts = isWaitingPartsReport(report);
                  const isCanceledRejected = isCanceledOrRejected(report);
                  const isFatal = isFatalReport(report);

                  const imagePath = getImagePath(report);
                  const imageUrl = getImageUrl(imagePath);

                  const mttr = getKpiValueFromReport(report, "mttr");
                  const mtbf = getKpiValueFromReport(report, "mtbf");
                  const ma = getKpiValueFromReport(report, "ma");

                  const reportDate = getReportDate(report);
                  const displayStatus = getDisplayStatus(report);
                  const statusBadgeVariant = getStatusBadgeVariant(report);

                  const equipmentName =
                    report.equipmentName ||
                    report.equipName ||
                    report.equip ||
                    report.raw?.vehicle?.equipment_name ||
                    report.raw?.vehicle?.equipmentName ||
                    "Unit tidak diketahui";

                  const plateNumber =
                    report.plateNumber ||
                    report.raw?.vehicle?.plate_number ||
                    report.raw?.vehicle?.plateNumber ||
                    "-";

                  const driverName =
                    report.driverName ||
                    report.operator ||
                    report.raw?.driver?.name ||
                    report.raw?.user?.name ||
                    "-";

                  return (
                    <tr key={reportId} className="table-row-hover">
                      <td className="px-4 py-3.5 text-[0.82rem] font-semibold">
                        #{reportId}
                      </td>

                      <td className="px-4 py-3.5">
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(imageUrl, "_blank")}
                            className="block"
                            title="Buka foto kerusakan"
                          >
                            <img
                              src={imageUrl}
                              alt={`Foto kerusakan laporan ${reportId}`}
                              className="
                                w-[72px]
                                h-[72px]
                                object-cover
                                rounded-lg
                                border
                                border-djati-border-light
                                hover:border-djati-amber
                                transition-all
                              "
                              onError={(e) => {
                                e.currentTarget.style.display = "none";

                                const fallback =
                                  e.currentTarget.parentElement
                                    ?.nextElementSibling;

                                if (fallback) {
                                  fallback.classList.remove("hidden");
                                }
                              }}
                            />
                          </button>
                        ) : null}

                        <div
                          className={`
                            ${imageUrl ? "hidden" : ""}
                            w-[72px]
                            h-[72px]
                            rounded-lg
                            border
                            border-dashed
                            border-djati-border-light
                            flex
                            items-center
                            justify-center
                            text-[0.68rem]
                            text-djati-muted
                            text-center
                            px-2
                          `}
                        >
                          Tidak Ada Foto
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-[0.82rem]">
                        <div className="font-semibold">{equipmentName}</div>
                        <div className="text-[0.72rem] text-djati-muted">
                          Nomor Polisi: {plateNumber}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-[0.82rem]">
                        {driverName}
                      </td>

                      <td className="px-4 py-3.5 text-[0.82rem]">
                        {formatDate(reportDate)}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge variant={statusBadgeVariant}>
                          {displayStatus}
                        </StatusBadge>
                      </td>

                      <td className="px-4 py-3.5 text-[0.78rem]">
                        {hasKpi(report) ? (
                          <div className="space-y-1 text-djati-muted">
                            <div>MTTR: {formatKpiValue(mttr, " jam")}</div>
                            <div>MTBF: {formatKpiValue(mtbf, " jam")}</div>
                            <div>MA: {formatKpiValue(ma, "%")}</div>
                          </div>
                        ) : (
                          <span className="text-djati-muted">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openDetail(report)}
                            className="btn-ghost px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md"
                          >
                            Lihat Detail
                          </button>

                          {isWaitingParts && !isCanceledRejected && !isFatal && (
                            <button
                              type="button"
                              onClick={() => handleApprove(reportId)}
                              className="btn-success-outline px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md"
                            >
                              Setujui Follow-up
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }}
              />

              {isLoading && (
                <div className="border-t border-white/10 bg-[#171a23]/95 px-5 py-4 text-sm text-djati-muted">
                  Memuat data laporan...
                </div>
              )}

              {!isLoading && reports.length === 0 && (
                <div className="border-t border-white/10 bg-[#171a23]/95 px-5 py-4 text-sm text-djati-muted">
                  Tidak ada laporan yang sesuai dengan filter ini.
                </div>
              )}
            </section>

            <DamageDetailModal
              data={modalData}
              onClose={closeDetail}
              onApprove={handleApprove}
            />
          </div>
        </div>
      </main>
    </div>
  );
}