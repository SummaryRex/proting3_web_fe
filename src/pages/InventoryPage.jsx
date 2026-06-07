import { useEffect, useState } from "react";
import {
  RefreshCw,
  Package,
  Pencil,
  Trash2,
  X,
  ArrowDownToLine,
  Check,
  XCircle,
} from "lucide-react";

import Sidebar from "../components/Sidebar";

import {
  getPartsApi,
  createPartApi,
  updatePartApi,
  deletePartApi,
  getStockMovementsApi,
  createStockInApi,
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

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getUserName(user) {
  return user?.name || user?.username || "-";
}

function getDamageReportId(usage) {
  return (
    usage?.damage_report_id ||
    usage?.damageReport?.id ||
    usage?.damage_report?.id ||
    "-"
  );
}

function getVehiclePlate(usage) {
  const report = usage?.damageReport || usage?.damage_report || {};
  return report?.vehicle?.plate_number || "-";
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

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [parts, setParts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [usages, setUsages] = useState([]);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState(1);
  const [stockDate, setStockDate] = useState(getTodayDate());
  const [note, setNote] = useState("");
  const [ref, setRef] = useState("");

  const loadInventory = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [partData, movementData] = await Promise.all([
        getPartsApi(search),
        getStockMovementsApi(50),
      ]);

      setParts(Array.isArray(partData) ? partData : []);
      setMovements(Array.isArray(movementData) ? movementData : []);
    } catch (error) {
      console.error("LOAD INVENTORY ERROR:", error);
      setMessage(`❌ ${getErrorMessage(error, "Gagal mengambil data inventory.")}`);
      setParts([]);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsages = async () => {
    try {
      setUsageLoading(true);

      const data = await getPartUsagesApi({
        status: "pending",
        limit: 100,
      });

      setUsages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("LOAD PART USAGES ERROR:", error);
      setMessage(`❌ ${getErrorMessage(error, "Gagal mengambil request sparepart.")}`);
      setUsages([]);
    } finally {
      setUsageLoading(false);
    }
  };

  const loadAll = async () => {
    await Promise.all([loadInventory(), loadUsages()]);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventory();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const resetPartForm = () => {
    setName("");
    setSku("");
    setStock("");
    setMinStock("");
    setBuyPrice("");
    setEditingId(null);
  };

  const handleSubmitPart = async (event) => {
    event.preventDefault();

    if (!name || !sku) {
      setMessage("❌ Nama sparepart dan SKU wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      if (editingId) {
        await updatePartApi(editingId, {
          name,
          sku,
          min_stock: Number(minStock || 0),
          buy_price: Number(buyPrice || 0),
        });

        setMessage("✅ Sparepart berhasil di-update.");
      } else {
        await createPartApi({
          name,
          sku,
          stock: Number(stock || 0),
          min_stock: Number(minStock || 0),
          buy_price: Number(buyPrice || 0),
        });

        setMessage("✅ Sparepart berhasil ditambahkan.");
      }

      resetPartForm();
      await loadInventory();
    } catch (error) {
      console.error("SAVE PART ERROR:", error);
      setMessage(`❌ ${getErrorMessage(error, "Gagal menyimpan sparepart.")}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPart = (part) => {
    setEditingId(part.id);
    setName(part.name || "");
    setSku(part.sku || "");
    setStock("");
    setMinStock(String(part.min_stock ?? 0));
    setBuyPrice(String(part.buy_price ?? 0));
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeletePart = async (id) => {
    if (!window.confirm("Hapus sparepart ini?")) return;

    try {
      setActionLoadingId(`delete-part-${id}`);
      setMessage("");

      await deletePartApi(id);

      if (editingId === id) {
        resetPartForm();
      }

      setMessage("✅ Sparepart berhasil dihapus.");
      await loadInventory();
    } catch (error) {
      console.error("DELETE PART ERROR:", error);
      setMessage(`❌ ${getErrorMessage(error, "Gagal menghapus sparepart.")}`);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleStockIn = async (event) => {
    event.preventDefault();

    if (!partId || Number(qty) < 1) {
      setMessage("❌ Pilih sparepart dan qty minimal 1.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await createStockInApi({
        part_id: partId,
        qty: Number(qty),
        date: stockDate,
        note,
        ref,
      });

      setPartId("");
      setQty(1);
      setStockDate(getTodayDate());
      setNote("");
      setRef("");

      setMessage("✅ Stok masuk berhasil diproses.");
      await loadInventory();
    } catch (error) {
      console.error("STOCK IN ERROR:", error);
      setMessage(`❌ ${getErrorMessage(error, "Gagal menambahkan stok masuk.")}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUsage = async (usage) => {
    const adminNote = window.prompt(
      "Catatan admin untuk approval sparepart (opsional):"
    );

    if (adminNote === null) return;

    if (
      !window.confirm(
        "Approve permintaan sparepart ini? Stok akan berkurang otomatis."
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(`approve-usage-${usage.id}`);
      setMessage("");

      await approvePartUsageApi(usage.id, {
        admin_note: adminNote || "",
      });

      setMessage("✅ Permintaan sparepart disetujui. Stok dan expense tercatat.");
      await loadAll();
    } catch (error) {
      console.error("APPROVE USAGE ERROR:", error);
      setMessage(`❌ ${getErrorMessage(error, "Gagal approve request sparepart.")}`);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRejectUsage = async (usage) => {
    const reason = window.prompt("Alasan penolakan sparepart:");

    if (reason === null) return;

    if (!window.confirm("Tolak permintaan sparepart ini?")) {
      return;
    }

    try {
      setActionLoadingId(`reject-usage-${usage.id}`);
      setMessage("");

      await rejectPartUsageApi(usage.id, {
        reason: reason || "",
      });

      setMessage("✅ Permintaan sparepart ditolak.");
      await loadUsages();
    } catch (error) {
      console.error("REJECT USAGE ERROR:", error);
      setMessage(`❌ ${getErrorMessage(error, "Gagal reject request sparepart.")}`);
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
              Sparepart Inventory
            </h1>
            <p className="text-sm text-white/45 mt-1">
              Kelola data sparepart, stok masuk, mutasi stok, dan approval request teknisi.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAll}
            disabled={loading || usageLoading}
            className="flex items-center gap-2 bg-djati-amber text-black font-bold rounded-lg px-4 py-2 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading || usageLoading ? "animate-spin" : ""}
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

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-djati-amber" />
                <h2 className="text-lg font-bold text-djati-amber">
                  {editingId ? "Edit Sparepart" : "Tambah Sparepart"}
                </h2>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetPartForm}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-xs font-bold"
                >
                  <X size={14} />
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitPart} className="grid gap-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama sparepart"
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
                required
              />

              <input
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                placeholder="SKU unik"
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
                required
              />

              <input
                type="number"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                placeholder={editingId ? "Stok tidak bisa diedit langsung" : "Stok awal"}
                disabled={Boolean(editingId)}
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber disabled:opacity-40"
              />

              <input
                type="number"
                value={minStock}
                onChange={(event) => setMinStock(event.target.value)}
                placeholder="Minimum stok"
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
              />

              <input
                type="number"
                value={buyPrice}
                onChange={(event) => setBuyPrice(event.target.value)}
                placeholder="Harga beli"
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-djati-amber text-black font-bold rounded-lg px-4 py-3 disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : editingId
                  ? "Update Sparepart"
                  : "Simpan Sparepart"}
              </button>
            </form>
          </div>

          <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <ArrowDownToLine size={20} className="text-djati-amber" />
              <h2 className="text-lg font-bold text-djati-amber">
                Stok Masuk / Restock
              </h2>
            </div>

            <form onSubmit={handleStockIn} className="grid gap-4">
              <select
                value={partId}
                onChange={(event) => setPartId(event.target.value)}
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
                required
              >
                <option value="">Pilih sparepart</option>
                {parts.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.sku} — {part.name} (stok: {part.stock})
                  </option>
                ))}
              </select>

              <input
                value="IN (Masuk)"
                disabled
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white/50 outline-none"
              />

              <input
                type="number"
                min="1"
                value={qty}
                onChange={(event) => setQty(event.target.value)}
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
                required
              />

              <input
                type="date"
                value={stockDate}
                onChange={(event) => setStockDate(event.target.value)}
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
              />

              <input
                value={ref}
                onChange={(event) => setRef(event.target.value)}
                placeholder="Ref / nomor dokumen"
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
              />

              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Catatan opsional"
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-djati-amber text-black font-bold rounded-lg px-4 py-3 disabled:opacity-50"
              >
                Proses Stok Masuk
              </button>
            </form>
          </div>
        </section>

        <section className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-djati-amber">
                Approval Permintaan Sparepart
              </h2>
              <p className="text-xs text-white/40 mt-1">
                Request sparepart dari teknisi yang masih menunggu approval.
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsages}
              disabled={usageLoading}
              className="bg-djati-amber text-black font-bold rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {usageLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-djati-amber text-black">
                <tr>
                  <th className="p-4 text-left font-bold">Tanggal</th>
                  <th className="p-4 text-left font-bold">Teknisi</th>
                  <th className="p-4 text-left font-bold">Laporan</th>
                  <th className="p-4 text-left font-bold">Plat</th>
                  <th className="p-4 text-left font-bold">Sparepart</th>
                  <th className="p-4 text-left font-bold">Qty</th>
                  <th className="p-4 text-left font-bold">Status</th>
                  <th className="p-4 text-left font-bold">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {usages.map((usage) => (
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

                    <td className="p-4 text-white/75">
                      {getVehiclePlate(usage)}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-white">
                        {usage.part?.sku || "-"}
                      </div>
                      <div className="text-xs text-white/40">
                        {usage.part?.name || "-"}
                      </div>
                    </td>

                    <td className="p-4 font-bold text-djati-amber">
                      {usage.qty || 0}
                    </td>

                    <td className="p-4">
                      <StatusBadge status={usage.status} />
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveUsage(usage)}
                          disabled={actionLoadingId === `approve-usage-${usage.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 text-xs font-bold disabled:opacity-50"
                        >
                          <Check size={13} />
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectUsage(usage)}
                          disabled={actionLoadingId === `reject-usage-${usage.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!usages.length && !usageLoading && (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-white/50">
                      Belum ada permintaan sparepart pending.
                    </td>
                  </tr>
                )}

                {usageLoading && !usages.length && (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-white/50">
                      Loading request sparepart...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-djati-amber">
                Daftar Sparepart
              </h2>
              <p className="text-xs text-white/40 mt-1">
                Data master sparepart dan stok tersedia.
              </p>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search nama / SKU..."
              className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-djati-amber w-full md:w-[260px]"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-djati-amber text-black">
                <tr>
                  <th className="p-4 text-left font-bold">SKU</th>
                  <th className="p-4 text-left font-bold">Nama</th>
                  <th className="p-4 text-left font-bold">Stok</th>
                  <th className="p-4 text-left font-bold">Min</th>
                  <th className="p-4 text-left font-bold">Harga Beli</th>
                  <th className="p-4 text-left font-bold">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {parts.map((part) => {
                  const isLowStock =
                    Number(part.stock || 0) <= Number(part.min_stock || 0);

                  return (
                    <tr
                      key={part.id}
                      className="border-t border-white/10 hover:bg-white/[0.03]"
                    >
                      <td className="p-4 font-bold text-white">{part.sku}</td>
                      <td className="p-4 text-white/75">{part.name}</td>

                      <td
                        className={`p-4 font-bold ${
                          isLowStock ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {part.stock}
                      </td>

                      <td className="p-4 text-white/75">{part.min_stock}</td>

                      <td className="p-4 text-djati-amber font-bold">
                        Rp {formatCurrency(part.buy_price)}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditPart(part)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-djati-amber/40 text-djati-amber hover:bg-djati-amber/10 text-xs font-bold"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePart(part.id)}
                            disabled={actionLoadingId === `delete-part-${part.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!parts.length && !loading && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-white/50">
                      Belum ada data sparepart.
                    </td>
                  </tr>
                )}

                {loading && !parts.length && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-white/50">
                      Loading sparepart...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-bold text-djati-amber mb-5">
            Log Mutasi Stok
          </h2>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-djati-amber text-black">
                <tr>
                  <th className="p-4 text-left font-bold">Tanggal</th>
                  <th className="p-4 text-left font-bold">Sparepart</th>
                  <th className="p-4 text-left font-bold">SKU</th>
                  <th className="p-4 text-left font-bold">Type</th>
                  <th className="p-4 text-left font-bold">Qty</th>
                  <th className="p-4 text-left font-bold">Note</th>
                </tr>
              </thead>

              <tbody>
                {movements.slice(0, 10).map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-t border-white/10 hover:bg-white/[0.03]"
                  >
                    <td className="p-4 text-white/75">
                      {formatDate(
                        movement.date ||
                          movement.movement_date ||
                          movement.created_at
                      )}
                    </td>

                    <td className="p-4 text-white/75">
                      {movement.part?.name || "-"}
                    </td>

                    <td className="p-4 font-bold text-white">
                      {movement.part?.sku || "-"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.68rem] font-bold uppercase border ${
                          movement.type === "IN"
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        {movement.type}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-djati-amber">
                      {movement.qty}
                    </td>

                    <td className="p-4 text-white/60">
                      {movement.note || "-"}
                      {movement.ref && (
                        <span className="text-white/35">
                          {" "}
                          (ref: {movement.ref})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {!movements.length && !loading && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-white/50">
                      Belum ada mutasi stok.
                    </td>
                  </tr>
                )}

                {loading && !movements.length && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-white/50">
                      Loading mutasi stok...
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