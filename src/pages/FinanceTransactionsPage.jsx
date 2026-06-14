import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import Sidebar from "../components/Sidebar";

import {
  getFinanceTransactionsApi,
  createFinanceTransactionApi,
  updateFinanceTransactionApi,
  deleteFinanceTransactionApi,
} from "../services/api";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

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

function getFriendlyErrorMessage(error, fallback) {
  const serverMessage = error?.response?.data?.message;

  if (
    serverMessage &&
    !String(serverMessage).toLowerCase().includes("localhost") &&
    !String(serverMessage).toLowerCase().includes("127.0.0.1") &&
    !String(serverMessage).toLowerCase().includes("endpoint") &&
    !String(serverMessage).toLowerCase().includes("network error") &&
    !String(serverMessage).toLowerCase().includes("request failed")
  ) {
    return serverMessage;
  }

  return fallback;
}

function getSourceLabel(source) {
  const labels = {
    manual: "Manual",
    repair: "Perbaikan",
    inventory: "Catatan / Suku Cadang",
  };

  return labels[source] || source || "-";
}

function getTypeLabel(type) {
  if (type === "income") return "Dana Masuk";
  if (type === "expense") return "Biaya Keluar";
  return type || "-";
}

function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const styleClass =
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
    <div className="fixed top-5 right-5 z-[9999] w-[340px] max-w-[calc(100vw-2rem)]">
      <div
        className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur bg-[#171a23] ${styleClass}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold">{title}</h4>
            <p className="text-xs leading-relaxed mt-1 opacity-90">
              {notification.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-lg leading-none opacity-70 hover:opacity-100"
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
  message,
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

        <p className="text-sm text-white/60 leading-relaxed mt-2">
          {message}
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 text-sm font-bold disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-bold disabled:opacity-50"
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, tone = "amber", description }) {
  const toneClass =
    tone === "green"
      ? "text-green-400 bg-green-500/10 border-green-500/20"
      : tone === "red"
      ? "text-red-400 bg-red-500/10 border-red-500/20"
      : "text-djati-amber bg-djati-amber/10 border-djati-amber/20";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-white/45 text-[0.72rem] font-bold uppercase tracking-[0.12em]">
            {title}
          </p>

          <h3 className="text-2xl font-extrabold text-white mt-2">
            Rp {formatCurrency(value)}
          </h3>

          {description && (
            <p className="text-xs text-white/35 mt-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${toneClass}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

export default function FinanceTransactionsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [summaryTransactions, setSummaryTransactions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState(null);

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

  const loadTransactions = async (override = {}) => {
    const activeMonth = override.month ?? month;
    const activeType = override.type ?? typeFilter;
    const activeSource = override.source ?? sourceFilter;

    try {
      setLoading(true);

      const [tableData, summaryData] = await Promise.all([
        getFinanceTransactionsApi({
          month: activeMonth,
          type: activeType,
          source: activeSource,
        }),

        getFinanceTransactionsApi({
          month: activeMonth,
        }),
      ]);

      setTransactions(Array.isArray(tableData) ? tableData : []);
      setSummaryTransactions(Array.isArray(summaryData) ? summaryData : []);
    } catch (error) {
      console.error("GAGAL MENGAMBIL DATA DANA PERBAIKAN:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Data dana perbaikan belum dapat dimuat. Periksa koneksi atau coba beberapa saat lagi."
        )
      );

      setTransactions([]);
      setSummaryTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, typeFilter, sourceFilter]);

  const summary = useMemo(() => {
    const danaMasuk = summaryTransactions
      .filter((item) => item.type === "income")
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    const biayaKeluar = summaryTransactions
      .filter((item) => item.type === "expense")
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    return {
      danaMasuk,
      biayaKeluar,
      sisaDana: danaMasuk - biayaKeluar,
    };
  }, [summaryTransactions]);

  const resetForm = () => {
    setCategory("");
    setAmount("");
    setDate(getTodayDate());
    setNote("");
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!category || !amount || !date) {
      showNotification(
        "warning",
        "Kategori dana, nominal, dan tanggal wajib diisi."
      );
      return;
    }

    try {
      setLoading(true);

      const selectedMonth = String(date).slice(0, 7);

      if (editingId) {
        await updateFinanceTransactionApi(editingId, {
          category,
          amount: Number(amount),
          date,
          note,
        });

        showNotification("success", "Dana masuk berhasil diperbarui.");
      } else {
        await createFinanceTransactionApi({
          type: "income",
          category,
          amount: Number(amount),
          date,
          note,
          source: "manual",
        });

        showNotification("success", "Dana masuk berhasil ditambahkan.");
      }

      resetForm();

      setMonth(selectedMonth);
      setTypeFilter("");
      setSourceFilter("");

      await loadTransactions({
        month: selectedMonth,
        type: "",
        source: "",
      });
    } catch (error) {
      console.error("GAGAL MENYIMPAN DANA MASUK:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Dana masuk belum dapat disimpan. Periksa kembali data yang diisi."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction) => {
    if (transaction.type !== "income" || transaction.locked) {
      return;
    }

    setEditingId(transaction.id);
    setCategory(transaction.category || "");
    setAmount(String(Number(transaction.amount || 0)));
    setDate(String(transaction.date || getTodayDate()).slice(0, 10));
    setNote(transaction.note || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = (transaction) => {
    if (transaction.type !== "income" || transaction.locked) {
      return;
    }

    setDeleteTarget(transaction);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) {
      showNotification("warning", "Data dana masuk tidak ditemukan.");
      return;
    }

    try {
      setActionLoadingId(`delete-${deleteTarget.id}`);

      await deleteFinanceTransactionApi(deleteTarget.id);

      showNotification("success", "Dana masuk berhasil dihapus.");
      setDeleteTarget(null);

      await loadTransactions();
    } catch (error) {
      console.error("GAGAL MENGHAPUS DANA MASUK:", error);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          error,
          "Dana masuk belum dapat dihapus. Silakan coba kembali."
        )
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const isEditing = Boolean(editingId);

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      <Sidebar />

      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Dana Masuk"
        message="Apakah Anda yakin ingin menghapus data dana masuk ini? Data yang sudah dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={Boolean(actionLoadingId)}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%)] p-5 md:p-7">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 to-[#171717]/95 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-djati-amber/80">
                FINANCE MONITORING
              </p>

              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Dana Perbaikan Bengkel
              </h1>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">
                Kelola alokasi dana perbaikan, reimburse operasional, serta
                biaya keluar otomatis dari aktivitas perbaikan dan inventaris.
              </p>
            </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            title="Dana Masuk"
            value={summary.danaMasuk}
            icon={TrendingUp}
            tone="green"
            description="Alokasi atau reimburse manual dari perusahaan."
          />

          <SummaryCard
            title="Biaya Keluar"
            value={summary.biayaKeluar}
            icon={TrendingDown}
            tone="red"
            description="Biaya otomatis dari perbaikan dan pemakaian sparepart."
          />

          <SummaryCard
            title="Sisa Dana"
            value={summary.sisaDana}
            icon={Wallet}
            tone="amber"
            description="Selisih antara dana masuk dan biaya perbaikan."
          />
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-[#171a23]/95 p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-djati-amber">
                {isEditing ? "Edit Dana Masuk" : "Input Dana Masuk"}
              </h2>

              <p className="text-xs text-white/40 mt-1 max-w-2xl">
                Dana masuk manual berasal dari alokasi dana perbaikan,
                reimburse, atau kas operasional bengkel.
              </p>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-xs font-bold w-fit"
              >
                <X size={14} />
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                  Kategori Dana
                </label>

                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Contoh: Alokasi Dana Perbaikan"
                  className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                  Nominal Dana
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Masukkan nominal"
                  className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                  Catatan
                </label>

                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Catatan opsional"
                  className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5">
              <p className="text-xs text-white/35">
                Biaya keluar dari perbaikan dan inventaris tetap tercatat
                otomatis, sehingga tidak perlu diinput manual.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="bg-djati-amber text-black font-bold rounded-xl px-5 py-3 disabled:opacity-50 min-w-[190px]"
              >
                {loading
                  ? "Menyimpan..."
                  : isEditing
                  ? "Perbarui Dana Masuk"
                  : "Simpan Dana Masuk"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#171a23]/95 p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-djati-amber">
                Laporan Dana Perbaikan
              </h2>

              <p className="text-xs text-white/40 mt-1 max-w-2xl">
                Menampilkan riwayat dana masuk dan biaya keluar. Biaya otomatis
                dari perbaikan dan inventaris tidak bisa diedit atau dihapus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
              />

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
              >
                <option value="">Semua Jenis</option>
                <option value="income">Dana Masuk</option>
                <option value="expense">Biaya Keluar</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-djati-amber focus:ring-4 focus:ring-djati-amber/10"
              >
                <option value="">Semua Sumber</option>
                <option value="manual">Manual</option>
                <option value="repair">Perbaikan</option>
                <option value="inventory">Inventaris</option>
              </select>
            </div>
          </div>

          {typeFilter || sourceFilter ? (
            <div className="mb-4 rounded-xl border border-djati-amber/25 bg-djati-amber/10 px-4 py-3 text-xs text-djati-amber">
              Tabel sedang difilter. Ringkasan di atas tetap menghitung semua
              dana pada bulan yang dipilih.
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm min-w-[980px]">
              <thead className="bg-djati-amber text-black">
                <tr>
                  <th className="p-4 text-left font-bold">Tanggal</th>
                  <th className="p-4 text-left font-bold">Jenis</th>
                  <th className="p-4 text-left font-bold">Kategori</th>
                  <th className="p-4 text-left font-bold">Nominal</th>
                  <th className="p-4 text-left font-bold">Sumber</th>
                  <th className="p-4 text-left font-bold">Catatan / Ref</th>
                  <th className="p-4 text-left font-bold">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => {
                  const isDanaMasuk = transaction.type === "income";
                  const canModify = isDanaMasuk && !transaction.locked;

                  return (
                    <tr
                      key={transaction.id}
                      className="border-t border-white/10 hover:bg-white/[0.03]"
                    >
                      <td className="p-4 text-white/80 whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-[0.68rem] font-bold uppercase border ${
                            isDanaMasuk
                              ? "bg-green-500/10 text-green-400 border-green-500/25"
                              : "bg-red-500/10 text-red-400 border-red-500/25"
                          }`}
                        >
                          {getTypeLabel(transaction.type)}
                          {!isDanaMasuk ? " Otomatis" : ""}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {transaction.category || "-"}
                        </div>

                        <div className="text-xs text-white/35 mt-1">
                          {transaction.locked ? "Terkunci / Otomatis" : "Manual"}
                        </div>
                      </td>

                      <td className="p-4 font-bold text-djati-amber whitespace-nowrap">
                        Rp {formatCurrency(transaction.amount)}
                      </td>

                      <td className="p-4 text-white/70">
                        {getSourceLabel(transaction.source)}
                      </td>

                      <td className="p-4 max-w-[320px]">
                        <div className="text-white/70 line-clamp-2">
                          {transaction.note || "-"}
                        </div>

                        {transaction.ref && (
                          <div className="text-xs text-white/35 mt-1">
                            Referensi: {transaction.ref}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {canModify ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(transaction)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-djati-amber/40 text-djati-amber hover:bg-djati-amber/10 text-xs font-bold"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(transaction)}
                              disabled={
                                actionLoadingId === `delete-${transaction.id}`
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-white/35">
                            Otomatis
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!transactions.length && !loading && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-white/50">
                      Tidak ada data dana perbaikan.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-white/50">
                      Memuat data dana perbaikan...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
          </div>
        </div>
      </main>
    </div>
  );
}