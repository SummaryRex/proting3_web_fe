import { useEffect, useState } from "react";
import { Edit, Ban, Eye, ChevronDown, Trash2 } from "lucide-react";

import DashboardLayout from "../components/layouts/DashboardLayout";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import StatusBadge from "../components/ui/StatusBadge";
import AddUserModal from "../components/modals/AddUserModal";

import {
  getUsers,
  createUser,
  updateUser,
  disableUser,
  deleteUser,
  enableUser,
} from "../services/userService";

const tableColumns = [
  { label: "NAMA PENGGUNA" },
  { label: "ROLE" },
  { label: "STATUS" },
  { label: "AKSI", className: "!text-right !pr-5" },
];

const roleLabel = {
  admin: "Admin",
  driver: "Pengemudi",
  teknisi: "Teknisi",
};

const statusLabel = {
  active: "Aktif",
  inactive: "Nonaktif",
  disabled: "Nonaktif",
  blocked: "Diblokir",
};

function normalizeRole(role) {
  if (!role) return "";

  const value = String(role).toLowerCase().trim();

  switch (value) {
    case "operator":
    case "driver":
      return "driver";

    case "mechanic":
    case "technician":
    case "teknisi":
      return "teknisi";

    case "admin":
      return "admin";

    default:
      return value;
  }
}

function getRoleLabel(role) {
  const normalized = normalizeRole(role);
  return roleLabel[normalized] || role || "-";
}

function normalizeStatus(status) {
  if (!status) return "inactive";

  const value = String(status).toLowerCase().trim();

  if (value === "enabled") return "active";
  if (value === "enable") return "active";
  if (value === "disable") return "inactive";
  if (value === "disabled") return "inactive";

  return value;
}

function getStatusLabel(status) {
  const normalized = normalizeStatus(status);
  return statusLabel[normalized] || status || "-";
}

function getDisplayName(user) {
  return user?.name || user?.username || "-";
}

function getUserInitial(name) {
  return String(name || "U").charAt(0).toUpperCase();
}

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
  if (typeof error === "string" && !isTechnicalMessage(error)) {
    return error;
  }

  if (error?.errors) {
    const validationMessages = Object.values(error.errors).flat().join("\n");
    return validationMessages || fallback;
  }

  if (error?.response?.data?.errors) {
    const validationMessages = Object.values(error.response.data.errors)
      .flat()
      .join("\n");

    return validationMessages || fallback;
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
        className={`rounded-2xl border bg-[#1E1E1E] px-4 py-3 shadow-2xl backdrop-blur ${colorClass}`}
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
  tone = "red",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClass =
    tone === "green"
      ? "border-green-500/40 text-green-400 hover:bg-green-500/10"
      : tone === "amber"
      ? "border-djati-amber/40 text-djati-amber hover:bg-djati-amber/10"
      : "border-red-500/40 text-red-400 hover:bg-red-500/10";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1E1E1E] p-5 shadow-2xl">
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
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = {
        search: search.trim(),
      };

      if (roleFilter !== "all") {
        params.role = normalizeRole(roleFilter);
      }

      const data = await getUsers(params);

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("GAGAL MENGAMBIL DATA PENGGUNA:", err);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          err,
          "Data pengguna belum dapat dimuat. Periksa koneksi atau coba beberapa saat lagi."
        )
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const filteredUsers = users.filter((user) => {
    const displayName = getDisplayName(user);
    const username = user?.username || "";
    const userRole = normalizeRole(user.role);

    const keyword = search.toLowerCase().trim();

    const matchSearch =
      !keyword ||
      displayName.toLowerCase().includes(keyword) ||
      username.toLowerCase().includes(keyword);

    const matchRole =
      roleFilter === "all" || userRole === normalizeRole(roleFilter);

    return matchSearch && matchRole;
  });

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser({
      ...user,
      role: normalizeRole(user.role),
      status: normalizeStatus(user.status),
    });

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (formData) => {
    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        username: formData.username,
        role: normalizeRole(formData.role),
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (formData.status !== undefined) {
        payload.status = normalizeStatus(formData.status);
      }

      if (selectedUser) {
        const updatedUser = await updateUser(selectedUser.id, payload);

        setUsers((prev) =>
          prev.map((user) =>
            user.id === selectedUser.id ? { ...user, ...updatedUser } : user
          )
        );

        showNotification("success", "Data pengguna berhasil diperbarui.");
      } else {
        const newUser = await createUser(payload);

        setUsers((prev) => [newUser, ...prev]);

        showNotification("success", "Pengguna baru berhasil ditambahkan.");
      }

      handleCloseModal();
    } catch (err) {
      console.error("GAGAL MENYIMPAN DATA PENGGUNA:", err);

      showNotification(
        "error",
        getFriendlyErrorMessage(
          err,
          "Data pengguna belum dapat disimpan. Periksa kembali data yang diisi."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisableUser = (id, name) => {
    setConfirmAction({
      type: "disable",
      id,
      name,
      title: "Nonaktifkan Pengguna",
      description: `Apakah Anda yakin ingin menonaktifkan pengguna ${name}? Pengguna tidak dapat mengakses sistem sampai diaktifkan kembali.`,
      confirmText: "Ya, Nonaktifkan",
      tone: "amber",
    });
  };

  const handleEnableUser = (id, name) => {
    setConfirmAction({
      type: "enable",
      id,
      name,
      title: "Aktifkan Pengguna",
      description: `Apakah Anda yakin ingin mengaktifkan kembali pengguna ${name}?`,
      confirmText: "Ya, Aktifkan",
      tone: "green",
    });
  };

  const handleDeleteUser = (id, name) => {
    setConfirmAction({
      type: "delete",
      id,
      name,
      title: "Hapus Pengguna",
      description: `Apakah Anda yakin ingin menghapus pengguna ${name}? Pengguna tidak dapat dihapus jika masih memiliki kendaraan, laporan, booking service, atau jadwal maintenance yang sedang berjalan.`,
      confirmText: "Ya, Hapus",
      tone: "red",
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      setLoading(true);

      if (confirmAction.type === "disable") {
        const updatedUser = await disableUser(confirmAction.id);

        setUsers((prev) =>
          prev.map((user) =>
            user.id === confirmAction.id ? { ...user, ...updatedUser } : user
          )
        );

        showNotification("success", "Pengguna berhasil dinonaktifkan.");
      }

      if (confirmAction.type === "enable") {
        const updatedUser = await enableUser(confirmAction.id);

        setUsers((prev) =>
          prev.map((user) =>
            user.id === confirmAction.id ? { ...user, ...updatedUser } : user
          )
        );

        showNotification("success", "Pengguna berhasil diaktifkan.");
      }

      if (confirmAction.type === "delete") {
        await deleteUser(confirmAction.id);

        setUsers((prev) =>
          prev.filter((user) => user.id !== confirmAction.id)
        );

        showNotification("success", "Pengguna berhasil dihapus.");
      }

      setConfirmAction(null);
    } catch (err) {
      console.error("GAGAL MEMPROSES AKSI PENGGUNA:", err);

      const fallbackMessage =
        confirmAction.type === "delete"
          ? "Pengguna belum dapat dihapus. Pastikan pengguna tidak masih memiliki data aktif."
          : confirmAction.type === "enable"
          ? "Pengguna belum dapat diaktifkan. Silakan coba kembali."
          : "Pengguna belum dapat dinonaktifkan. Silakan coba kembali.";

      showNotification(
        "error",
        getFriendlyErrorMessage(err, fallbackMessage)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Manajemen Pengguna">
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmText={confirmAction?.confirmText}
        tone={confirmAction?.tone}
        loading={loading}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          if (!loading) {
            setConfirmAction(null);
          }
        }}
      />

      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <SearchInput
          placeholder="Cari pengguna berdasarkan nama atau username..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full lg:flex-[0_1_480px]"
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative inline-flex items-center">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="input-base !pr-10 cursor-pointer appearance-none 
                         !bg-djati-panel2 !border-white/15 
                         !text-white !text-[0.82rem] !font-semibold"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="teknisi">Teknisi</option>
              <option value="driver">Pengemudi</option>
            </select>

            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={loading}
            className="btn-primary gap-2 px-5 py-2.5 text-[0.82rem] disabled:opacity-60"
          >
            Tambah Pengguna
          </button>
        </div>
      </section>

      <section>
        <DataTable
          columns={tableColumns}
          data={filteredUsers}
          renderRow={(user, index) => {
            const displayName = getDisplayName(user);
            const normalizedStatus = normalizeStatus(user.status);
            const normalizedRole = normalizeRole(user.role);
            const isActive = normalizedStatus === "active";

            return (
              <tr key={user.id || index} className="table-row-hover">
                <td className="px-4 py-3.5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-[34px] h-[34px] rounded-full bg-[#2a2c36] flex items-center justify-center font-bold text-[0.78rem]">
                      {getUserInitial(displayName)}
                    </div>

                    <div className="min-w-0">
                      <span className="block font-semibold truncate">
                        {displayName}
                      </span>

                      {user.username && (
                        <span className="block text-[0.72rem] text-white/40 truncate">
                          Username: {user.username}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5 border-b">
                  <StatusBadge variant={normalizedRole}>
                    {getRoleLabel(user.role)}
                  </StatusBadge>
                </td>

                <td className="px-4 py-3.5 border-b">
                  <StatusBadge variant={normalizedStatus} dot>
                    {getStatusLabel(user.status)}
                  </StatusBadge>
                </td>

                <td className="px-4 py-3.5 text-right pr-5 border-b">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit pengguna"
                      disabled={loading}
                      onClick={() => handleOpenEditModal(user)}
                    >
                      <Edit size={16} />
                    </button>

                    {isActive ? (
                      <button
                        type="button"
                        className="btn-icon"
                        title="Nonaktifkan pengguna"
                        disabled={loading}
                        onClick={() => handleDisableUser(user.id, displayName)}
                      >
                        <Ban size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-icon"
                        title="Aktifkan pengguna"
                        disabled={loading}
                        onClick={() => handleEnableUser(user.id, displayName)}
                      >
                        <Eye size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-icon hover:!bg-[rgba(211,47,47,0.12)] hover:!text-status-critical"
                      title="Hapus pengguna"
                      disabled={loading}
                      onClick={() => handleDeleteUser(user.id, displayName)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />

        {!loading && filteredUsers.length === 0 && (
          <div className="panel px-5 py-4 text-sm text-djati-muted">
            Tidak ada data pengguna yang sesuai.
          </div>
        )}

        {loading && (
          <div className="panel px-5 py-4 text-sm text-djati-muted">
            Memuat data pengguna...
          </div>
        )}
      </section>

      {showModal && (
        <AddUserModal
          user={selectedUser}
          onClose={handleCloseModal}
          onCreate={handleSaveUser}
        />
      )}
    </DashboardLayout>
  );
}