import { useEffect, useState } from "react";
import DashboardLayout from "../components/layouts/DashboardLayout";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import StatusBadge from "../components/ui/StatusBadge";
import DamageDetailModal from "../components/modals/DamageDetailModal";

import {
  getReports,
  getReportById,
  approveReport,
  rejectReport,
  getFinishedRepairReports,
  storeFinishedRepairHistory,
} from "../services/reportService";

const tableColumns = [
  { label: "REPORT ID" },
  { label: "PHOTO" },
  { label: "EQUIPMENT NAME" },
  { label: "DRIVER NAME" },
  { label: "REPORT DATE" },
  { label: "STATUS" },
  { label: "KPI" },
  { label: "ACTIONS" },
];

const statusFilters = [
  "All",
  "Reported",
  "In Progress",
  "Waiting Parts",
  "Completed",
  "Fatal",
  "Finished Repair",
];

const API_STORAGE_URL = "http://127.0.0.1:8000/storage";

function statusToBackendFilter(status) {
  switch (status) {
    case "Reported":
      return "menunggu";
    case "In Progress":
      return "proses";
    case "Waiting Parts":
      return "butuh_followup_admin";
    case "Completed":
      return "selesai";
    case "Fatal":
      return "fatal";
    default:
      return "";
  }
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
      month: "2-digit",
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
    report?.damageImage ||
    report?.damage_image ||
    report?.photo ||
    report?.raw?.image ||
    report?.raw?.damage_image ||
    null
  );
}

function getImageUrl(path) {
  if (!path || path === "null" || path === "-") {
    return null;
  }

  if (String(path).startsWith("http")) {
    return path;
  }

  const cleanPath = String(path).replace(/^\/+/, "");

  return `${API_STORAGE_URL}/${cleanPath}`;
}

function hasKpi(report) {
  return (
    report?.mttr !== null ||
    report?.mtbf !== null ||
    report?.ma !== null
  );
}

function formatKpiValue(value, suffix = "") {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null"
  ) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `${value}${suffix}`;
  }

  return `${number.toFixed(2)}${suffix}`;
}

export default function DamageReport() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);

      let data = [];

      if (activeFilter === "Finished Repair") {
        data = await getFinishedRepairReports();
      } else {
        const filters = {};

        const status = statusToBackendFilter(activeFilter);

        if (status) {
          filters.status = status;
        }

        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        data = await getReports(filters);
      }

      const filteredData = Array.isArray(data) ? data : [];

      if (activeFilter === "Finished Repair" && searchQuery.trim()) {
        const keyword = searchQuery.trim().toLowerCase();

        setReports(
          filteredData.filter((item) => {
            const target = [
              item.id,
              item.equipmentName,
              item.equip,
              item.driverName,
              item.operator,
              item.plateNumber,
              item.damageType,
              item.description,
              item.status,
            ]
              .join(" ")
              .toLowerCase();

            return target.includes(keyword);
          })
        );
      } else {
        setReports(filteredData);
      }
    } catch (err) {
      console.error("FETCH REPORTS ERROR:", err);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const openDetail = async (id) => {
    try {
      const data = await getReportById(id);
      setModalData(data);
    } catch (err) {
      console.error("OPEN DETAIL ERROR:", err);
    }
  };

  const closeDetail = () => setModalData(null);

  const handleApprove = async (id) => {
    try {
      await approveReport(id);
      fetchReports();
    } catch (err) {
      console.error("APPROVE ERROR:", err);
      alert(err?.message || "Gagal approve report.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectReport(id);
      fetchReports();
    } catch (err) {
      console.error("REJECT ERROR:", err);
      alert(
        err?.message ||
          "Gagal reject report. Pastikan endpoint reject tersedia di backend."
      );
    }
  };

  const handleStoreFinishedRepair = async (report) => {
    try {
      setSavingId(report.id);

      const result = await storeFinishedRepairHistory(report.id, {
        admin_note: "Disimpan dari finished technician repair",
        action:
          report.technicianNote ||
          report.description ||
          "Repair selesai oleh teknisi",
        cost: 0,
      });

      if (!result.success) {
        alert(result.message || "Gagal menyimpan finished repair history.");
        return;
      }

      alert(result.message || "Finished repair history berhasil disimpan.");
      fetchReports();
    } catch (err) {
      console.error("STORE FINISHED REPAIR ERROR:", err);
      alert(err?.message || "Gagal menyimpan finished repair history.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchReports();
    }, 300);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <DashboardLayout title="Damage Reports">
      <section className="flex items-center justify-between gap-4 mb-5 panel px-5 py-4">
        <SearchInput
          placeholder="Search reports..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-[0_1_400px]"
        />

        <div className="flex items-center gap-3">
          <label
            htmlFor="status-filter"
            className="text-[0.8rem] text-djati-muted font-medium whitespace-nowrap"
          >
            Status:
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
                bg-[#11131a]
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
                focus:ring-2
                focus:ring-djati-amber/20
                cursor-pointer
              "
            >
              {statusFilters.map((status) => (
                <option
                  key={status}
                  value={status}
                  className="bg-[#11131a] text-white"
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

      <section>
        <DataTable
          columns={tableColumns}
          data={reports}
          className="!rounded-b-none !border-b-0"
          renderRow={(r) => {
            const isCompleted =
              r.status === "Completed" ||
              r.rawStatus === "selesai" ||
              r.rawStatus === "finished";

            const isWaitingParts =
              r.status === "Waiting Parts" ||
              r.rawStatus === "butuh_followup_admin";

            const imagePath = getImagePath(r);
            const imageUrl = getImageUrl(imagePath);

            return (
              <tr key={r.id} className="table-row-hover">
                <td className="px-4 py-3.5 text-[0.82rem]">
                  #{r.id}
                </td>

                <td className="px-4 py-3.5">
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={() => window.open(imageUrl, "_blank")}
                      className="block"
                      title="Open damage image"
                    >
                      <img
                        src={imageUrl}
                        alt={`Damage report ${r.id}`}
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
                            e.currentTarget.parentElement?.nextElementSibling;

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
                    No Image
                  </div>
                </td>

                <td className="px-4 py-3.5 text-[0.82rem]">
                  <div className="font-semibold">
                    {r.equipmentName || r.equip || "Unknown Unit"}
                  </div>
                  <div className="text-[0.72rem] text-djati-muted">
                    Plate: {r.plateNumber || "-"}
                  </div>
                </td>

                <td className="px-4 py-3.5 text-[0.82rem]">
                  {r.driverName || r.operator || "-"}
                </td>

                <td className="px-4 py-3.5 text-[0.82rem]">
                  {formatDate(r.createdAt || r.date)}
                </td>

                <td className="px-4 py-3.5">
                  <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                </td>

                <td className="px-4 py-3.5 text-[0.78rem]">
                  {hasKpi(r) ? (
                    <div className="space-y-1 text-djati-muted">
                      <div>MTTR: {formatKpiValue(r.mttr, " hrs")}</div>
                      <div>MTBF: {formatKpiValue(r.mtbf, " hrs")}</div>
                      <div>MA: {formatKpiValue(r.ma, "%")}</div>
                    </div>
                  ) : (
                    <span className="text-djati-muted">-</span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => openDetail(r.id)}
                      className="btn-ghost px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md"
                    >
                      View Detail
                    </button>

                    {isWaitingParts && (
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="btn-success-outline px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md"
                      >
                        Approve Follow-up
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => handleStoreFinishedRepair(r)}
                        disabled={savingId === r.id}
                        className="btn-success-outline px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md disabled:opacity-60"
                      >
                        {savingId === r.id
                          ? "Saving..."
                          : "Save to Repair History"}
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={() => handleReject(r.id)}
                        className="btn-danger-outline px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          }}
        />

        {isLoading && (
          <div className="panel px-5 py-4 text-sm text-djati-muted">
            Loading reports...
          </div>
        )}

        {!isLoading && reports.length === 0 && (
          <div className="panel px-5 py-4 text-sm text-djati-muted">
            Tidak ada laporan untuk filter ini.
          </div>
        )}
      </section>

      <DamageDetailModal
        data={modalData}
        onClose={closeDetail}
        onApprove={handleApprove}
        onReject={handleReject}
        onStoreFinishedRepair={handleStoreFinishedRepair}
      />
    </DashboardLayout>
  );
}