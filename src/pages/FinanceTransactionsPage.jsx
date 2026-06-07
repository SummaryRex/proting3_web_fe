import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
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

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function SummaryCard({ title, value, icon: Icon, tone = "amber" }) {
  const toneClass =
    tone === "green"
      ? "text-green-400 bg-green-500/10"
      : tone === "red"
      ? "text-red-400 bg-red-500/10"
      : "text-djati-amber bg-djati-amber/10";

  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/45 text-[0.78rem] font-semibold uppercase tracking-wide">
          {title}
        </p>

        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneClass}`}>
          <Icon size={18} />
        </div>
      </div>

      <h3 className="text-2xl font-extrabold text-white">
        Rp {formatCurrency(value)}
      </h3>
    </div>
  );
}

export default function FinanceTransactionsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const data = await getFinanceTransactionsApi({
        month,
        type: typeFilter,
        source: sourceFilter,
      });

      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("LOAD FINANCE TRANSACTIONS ERROR:", error);

      setMessage(
        `❌ ${getErrorMessage(
          error,
          "Gagal mengambil data transaksi."
        )}`
      );

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [month, typeFilter, sourceFilter]);

  const summary = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      );

    const expense = transactions
      .filter((item) => item.type === "expense")
      .reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      );

    return {
      income,
      expense,
      net: income - expense,
    };
  }, [transactions]);

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
      setMessage("❌ Category, nominal, dan tanggal wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      if (editingId) {
        await updateFinanceTransactionApi(editingId, {
          category,
          amount: Number(amount),
          date,
          note,
        });

        setMessage("✅ Income berhasil diupdate.");
      } else {
        await createFinanceTransactionApi({
          type: "income",
          category,
          amount: Number(amount),
          date,
          note,
          source: "manual",
        });

        setMessage("✅ Income berhasil ditambahkan.");
      }

      resetForm();
      await loadTransactions();
    } catch (error) {
      console.error("SAVE FINANCE TRANSACTION ERROR:", error);

      setMessage(
        `❌ ${getErrorMessage(
          error,
          "Gagal menyimpan transaksi."
        )}`
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
    setMessage("");
  };

  const handleDelete = async (transaction) => {
    if (transaction.type !== "income" || transaction.locked) {
      return;
    }

    if (!window.confirm("Hapus income ini?")) {
      return;
    }

    try {
      setActionLoadingId(`delete-${transaction.id}`);
      setMessage("");

      await deleteFinanceTransactionApi(transaction.id);

      setMessage("✅ Income berhasil dihapus.");
      await loadTransactions();
    } catch (error) {
      console.error("DELETE FINANCE TRANSACTION ERROR:", error);

      setMessage(
        `❌ ${getErrorMessage(
          error,
          "Gagal menghapus transaksi."
        )}`
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const isEditing = Boolean(editingId);

  return (
    <div className="flex min-h-screen bg-[#121212]">
      <Sidebar />

      <main className="flex-1 p-6 text-white overflow-x-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-djati-amber">
              Finance Transactions
            </h1>

            <p className="text-sm text-white/45 mt-1">
              Kelola income manual dan lihat expense otomatis dari repair atau inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={loadTransactions}
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

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            title="Income"
            value={summary.income}
            icon={TrendingUp}
            tone="green"
          />

          <SummaryCard
            title="Expense"
            value={summary.expense}
            icon={TrendingDown}
            tone="red"
          />

          <SummaryCard
            title="Net"
            value={summary.net}
            icon={Wallet}
            tone="amber"
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5 h-fit">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-djati-amber">
                  {isEditing ? "Edit Income" : "Input Income"}
                </h2>

                <p className="text-xs text-white/40 mt-1">
                  Hanya income manual yang bisa ditambah, diedit, dan dihapus.
                </p>
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase">
                  Category
                </label>

                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Dana Operasional / Reimburse"
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase">
                  Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Nominal"
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase">
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase">
                  Note
                </label>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Catatan"
                  rows="3"
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-djati-amber resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-djati-amber text-black font-bold rounded-lg px-4 py-3 disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : isEditing
                  ? "Update Income"
                  : "Simpan Income"}
              </button>
            </form>
          </div>

          <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-5 overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-djati-amber">
                  Transaction Report
                </h2>

                <p className="text-xs text-white/40 mt-1">
                  Expense bersifat otomatis dan tidak bisa diedit atau dihapus.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-djati-amber"
                />

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-djati-amber"
                >
                  <option value="">All Type</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                  className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-djati-amber"
                >
                  <option value="">All Source</option>
                  <option value="manual">Manual</option>
                  <option value="repair">Repair</option>
                  <option value="inventory">Inventory</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-djati-amber text-black">
                  <tr>
                    <th className="p-4 text-left font-bold">Tanggal</th>
                    <th className="p-4 text-left font-bold">Type</th>
                    <th className="p-4 text-left font-bold">Kategori</th>
                    <th className="p-4 text-left font-bold">Nominal</th>
                    <th className="p-4 text-left font-bold">Source</th>
                    <th className="p-4 text-left font-bold">Note / Ref</th>
                    <th className="p-4 text-left font-bold">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => {
                    const canModify =
                      transaction.type === "income" &&
                      !transaction.locked;

                    return (
                      <tr
                        key={transaction.id}
                        className="border-t border-white/10 hover:bg-white/[0.03]"
                      >
                        <td className="p-4 text-white/80">
                          {formatDate(transaction.date)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.68rem] font-bold uppercase ${
                              transaction.type === "income"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {transaction.type}
                            {transaction.type === "expense" && " AUTO"}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-white">
                            {transaction.category || "-"}
                          </div>

                          <div className="text-xs text-white/35 mt-1">
                            {transaction.locked
                              ? "Locked / automatic"
                              : "Manual"}
                          </div>
                        </td>

                        <td className="p-4 font-bold text-djati-amber">
                          Rp {formatCurrency(transaction.amount)}
                        </td>

                        <td className="p-4 text-white/70 capitalize">
                          {transaction.source || "-"}
                        </td>

                        <td className="p-4 max-w-[260px]">
                          <div className="text-white/70 line-clamp-2">
                            {transaction.note || "-"}
                          </div>

                          {transaction.ref && (
                            <div className="text-xs text-white/35 mt-1">
                              Ref: {transaction.ref}
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
                                  actionLoadingId ===
                                  `delete-${transaction.id}`
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                                Hapus
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-white/35">
                              Readonly
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {!transactions.length && !loading && (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-6 text-center text-white/50"
                      >
                        Tidak ada data transaksi.
                      </td>
                    </tr>
                  )}

                  {loading && !transactions.length && (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-6 text-center text-white/50"
                      >
                        Loading transaksi...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}