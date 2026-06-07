import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Check,
  XCircle,
  Search,
  Package,
} from "lucide-react";

import Sidebar from "../components/Sidebar";

import {
  getPartUsagesApi,
  approvePartUsageApi,
  rejectPartUsageApi,
} from "../services/api";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  const dateOnly = String(value).slice(0, 10);
  const date = new Date(dateOnly);

  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getUserName(user) {
  return user?.name || user?.username || "-";
}

function getDamageReport(usage) {
  return usage?.damageReport || usage?.damage_report || {};
}

function getDamageReportId(usage) {
  return (
    usage?.damage_report_id ||
    usage?.damageReport?.id ||
    usage?.damage_report?.id ||
    "-"
  );
}

function getVehicleLabel(usage) {
  const report = getDamageReport(usage);
  const vehicle = report?.vehicle || {};

  const plate = vehicle.plate_number || "-";
  const brand = vehicle.brand || "";
  const model = vehicle.model || "";
  const equipmentName = vehicle.equipment_name || "";

  const detail = equipmentName || `${brand} ${model}`.trim();

  return {
    plate,
    detail: detail || "-",
  };
}

function StatusBadge({ status }) {
  const normalized = status === "requested" ? "pending" : status || "pending";

  const className =
    normalized === "approved"
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : normalized === "rejected"
      ? "bg-red-500/10 text-red-400 border-red-500/30"
      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[0.68rem] font-bold uppercase ${className}`}
    >
      {normalized}
    </span>
  );
}

function SummaryCard({ label, value, tone = "amber" }) {
  const toneClass =
    tone === "green"
      ? "text-green-400"
      : tone === "red"
      ? "text-red-400"
      : "text-djati-amber";

  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5">
      <p className="text-white/45 text-[0.75rem] font-bold uppercase tracking-wide">
        {label}
      </p>
      <h3 className={`text-3xl font-extrabold mt-2 ${toneClass}`}>{value}</h3>
    </div>
  );
}

export default function PartRequestsPage() {
  const [status, setStatus] = useState("pending");
  const [limit, setLimit] = useState(100);
  const [search, setSearch] = useState("");

  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");

  const loadPartRequests = async () => {
    try {
      setLoading(true);
      setMessage("");

      const data = await getPartUsagesApi({
        status,
        limit,
      });

      setUsages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("LOAD PART REQUESTS ERROR:", error);

      setMessage(
        `❌ ${getErrorMessage(
          error,
          "Gagal mengambil data request sparepart."
        )}`
      );

      setUsages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartRequests();
  }, [status, limit]);

  const filteredUsages = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return usages;

    return usages.filter((usage) => {
      const partName = usage?.part?.name || "";
      const partSku = usage?.part?.sku || "";
      const technician = getUserName(usage?.technician);
      const vehicle = getVehicleLabel(usage);
      const reportId = String(getDamageReportId(usage));

      return (
        partName.toLowerCase().includes(keyword) ||
        partSku.toLowerCase().includes(keyword) ||
        technician.toLowerCase().includes(keyword) ||
        vehicle.plate.toLowerCase().includes(keyword) ||
        vehicle.detail.toLowerCase().includes(keyword) ||
        reportId.toLowerCase().includes(keyword)
      );
    });
  }, [usages, search]);

  const summary = useMemo(() => {
    const pending = usages.filter((item) => item.status === "requested").length;
    const approved = usages.filter((item) => item.status === "approved").length;
    const rejected = usages.filter((item) => item.status === "rejected").length;

    return {
      pending,
      approved,
      rejected,
      total: usages.length,
    };
  }, [usages]);

  const handleApprove = async (usage) => {
    const adminNote = window.prompt(
      "Catatan admin untuk approval sparepart (opsional):"
    );

    if (adminNote === null) return;

    const confirmApprove = window.confirm(
      "Approve request sparepart ini? Stok akan otomatis berkurang dan expense inventory akan tercatat."
    );

    if (!confirmApprove) return;

    try {
      setActionLoadingId(`approve-${usage.id}`);
      setMessage("");

      await approvePartUsageApi(usage.id, {
        admin_note: adminNote || "",
      });

      setMessage("✅ Request sparepart berhasil di-approve.");
      await loadPartRequests();
    } catch (error) {
      console.error("APPROVE PART REQUEST ERROR:", error);

      setMessage(
        `❌ ${getErrorMessage(error, "Gagal approve request sparepart.")}`
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async (usage) => {
    const reason = window.prompt("Alasan penolakan sparepart:");

    if (reason === null) return;

    const confirmReject = window.confirm("Tolak request sparepart ini?");

    if (!confirmReject) return;

    try {
      setActionLoadingId(`reject-${usage.id}`);
      setMessage("");

      await rejectPartUsageApi(usage.id, {
        reason: reason || "",
      });

      setMessage("✅ Request sparepart berhasil ditolak.");
      await loadPartRequests();
    } catch (error) {
      console.error("REJECT PART REQUEST ERROR:", error);

      setMessage(
        `❌ ${getErrorMessage(error, "Gagal reject request sparepart.")}`
      );
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121212]">
      <Sidebar />

      <main className="flex-1 p-6 text-white overflow-x-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-djati-amber">
              Part Requests
            </h1>

            <p className="text-sm text-white/45 mt-1">
              Approval request sparepart dari teknisi. Approval akan mengurangi
              stok dan mencatat expense inventory otomatis.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPartRequests}
            disabled={loading}
            className="flex items-center gap-2 bg-djati-amber text-black font-bold rounded-lg px-4 py-2 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {message && (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm font-semibold ${
              message.startsWith("✅")
                ? "border-green-500/40 bg-green-500/10 text-green-400"
                : "border-red-500/40 bg-red-500/10 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Total Request" value={summary.total} />
          <SummaryCard label="Pending" value={summary.pending} />
          <SummaryCard label="Approved" value={summary.approved} tone="green" />
          <SummaryCard label="Rejected" value={summary.rejected} tone="red" />
        </section>

        <section className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Package size={20} className="text-djati-amber" />
                <h2 className="text-lg font-bold text-djati-amber">
                  Approval Request Sparepart
                </h2>
              </div>

              <p className="text-xs text-white/40 mt-1">
                Gunakan filter status untuk melihat request yang masuk, sudah
                disetujui, atau ditolak.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px_110px] gap-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search sparepart / teknisi / plat..."
                  className="w-full bg-[#121212] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-djati-amber"
                />
              </div>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-djati-amber"
              >
                <option value="pending">Pending</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-djati-amber"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-djati-amber text-black">
                <tr>
                  <th className="p-4 text-left font-bold">Tanggal</th>
                  <th className="p-4 text-left font-bold">Teknisi</th>
                  <th className="p-4 text-left font-bold">Laporan</th>
                  <th className="p-4 text-left font-bold">Vehicle</th>
                  <th className="p-4 text-left font-bold">Sparepart</th>
                  <th className="p-4 text-left font-bold">Qty / Stock</th>
                  <th className="p-4 text-left font-bold">Est. Expense</th>
                  <th className="p-4 text-left font-bold">Status</th>
                  <th className="p-4 text-left font-bold">Note</th>
                  <th className="p-4 text-left font-bold">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsages.map((usage) => {
                  const part = usage?.part || {};
                  const vehicle = getVehicleLabel(usage);

                  const qty = Number(usage.qty || 0);
                  const stock = Number(part.stock || 0);
                  const buyPrice = Number(part.buy_price || 0);
                  const estimatedExpense = qty * buyPrice;
                  const isPending = usage.status === "requested";

                  return (
                    <tr
                      key={usage.id}
                      className="border-t border-white/10 hover:bg-white/[0.03]"
                    >
                      <td className="p-4 text-white/75">
                        {formatDate(usage.created_at)}
                      </td>

                      <td className="p-4 text-white/75">
                        {getUserName(usage.technician)}
                      </td>

                      <td className="p-4 text-white/75">
                        #{getDamageReportId(usage)}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white">
                          {vehicle.plate}
                        </div>
                        <div className="text-xs text-white/40">
                          {vehicle.detail}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white">
                          {part.name || "-"}
                        </div>
                        <div className="text-xs text-white/40">
                          {part.sku || "-"}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-djati-amber">
                          {qty}
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            stock < qty ? "text-red-400" : "text-white/40"
                          }`}
                        >
                          Stock: {stock}
                          {stock < qty ? " • Stok kurang" : ""}
                        </div>
                      </td>

                      <td className="p-4 font-bold text-djati-amber">
                        Rp {formatCurrency(estimatedExpense)}
                      </td>

                      <td className="p-4">
                        <StatusBadge status={usage.status} />
                      </td>

                      <td className="p-4 max-w-[220px]">
                        <div className="text-white/65 line-clamp-2">
                          {usage.note || "-"}
                        </div>
                      </td>

                      <td className="p-4">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(usage)}
                              disabled={
                                actionLoadingId === `approve-${usage.id}` ||
                                stock < qty
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 text-xs font-bold disabled:opacity-50"
                            >
                              <Check size={13} />
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReject(usage)}
                              disabled={
                                actionLoadingId === `reject-${usage.id}`
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold disabled:opacity-50"
                            >
                              <XCircle size={13} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-white/35">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!filteredUsages.length && !loading && (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-6 text-center text-white/50"
                    >
                      Tidak ada request sparepart.
                    </td>
                  </tr>
                )}

                {loading && !filteredUsages.length && (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-6 text-center text-white/50"
                    >
                      Loading request sparepart...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}