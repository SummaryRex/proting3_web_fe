import { useEffect, useState } from "react";
import {
  Package,
  Pencil,
  Trash2,
  X,
  ArrowDownToLine,
  Check,
  XCircle,
  Search,
  ClipboardCheck,
  Boxes,
  AlertTriangle,
  History,
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

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0f1117] px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10 disabled:cursor-not-allowed disabled:opacity-40";

const smallButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

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

function getFriendlyErrorMessage(error, fallback) {
  const serverMessage = error?.response?.data?.message;

  const message = String(serverMessage || "").toLowerCase();

  const isTechnicalMessage =
    message.includes("localhost") ||
    message.includes("127.0.0.1") ||
    message.includes("endpoint") ||
    message.includes("network error") ||
    message.includes("request failed") ||
    message.includes("axios") ||
    message.includes("http://") ||
    message.includes("https://");

  if (serverMessage && !isTechnicalMessage) {
    return serverMessage;
  }

  return fallback;
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

function normalizeStatus(status) {
  const value = String(status || "pending").toLowerCase();

  if (value === "requested") return "pending";
  if (value === "approved") return "approved";
  if (value === "rejected") return "rejected";

  return value;
}

function getStatusLabel(status) {
  const normalized = normalizeStatus(status);

  const labels = {
    pending: "Menunggu",
    requested: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return labels[normalized] || normalized;
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  const className =
    normalized === "approved"
      ? "border-green-500/30 bg-green-500/10 text-green-400"
      : normalized === "rejected"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase ${className}`}
    >
      {getStatusLabel(normalized)}
    </span>
  );
}

function getMovementTypeLabel(type) {
  const value = String(type || "").toUpperCase();

  if (value === "IN") return "Masuk";
  if (value === "OUT") return "Keluar";

  return type || "-";
}

function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const colorClass =
    notification.type === "success"
      ? "border-green-500/40 bg-green-500/10 text-green-400"
      : notification.type === "warning"
      ? "border-djati-amber/40 bg-djati-amber/10 text-djati-amber"
      : "border-red-500/40 bg-red-500/10 text-red-400";

  const title =
    notification.type === "success"
      ? "Berhasil"
      : notification.type === "warning"
      ? "Perhatian"
      : "Terjadi Kendala";

  return (
    <div className="fixed right-5 top-5 z-[9999] w-[340px] max-w-[calc(100vw-2rem)]">
      <div
        className={`rounded-2xl border bg-[#171a23] px-4 py-3 shadow-2xl backdrop-blur ${colorClass}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
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

function ActionDialog({
  open,
  title,
  description,
  confirmText,
  cancelText = "Batal",
  tone = "red",
  loading = false,
  noteLabel,
  notePlaceholder,
  onConfirm,
  onCancel,
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setNote("");
    }
  }, [open]);

  if (!open) return null;

  const confirmClass =
    tone === "green"
      ? "border-green-500/40 text-green-400 hover:bg-green-500/10"
      : "border-red-500/40 text-red-400 hover:bg-red-500/10";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171a23] p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-djati-amber">{title}</h3>

        {description && (
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            {description}
          </p>
        )}

        {noteLabel && (
          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/45">
              {noteLabel}
            </span>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={notePlaceholder || "Tulis catatan di sini..."}
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#0f1117] px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
            />
          </label>
        )}

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
            onClick={() => onConfirm(note)}
            disabled={loading}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#171a23]/95 shadow-2xl shadow-black/20 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description, right }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="rounded-xl border border-djati-amber/20 bg-djati-amber/10 p-2 text-djati-amber">
            <Icon size={18} />
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>

          {description && (
            <p className="mt-1 text-xs leading-relaxed text-white/45">
              {description}
            </p>
          )}
        </div>
      </div>

      {right}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/45">
        {label}
      </span>

      {children}
    </label>
  );
}

function SummaryCard({ icon: Icon, label, value, hint, tone = "amber" }) {
  const toneClass =
    tone === "red"
      ? "border-red-500/20 bg-red-500/10 text-red-400"
      : tone === "green"
      ? "border-green-500/20 bg-green-500/10 text-green-400"
      : "border-djati-amber/20 bg-djati-amber/10 text-djati-amber";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            {label}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-white">{value}</p>

          {hint && <p className="mt-1 text-xs text-white/35">{hint}</p>}
        </div>

        <div className={`rounded-2xl border p-3 ${toneClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

function TableShell({ children, minWidth = "min-w-[860px]" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth} text-sm`}>{children}</table>
      </div>
    </div>
  );
}

function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-8 text-center text-sm text-white/45"
      >
        {children}
      </td>
    </tr>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");

  const [notification, setNotification] = useState(null);
  const [dialog, setDialog] = useState(null);

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

  const lowStockCount = parts.filter(
    (part) => Number(part.stock || 0) <= Number(part.min_stock || 0)
  ).length;

  const totalStock = parts.reduce(
    (total, part) => total + Number(part.stock || 0),
    0
  );

  const loadInventory = async () => {
    try {
      setLoading(true);

      const [partData, movementData] = await Promise.all([
        getPartsApi(search),
        getStockMovementsApi(50),
      ]);

      setParts(Array.isArray(partData) ? partData : []);
      setMovements(Array.isArray(movementData) ? movementData : []);
    } catch (error) {
      console.error("GAGAL MENGAMBIL DATA INVENTARIS:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Data inventaris belum dapat dimuat. Periksa koneksi atau coba beberapa saat lagi."
        )
      );

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
      console.error("GAGAL MENGAMBIL PERMINTAAN SUKU CADANG:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Permintaan suku cadang belum dapat dimuat. Silakan coba kembali."
        )
      );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventory();
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      showNotification("warning", "Nama suku cadang dan SKU wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await updatePartApi(editingId, {
          name,
          sku,
          min_stock: Number(minStock || 0),
          buy_price: Number(buyPrice || 0),
        });

        showNotification("success", "Data suku cadang berhasil diperbarui.");
      } else {
        await createPartApi({
          name,
          sku,
          stock: Number(stock || 0),
          min_stock: Number(minStock || 0),
          buy_price: Number(buyPrice || 0),
        });

        showNotification("success", "Suku cadang berhasil ditambahkan.");
      }

      resetPartForm();
      await loadInventory();
    } catch (error) {
      console.error("GAGAL MENYIMPAN SUKU CADANG:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Data suku cadang belum dapat disimpan. Periksa kembali data yang diisi."
        )
      );
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeletePart = (id) => {
    setDialog({
      type: "delete-part",
      payload: { id },
      title: "Hapus Suku Cadang",
      description:
        "Apakah Anda yakin ingin menghapus suku cadang ini? Data yang sudah dihapus tidak dapat dikembalikan.",
      confirmText: "Ya, Hapus",
      tone: "red",
    });
  };

  const handleStockIn = async (event) => {
    event.preventDefault();

    if (!partId || Number(qty) < 1) {
      showNotification("warning", "Pilih suku cadang dan jumlah minimal 1.");
      return;
    }

    try {
      setLoading(true);

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

      showNotification("success", "Stok masuk berhasil diproses.");
      await loadInventory();
    } catch (error) {
      console.error("GAGAL MENAMBAHKAN STOK MASUK:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Stok masuk belum dapat diproses. Periksa kembali data yang diisi."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUsage = (usage) => {
    setDialog({
      type: "approve-usage",
      payload: { usage },
      title: "Setujui Permintaan Suku Cadang",
      description:
        "Permintaan ini akan disetujui. Stok akan berkurang otomatis dan biaya akan tercatat pada sistem.",
      noteLabel: "Catatan Admin",
      notePlaceholder: "Tambahkan catatan persetujuan jika diperlukan...",
      confirmText: "Setujui Permintaan",
      tone: "green",
    });
  };

  const handleRejectUsage = (usage) => {
    setDialog({
      type: "reject-usage",
      payload: { usage },
      title: "Tolak Permintaan Suku Cadang",
      description:
        "Permintaan ini akan ditolak dan teknisi dapat melihat status penolakannya.",
      noteLabel: "Alasan Penolakan",
      notePlaceholder: "Tuliskan alasan penolakan jika diperlukan...",
      confirmText: "Tolak Permintaan",
      tone: "red",
    });
  };

  const closeDialog = () => {
    if (actionLoadingId) return;
    setDialog(null);
  };

  const handleConfirmDialog = async (dialogNote = "") => {
    if (!dialog) return;

    try {
      if (dialog.type === "delete-part") {
        const id = dialog.payload.id;

        setActionLoadingId(`delete-part-${id}`);

        await deletePartApi(id);

        if (editingId === id) {
          resetPartForm();
        }

        showNotification("success", "Suku cadang berhasil dihapus.");
        setDialog(null);

        await loadInventory();
      }

      if (dialog.type === "approve-usage") {
        const usage = dialog.payload.usage;

        setActionLoadingId(`approve-usage-${usage.id}`);

        await approvePartUsageApi(usage.id, {
          admin_note: dialogNote || "",
        });

        showNotification(
          "success",
          "Permintaan suku cadang disetujui. Stok dan biaya berhasil tercatat."
        );

        setDialog(null);
        await loadAll();
      }

      if (dialog.type === "reject-usage") {
        const usage = dialog.payload.usage;

        setActionLoadingId(`reject-usage-${usage.id}`);

        await rejectPartUsageApi(usage.id, {
          reason: dialogNote || "",
        });

        showNotification(
          "success",
          "Permintaan suku cadang berhasil ditolak."
        );

        setDialog(null);
        await loadUsages();
      }
    } catch (error) {
      console.error("GAGAL MEMPROSES AKSI INVENTARIS:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Aksi belum dapat diproses. Silakan coba kembali."
        )
      );
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      <Sidebar />

      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <ActionDialog
        open={Boolean(dialog)}
        title={dialog?.title}
        description={dialog?.description}
        confirmText={dialog?.confirmText}
        tone={dialog?.tone}
        noteLabel={dialog?.noteLabel}
        notePlaceholder={dialog?.notePlaceholder}
        loading={Boolean(actionLoadingId)}
        onConfirm={handleConfirmDialog}
        onCancel={closeDialog}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%)] p-5 md:p-7">
          <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 to-[#171717]/95 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-djati-amber/80">
              MANAJEMEN INVENTARIS
            </p>

            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              Inventaris Suku Cadang
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
              Kelola data suku cadang, stok masuk, mutasi stok, dan persetujuan
              permintaan teknisi dalam satu halaman.
            </p>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Boxes}
              label="Total Suku Cadang"
              value={parts.length}
              hint="Item master terdaftar"
            />

            <SummaryCard
              icon={Package}
              label="Total Stok"
              value={totalStock}
              hint="Akumulasi stok tersedia"
              tone="green"
            />

            <SummaryCard
              icon={AlertTriangle}
              label="Stok Rendah"
              value={lowStockCount}
              hint="Di bawah atau sama dengan minimum"
              tone={lowStockCount > 0 ? "red" : "green"}
            />

            <SummaryCard
              icon={ClipboardCheck}
              label="Permintaan Menunggu"
              value={usages.length}
              hint="Menunggu persetujuan admin"
            />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <SectionHeader
                icon={Package}
                title={editingId ? "Edit Sparepart" : "Tambah Suku Cadang Baru"}
                description="Isi data suku cadang dengan SKU unik agar mudah dicari dan dilacak."
                right={
                  editingId && (
                    <button
                      type="button"
                      onClick={resetPartForm}
                      className={`${smallButtonClass} border border-white/10 text-white/60 hover:bg-white/5`}
                    >
                      <X size={14} />
                      Batal Edit
                    </button>
                  )
                }
              />

              <form
                onSubmit={handleSubmitPart}
                className="grid gap-4 md:grid-cols-2"
              >
                <FormField label="Nama Sparepart">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Contoh: Filter Oli"
                    className={inputClass}
                    required
                  />
                </FormField>

                <FormField label="SKU">
                  <input
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    placeholder="Contoh: SP-001"
                    className={inputClass}
                    required
                  />
                </FormField>

                <FormField label="Stok Awal">
                  <input
                    type="number"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    placeholder={editingId ? "Tidak bisa diedit langsung" : "0"}
                    disabled={Boolean(editingId)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Minimum Stok">
                  <input
                    type="number"
                    value={minStock}
                    onChange={(event) => setMinStock(event.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Harga Beli">
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(event) => setBuyPrice(event.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </FormField>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-djati-amber px-4 py-3 text-sm font-extrabold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Menyimpan..."
                      : editingId
                      ? "Perbarui Sparepart"
                      : "Simpan Sparepart"}
                  </button>
                </div>
              </form>
            </Card>

            <Card className="p-5">
              <SectionHeader
                icon={ArrowDownToLine}
                title="Stok Masuk"
                description="Gunakan form ini untuk menambahkan stok tanpa mengubah stok master secara manual."
              />

              <form onSubmit={handleStockIn} className="grid gap-4 md:grid-cols-2">
                <FormField label="Sparepart">
                  <select
                    value={partId}
                    onChange={(event) => setPartId(event.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Pilih sparepart</option>

                    {parts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.sku} — {part.name} (stok: {part.stock})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Tipe Mutasi">
                  <input value="Masuk" disabled className={inputClass} />
                </FormField>

                <FormField label="Jumlah">
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                    className={inputClass}
                    required
                  />
                </FormField>

                <FormField label="Tanggal">
                  <input
                    type="date"
                    value={stockDate}
                    onChange={(event) => setStockDate(event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Referensi / Nomor Dokumen">
                  <input
                    value={ref}
                    onChange={(event) => setRef(event.target.value)}
                    placeholder="Opsional"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Catatan">
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Opsional"
                    className={inputClass}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-djati-amber px-4 py-3 text-sm font-extrabold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Memproses..." : "Proses Stok Masuk"}
                  </button>
                </div>
              </form>
            </Card>
          </section>

          <Card className="p-5">
            <SectionHeader
              icon={ClipboardCheck}
              title="Persetujuan Permintaan Suku Cadang"
              description="Permintaan sparepart dari teknisi yang masih menunggu persetujuan admin."
            />

            <TableShell minWidth="min-w-[980px]">
              <thead className="bg-djati-amber text-black">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Tanggal</th>
                  <th className="px-4 py-3 text-left font-bold">Teknisi</th>
                  <th className="px-4 py-3 text-left font-bold">Laporan</th>
                  <th className="px-4 py-3 text-left font-bold">Nomor Polisi</th>
                  <th className="px-4 py-3 text-left font-bold">Sparepart</th>
                  <th className="px-4 py-3 text-left font-bold">Jumlah</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-left font-bold">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 bg-[#171717]">
                {usages.map((usage) => (
                  <tr key={usage.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-4 py-4 text-white/70">
                      {formatDate(usage.created_at)}
                    </td>

                    <td className="px-4 py-4 text-white/70">
                      {getUserName(usage.technician)}
                    </td>

                    <td className="px-4 py-4 text-white/70">
                      #{getDamageReportId(usage)}
                    </td>

                    <td className="px-4 py-4 text-white/70">
                      {getVehiclePlate(usage)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-white">
                        {usage.part?.sku || "-"}
                      </div>

                      <div className="mt-1 text-xs text-white/40">
                        {usage.part?.name || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold text-djati-amber">
                      {usage.qty || 0}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={usage.status} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveUsage(usage)}
                          disabled={actionLoadingId === `approve-usage-${usage.id}`}
                          className={`${smallButtonClass} border border-green-500/40 text-green-400 hover:bg-green-500/10`}
                        >
                          <Check size={13} />
                          Setujui
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectUsage(usage)}
                          disabled={actionLoadingId === `reject-usage-${usage.id}`}
                          className={`${smallButtonClass} border border-red-500/40 text-red-400 hover:bg-red-500/10`}
                        >
                          <XCircle size={13} />
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!usages.length && !usageLoading && (
                  <EmptyRow colSpan={8}>
                    Belum ada permintaan sparepart yang menunggu persetujuan.
                  </EmptyRow>
                )}

                {usageLoading && (
                  <EmptyRow colSpan={8}>
                    Memuat permintaan suku cadang...
                  </EmptyRow>
                )}
              </tbody>
            </TableShell>
          </Card>

          <Card className="p-5">
            <SectionHeader
              icon={Search}
              title="Daftar Suku Cadang"
              description="Data master suku cadang dan stok yang tersedia."
              right={
                <div className="relative w-full sm:w-[280px]">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari nama atau SKU..."
                    className="w-full rounded-xl border border-white/10 bg-[#0f1117] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
                  />
                </div>
              }
            />

            <TableShell minWidth="min-w-[820px]">
              <thead className="bg-djati-amber text-black">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">SKU</th>
                  <th className="px-4 py-3 text-left font-bold">
                    Nama Suku Cadang
                  </th>
                  <th className="px-4 py-3 text-left font-bold">Stok</th>
                  <th className="px-4 py-3 text-left font-bold">Minimum</th>
                  <th className="px-4 py-3 text-left font-bold">Harga Beli</th>
                  <th className="px-4 py-3 text-left font-bold">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 bg-[#171717]">
                {parts.map((part) => {
                  const isLowStock =
                    Number(part.stock || 0) <= Number(part.min_stock || 0);

                  return (
                    <tr key={part.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-bold text-white">
                        {part.sku}
                      </td>

                      <td className="px-4 py-4 text-white/70">
                        {part.name}
                      </td>

                      <td
                        className={`px-4 py-4 font-bold ${
                          isLowStock ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {part.stock}
                      </td>

                      <td className="px-4 py-4 text-white/70">
                        {part.min_stock}
                      </td>

                      <td className="px-4 py-4 font-bold text-djati-amber">
                        Rp {formatCurrency(part.buy_price)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditPart(part)}
                            className={`${smallButtonClass} border border-djati-amber/40 text-djati-amber hover:bg-djati-amber/10`}
                          >
                            <Pencil size={13} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePart(part.id)}
                            disabled={actionLoadingId === `delete-part-${part.id}`}
                            className={`${smallButtonClass} border border-red-500/40 text-red-400 hover:bg-red-500/10`}
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
                  <EmptyRow colSpan={6}>Belum ada data sparepart.</EmptyRow>
                )}

                {loading && (
                  <EmptyRow colSpan={6}>Memuat data sparepart...</EmptyRow>
                )}
              </tbody>
            </TableShell>
          </Card>

          <Card className="p-5">
            <SectionHeader
              icon={History}
              title="Riwayat Mutasi Stok"
              description="Menampilkan 10 mutasi stok terbaru."
            />

            <TableShell minWidth="min-w-[820px]">
              <thead className="bg-djati-amber text-black">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Tanggal</th>
                  <th className="px-4 py-3 text-left font-bold">Suku Cadang</th>
                  <th className="px-4 py-3 text-left font-bold">SKU</th>
                  <th className="px-4 py-3 text-left font-bold">Tipe</th>
                  <th className="px-4 py-3 text-left font-bold">Jumlah</th>
                  <th className="px-4 py-3 text-left font-bold">Catatan</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 bg-[#171717]">
                {movements.slice(0, 10).map((movement) => (
                  <tr key={movement.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-4 py-4 text-white/70">
                      {formatDate(
                        movement.date ||
                          movement.movement_date ||
                          movement.created_at
                      )}
                    </td>

                    <td className="px-4 py-4 text-white/70">
                      {movement.part?.name || "-"}
                    </td>

                    <td className="px-4 py-4 font-bold text-white">
                      {movement.part?.sku || "-"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase ${
                          movement.type === "IN"
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-red-500/30 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {getMovementTypeLabel(movement.type)}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-bold text-djati-amber">
                      {movement.qty}
                    </td>

                    <td className="px-4 py-4 text-white/60">
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
                  <EmptyRow colSpan={6}>Belum ada riwayat mutasi stok.</EmptyRow>
                )}

                {loading && (
                  <EmptyRow colSpan={6}>Memuat riwayat mutasi stok...</EmptyRow>
                )}
              </tbody>
            </TableShell>
          </Card>
          </div>
        </div>
      </main>
    </div>
  );
}