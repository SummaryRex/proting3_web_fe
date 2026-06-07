import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

import DashboardLayout from "../components/layouts/DashboardLayout";
import StatCard from "../components/ui/StatCard";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";

import {
  getPartUsagesApi,
  approvePartUsageApi,
  rejectPartUsageApi,
  getCostEstimatesApi,
  approveCostEstimateApi,
  rejectCostEstimateApi,
  getFinanceTransactionsApi,
} from "../services/api";

const partRequestColumns = [
  { label: "SPARE PART" },
  { label: "VEHICLE" },
  { label: "REQUESTED BY" },
  { label: "QTY / STOCK" },
  { label: "EST. COST (RP)" },
  { label: "ACTIONS" },
];

const costEstimateColumns = [
  { label: "VEHICLE" },
  { label: "DRIVER / TECHNICIAN" },
  { label: "COST DETAIL" },
  { label: "TOTAL COST (RP)" },
  { label: "NOTE" },
  { label: "ACTIONS" },
];

const historyColumns = [
  { label: "DATE" },
  { label: "TYPE" },
  { label: "CATEGORY" },
  { label: "AMOUNT (RP)" },
  { label: "SOURCE" },
  { label: "NOTE / REF" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCurrentMonth() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${now.getFullYear()}-${month}`;
}

function getVehicleLabel(vehicle) {
  if (!vehicle) {
    return {
      title: "-",
      subtitle: "-",
    };
  }

  const plate = vehicle.plate_number || "-";
  const brand = vehicle.brand || "";
  const model = vehicle.model || "";

  return {
    title: plate,
    subtitle: `${brand} ${model}`.trim() || "-",
  };
}

function getUserName(user) {
  return user?.username || user?.name || "-";
}

function getStatusVariant(status) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";

  if (
    status === "submitted" ||
    status === "requested" ||
    status === "pending"
  ) {
    return "pending";
  }

  return status || "pending";
}

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export default function CostMonitoring() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [partRequests, setPartRequests] = useState([]);
  const [costEstimates, setCostEstimates] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        partUsageRes,
        costEstimateRes,
        transactionRes,
      ] = await Promise.all([
        getPartUsagesApi({
          status: "pending",
          limit: 50,
        }),
        getCostEstimatesApi("submitted"),
        getFinanceTransactionsApi({
          month,
        }),
      ]);

      setPartRequests(
        Array.isArray(partUsageRes) ? partUsageRes : []
      );

      setCostEstimates(
        Array.isArray(costEstimateRes) ? costEstimateRes : []
      );

      setTransactions(
        Array.isArray(transactionRes) ? transactionRes : []
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Gagal memuat data cost monitoring."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const summary = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce(
        (sum, tx) => sum + Number(tx.amount || 0),
        0
      );

    const expense = transactions
      .filter((tx) => tx.type === "expense")
      .reduce(
        (sum, tx) => sum + Number(tx.amount || 0),
        0
      );

    const inventoryExpense = transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          tx.source === "inventory"
      )
      .reduce(
        (sum, tx) => sum + Number(tx.amount || 0),
        0
      );

    const pendingPartRequests = partRequests.filter(
      (item) => item.status === "requested"
    ).length;

    const pendingCostEstimates = costEstimates.filter(
      (item) => item.status === "submitted"
    ).length;

    return {
      income,
      expense,
      inventoryExpense,
      pendingPartRequests,
      pendingCostEstimates,
      pendingActions:
        pendingPartRequests + pendingCostEstimates,
    };
  }, [transactions, partRequests, costEstimates]);

  const handleApprovePartRequest = async (partUsageId) => {
    const adminNote = window.prompt(
      "Catatan admin untuk approval sparepart (opsional):"
    );

    if (adminNote === null) return;

    try {
      setActionLoadingId(`part-approve-${partUsageId}`);

      await approvePartUsageApi(partUsageId, {
        admin_note: adminNote || "",
      });

      await loadData();
    } catch (err) {
      alert(
        getErrorMessage(
          err,
          "Gagal approve request sparepart."
        )
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRejectPartRequest = async (partUsageId) => {
    const reason = window.prompt(
      "Alasan penolakan sparepart:"
    );

    if (reason === null) return;

    try {
      setActionLoadingId(`part-reject-${partUsageId}`);

      await rejectPartUsageApi(partUsageId, {
        reason: reason || "",
      });

      await loadData();
    } catch (err) {
      alert(
        getErrorMessage(
          err,
          "Gagal reject request sparepart."
        )
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const handleApproveCostEstimate = async (costEstimateId) => {
    const confirmApprove = window.confirm(
      "Yakin ingin approve estimasi biaya ini?"
    );

    if (!confirmApprove) return;

    try {
      setActionLoadingId(`estimate-approve-${costEstimateId}`);

      await approveCostEstimateApi(costEstimateId);

      await loadData();
    } catch (err) {
      alert(
        getErrorMessage(
          err,
          "Gagal approve estimasi biaya."
        )
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRejectCostEstimate = async (costEstimateId) => {
    const note = window.prompt(
      "Catatan revisi / alasan penolakan estimasi:"
    );

    if (note === null) return;

    try {
      setActionLoadingId(`estimate-reject-${costEstimateId}`);

      await rejectCostEstimateApi(costEstimateId, {
        note: note || "",
      });

      await loadData();
    } catch (err) {
      alert(
        getErrorMessage(
          err,
          "Gagal reject estimasi biaya."
        )
      );
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <DashboardLayout title="Cost Monitoring">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[0.82rem] text-white/45">
          Monitoring biaya maintenance, approval sparepart,
          estimasi biaya, dan transaksi finance.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-[#171717] border border-white/[0.08] text-djati-text-bright rounded-lg px-3 py-2 text-[0.8rem] outline-none focus:border-djati-amber"
          />

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-djati-amber text-[#111] font-bold text-[0.78rem] disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-status-critical/40 bg-status-critical/10 px-4 py-3 text-status-critical text-[0.82rem] font-semibold">
          {error}
        </div>
      )}

      <section className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="MONTHLY EXPENSE"
          prefix="Rp"
          value={formatCurrency(summary.expense)}
          trend={
            <>
              <TrendingUp
                size={14}
                className="text-[#4caf50]"
              />
              <span className="text-[0.75rem] text-[#4caf50] font-semibold">
                Income: Rp {formatCurrency(summary.income)}
              </span>
            </>
          }
        />

        <StatCard
          label="SPAREPART EXPENSES"
          value={
            <span className="text-[1.7rem]">
              Rp {formatCurrency(summary.inventoryExpense)}
            </span>
          }
          highlight={false}
          trend={
            <>
              <AlertTriangle
                size={14}
                className="text-status-critical"
              />
              <span className="text-[0.75rem] text-status-critical font-semibold">
                Inventory source
              </span>
            </>
          }
        />

        <StatCard
          label="PENDING APPROVALS"
          value={
            <span className="text-[1.7rem]">
              {summary.pendingActions}
            </span>
          }
          highlight={false}
          trend={
            <>
              <Clock
                size={14}
                className="text-white/35"
              />
              <span className="text-[0.75rem] text-white/40 font-medium">
                {summary.pendingPartRequests} parts,{" "}
                {summary.pendingCostEstimates} estimates
              </span>
            </>
          }
        />
      </section>

      <section className="panel p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1.05rem] font-bold text-[#e8e8e8]">
            Approve Spare Parts
          </h2>

          {summary.pendingPartRequests > 0 && (
            <StatusBadge variant="pending" pill={false}>
              {summary.pendingPartRequests} PENDING ACTIONS
            </StatusBadge>
          )}
        </div>

        <DataTable
          columns={partRequestColumns}
          data={partRequests}
          renderRow={(request, idx) => {
            const part = request.part || {};
            const report =
              request.damage_report ||
              request.damageReport ||
              {};
            const vehicle = getVehicleLabel(report.vehicle);

            const qty = Number(request.qty || 0);
            const stock = Number(part.stock || 0);
            const buyPrice = Number(part.buy_price || 0);
            const estimatedCost = qty * buyPrice;
            const isRequested = request.status === "requested";

            return (
              <tr
                key={request.id || idx}
                className="table-row-hover"
              >
                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  <strong className="block text-djati-text-bright font-bold text-[0.86rem]">
                    {part.name || "-"}
                  </strong>
                  <small className="text-[0.68rem] text-white/35">
                    {part.sku || "-"}
                  </small>
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  <strong className="block text-djati-text-bright font-semibold text-[0.84rem]">
                    {vehicle.title}
                  </strong>
                  <small className="text-[0.68rem] text-white/35">
                    {vehicle.subtitle}
                  </small>
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  <strong className="block text-djati-text-bright font-semibold text-[0.84rem]">
                    {getUserName(request.technician)}
                  </strong>
                  <small className="text-[0.68rem] text-white/35">
                    {formatDate(request.created_at)}
                  </small>
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  <span className="font-bold text-white">
                    {qty}
                  </span>
                  <span className="text-white/35">
                    {" "}
                    / stock {stock}
                  </span>

                  {stock < qty && (
                    <small className="block text-status-critical font-semibold mt-1">
                      Stok tidak cukup
                    </small>
                  )}
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-[#ff9800] font-bold border-b border-white/[0.04]">
                  {formatCurrency(estimatedCost)}
                </td>

                <td className="px-4 py-3.5 border-b border-white/[0.04]">
                  {isRequested ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleApprovePartRequest(request.id)
                        }
                        disabled={
                          actionLoadingId ===
                            `part-approve-${request.id}` ||
                          stock < qty
                        }
                        className="btn-success-outline px-3.5 py-1.5 text-[0.72rem] !rounded-md whitespace-nowrap disabled:opacity-50"
                      >
                        APPROVE
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRejectPartRequest(request.id)
                        }
                        disabled={
                          actionLoadingId ===
                          `part-reject-${request.id}`
                        }
                        className="btn-danger-outline px-3.5 py-1.5 text-[0.72rem] !rounded-md whitespace-nowrap disabled:opacity-50"
                      >
                        REJECT
                      </button>
                    </div>
                  ) : (
                    <StatusBadge
                      variant={getStatusVariant(request.status)}
                    >
                      {request.status}
                    </StatusBadge>
                  )}
                </td>
              </tr>
            );
          }}
        />

        {!loading && partRequests.length === 0 && (
          <div className="text-center py-6 text-white/40 text-[0.84rem]">
            Tidak ada request sparepart yang menunggu approval.
          </div>
        )}
      </section>

      <section className="panel p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1.05rem] font-bold text-[#e8e8e8]">
            Cost Estimate Approval
          </h2>

          {summary.pendingCostEstimates > 0 && (
            <StatusBadge variant="pending" pill={false}>
              {summary.pendingCostEstimates} WAITING APPROVAL
            </StatusBadge>
          )}
        </div>

        <DataTable
          columns={costEstimateColumns}
          data={costEstimates}
          renderRow={(estimate, idx) => {
            const report =
              estimate.damage_report ||
              estimate.damageReport ||
              {};
            const vehicle = getVehicleLabel(report.vehicle);

            const driver = getUserName(report.driver);
            const technician = getUserName(estimate.technician);
            const isSubmitted = estimate.status === "submitted";

            return (
              <tr
                key={estimate.id || idx}
                className="table-row-hover"
              >
                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  <strong className="block text-djati-text-bright font-bold text-[0.86rem]">
                    {vehicle.title}
                  </strong>
                  <small className="text-[0.68rem] text-white/35">
                    {vehicle.subtitle}
                  </small>
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  <strong className="block text-djati-text-bright font-semibold text-[0.84rem]">
                    Driver: {driver}
                  </strong>
                  <small className="text-[0.68rem] text-white/35">
                    Technician: {technician}
                  </small>
                </td>

                <td className="px-4 py-3.5 text-[0.78rem] text-djati-text border-b border-white/[0.04]">
                  <div>
                    Labor: Rp{" "}
                    {formatCurrency(estimate.labor_cost)}
                  </div>
                  <div>
                    Parts: Rp{" "}
                    {formatCurrency(estimate.parts_cost)}
                  </div>
                  <div>
                    Other: Rp{" "}
                    {formatCurrency(estimate.other_cost)}
                  </div>
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-[#ff9800] font-bold border-b border-white/[0.04]">
                  {formatCurrency(estimate.total_cost)}
                </td>

                <td className="px-4 py-3.5 text-[0.78rem] text-djati-text border-b border-white/[0.04] max-w-[220px]">
                  <span className="line-clamp-2">
                    {estimate.note || "-"}
                  </span>
                </td>

                <td className="px-4 py-3.5 border-b border-white/[0.04]">
                  {isSubmitted ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleApproveCostEstimate(estimate.id)
                        }
                        disabled={
                          actionLoadingId ===
                          `estimate-approve-${estimate.id}`
                        }
                        className="btn-success-outline px-3.5 py-1.5 text-[0.72rem] !rounded-md whitespace-nowrap disabled:opacity-50"
                      >
                        APPROVE
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRejectCostEstimate(estimate.id)
                        }
                        disabled={
                          actionLoadingId ===
                          `estimate-reject-${estimate.id}`
                        }
                        className="btn-danger-outline px-3.5 py-1.5 text-[0.72rem] !rounded-md whitespace-nowrap disabled:opacity-50"
                      >
                        REJECT
                      </button>
                    </div>
                  ) : (
                    <StatusBadge
                      variant={getStatusVariant(estimate.status)}
                    >
                      {estimate.status}
                    </StatusBadge>
                  )}
                </td>
              </tr>
            );
          }}
        />

        {!loading && costEstimates.length === 0 && (
          <div className="text-center py-6 text-white/40 text-[0.84rem]">
            Tidak ada estimasi biaya yang menunggu approval.
          </div>
        )}
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1.05rem] font-bold text-[#e8e8e8]">
            Maintenance Cost History
          </h2>

          <div className="flex items-center gap-3 text-[0.75rem] text-white/45">
            <span className="flex items-center gap-1">
              <CheckCircle
                size={14}
                className="text-[#4caf50]"
              />
              Income: Rp {formatCurrency(summary.income)}
            </span>

            <span className="flex items-center gap-1">
              <XCircle
                size={14}
                className="text-status-critical"
              />
              Expense: Rp {formatCurrency(summary.expense)}
            </span>
          </div>
        </div>

        <DataTable
          columns={historyColumns}
          data={transactions}
          renderRow={(row, idx) => (
            <tr
              key={row.id || idx}
              className="table-row-hover"
            >
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                {formatDate(row.date)}
              </td>

              <td className="px-4 py-3.5 text-[0.84rem] border-b border-white/[0.04]">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.68rem] font-bold uppercase ${
                    row.type === "income"
                      ? "bg-[#4caf50]/10 text-[#4caf50]"
                      : "bg-status-critical/10 text-status-critical"
                  }`}
                >
                  {row.type}
                </span>
              </td>

              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                <strong className="block text-djati-text-bright font-semibold text-[0.84rem]">
                  {row.category || "-"}
                </strong>
                <small className="text-[0.68rem] text-white/35">
                  {row.locked ? "Locked / automatic" : "Manual"}
                </small>
              </td>

              <td className="px-4 py-3.5 text-[0.84rem] text-white font-bold border-b border-white/[0.04]">
                {formatCurrency(row.amount)}
              </td>

              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                {row.source || "-"}
              </td>

              <td className="px-4 py-3.5 text-[0.78rem] text-djati-text border-b border-white/[0.04] max-w-[260px]">
                <span className="block line-clamp-2">
                  {row.note || "-"}
                </span>

                {row.ref && (
                  <small className="block text-[0.68rem] text-white/35 mt-1">
                    Ref: {row.ref}
                  </small>
                )}
              </td>
            </tr>
          )}
        />

        {!loading && transactions.length === 0 && (
          <div className="text-center py-6 text-white/40 text-[0.84rem]">
            Belum ada transaksi pada bulan ini.
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}