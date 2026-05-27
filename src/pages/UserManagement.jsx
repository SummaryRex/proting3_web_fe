import { useState, useEffect } from 'react';
import { Edit, Ban, Eye, Filter, ChevronDown, Trash } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DataTable from '../components/ui/DataTable';
import SearchInput from '../components/ui/SearchInput';
import StatusBadge from '../components/ui/StatusBadge';
import AddUserModal from '../components/modals/AddUserModal';

import {
  getUsers,
  createUser,
  updateUser,
  disableUser,
  deleteUser,
  enableUser,
} from '../services/userService';

const tableColumns = [
  { label: 'USER NAME' },
  { label: 'ROLE' },
  { label: 'STATUS' },
  { label: 'ACTIONS', className: '!text-right !pr-5' },
];

const roleLabel = {
  admin: 'Admin',
  driver: 'Driver',
  teknisi: 'Teknisi',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const normalizeRole = (role) => {
    if (!role) return '';

    const value = role.toLowerCase();

    switch (value) {
      case 'operator':
      case 'driver':
        return 'driver';
      case 'mechanic':
      case 'technician':
      case 'teknisi':
        return 'teknisi';
      case 'admin':
        return 'admin';
      default:
        return value;
    }
  };

  const getRoleLabel = (role) => {
    const normalized = normalizeRole(role);
    return roleLabel[normalized] || role;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const data = await getUsers({
        search,
        role: roleFilter,
      });

      setUsers(data);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const filteredUsers = users.filter((u) => {
    const displayName = u.name || u.username || '';
    const userRole = normalizeRole(u.role);

    const matchSearch = displayName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchRole =
      roleFilter === 'all' || userRole === normalizeRole(roleFilter);

    return matchSearch && matchRole;
  });

  const handleSaveUser = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        role: normalizeRole(formData.role),
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (selectedUser) {
        const updated = await updateUser(selectedUser.id, payload);

        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, ...updated } : u
          )
        );
      } else {
        const newUser = await createUser(payload);
        setUsers((prev) => [newUser, ...prev]);
      }

      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);

      if (err.errors) {
        alert(Object.values(err.errors).flat().join('\n'));
      } else {
        alert(err.message || 'Gagal menyimpan user');
      }
    }
  };

  const handleDisableUser = async (id, name) => {
    if (!window.confirm(`Disable user ${name}?`)) return;

    try {
      const res = await disableUser(id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: res.status || 'inactive' } : u
        )
      );
    } catch (err) {
      console.error(err);
      alert('Gagal disable user');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user ${name}?`)) return;

    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert('User berhasil dihapus');
    } catch (err) {
      console.error(err);
      alert('Gagal hapus user');
    }
  };

  const handleEnableUser = async (id, name) => {
    if (!window.confirm(`Activate user ${name}?`)) return;

    try {
      const res = await enableUser(id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: res.status || 'active' } : u
        )
      );
    } catch (err) {
      console.error(err);
      alert('Gagal mengaktifkan user');
    }
  };

  return (
    <DashboardLayout title="User Management">
      <section className="flex items-center justify-between gap-4 mb-5">
        <SearchInput
          placeholder="Search users by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-[0_1_480px]"
        />

        <div className="flex items-center gap-2.5">
          <div className="relative inline-flex items-center">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-base !pr-10 cursor-pointer appearance-none 
                         !bg-djati-panel2 !border-white/15 
                         !text-white !text-[0.82rem] !font-semibold"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teknisi">Teknisi</option>
              <option value="driver">Driver</option>
            </select>

            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"
            />
          </div>

          <button className="btn-ghost gap-2 px-4 py-2.5 text-[0.82rem] font-semibold">
            <Filter size={16} />
            Filter
          </button>

          <button
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
            className="btn-primary gap-2 px-5 py-2.5 text-[0.82rem]"
          >
            Add New User
          </button>
        </div>
      </section>

      <section>
        <DataTable
          columns={tableColumns}
          data={filteredUsers}
          loading={loading}
          renderRow={(u, i) => {
            const displayName = u.name || u.username;

            return (
              <tr key={u.id || i} className="table-row-hover">
                <td className="px-4 py-3.5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-[34px] h-[34px] rounded-full bg-[#2a2c36] flex items-center justify-center font-bold text-[0.78rem]">
                      {(displayName || 'U').charAt(0)}
                    </div>

                    <span className="font-semibold">{displayName}</span>
                  </div>
                </td>

                <td className="px-4 py-3.5 border-b">
                  <StatusBadge variant={normalizeRole(u.role)}>
                    {getRoleLabel(u.role)}
                  </StatusBadge>
                </td>

                <td className="px-4 py-3.5 border-b">
                  <StatusBadge variant={(u.status || '').toLowerCase()} dot>
                    {u.status}
                  </StatusBadge>
                </td>

                <td className="px-4 py-3.5 text-right pr-5 border-b">
                  <div className="flex justify-end gap-1.5">
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setSelectedUser({
                          ...u,
                          role: normalizeRole(u.role),
                        });
                        setShowModal(true);
                      }}
                    >
                      <Edit size={16} />
                    </button>

                    {u.status === 'active' ? (
                      <button
                        className="btn-icon"
                        onClick={() => handleDisableUser(u.id, displayName)}
                      >
                        <Ban size={16} />
                      </button>
                    ) : (
                      <button
                        className="btn-icon"
                        onClick={() => handleEnableUser(u.id, displayName)}
                      >
                        <Eye size={16} />
                      </button>
                    )}

                    <button
                      className="btn-icon"
                      onClick={() => handleDeleteUser(u.id, displayName)}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </section>

      {showModal && (
        <AddUserModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onCreate={handleSaveUser}
        />
      )}
    </DashboardLayout>
  );
}