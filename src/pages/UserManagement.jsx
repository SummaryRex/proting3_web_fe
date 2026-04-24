import { useState, useEffect } from 'react';
import { Edit, Ban, Eye, Filter, ChevronDown } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DataTable from '../components/ui/DataTable';
import SearchInput from '../components/ui/SearchInput';
import StatusBadge from '../components/ui/StatusBadge';
import AddUserModal from '../components/modals/AddUserModal';
import {
  getUsers,
  createUser,
  updateUser,
  disableUser
} from '../services/userService';

const tableColumns = [
  { label: 'USER NAME' },
  { label: 'ROLE' },
  { label: 'STATUS' },
  { label: 'ACTIONS', className: '!text-right !pr-5' },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      roleFilter === 'all' ||
      u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const handleSaveUser = async (formData) => {
    try {
      if (selectedUser) {
        const updated = await updateUser(selectedUser.id, formData);

        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, ...updated } : u
          )
        );
      } else {
        const newUser = await createUser(formData);
        setUsers((prev) => [newUser, ...prev]);
      }

      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisableUser = async (id, name) => {
    if (!window.confirm(`Disable user ${name}?`)) return;

    try {
      const res = await disableUser(id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: res.status || 'inactive' }
            : u
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (id, name) => {
    if (!window.confirm(`Reset password for ${name}?`)) return;

    try {
      await fetch(`/api/users/${id}/reset-password`, {
        method: 'POST',
      });

      alert('Password berhasil di-reset');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout title="User Management">
      {/* Filter Bar */}
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
              <option value="all" className="bg-djati-panel2 text-white">
                All Roles
              </option>
              <option value="Admin" className="bg-djati-panel2 text-white">
                Admin
              </option>
              <option value="Mechanic" className="bg-djati-panel2 text-white">
                Mechanic
              </option>
              <option value="Operator" className="bg-djati-panel2 text-white">
                Operator
              </option>
            </select>

            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"
            />
          </div>

          <button className="btn-ghost gap-2 px-4 py-2.5 text-[0.82rem] font-semibold !bg-djati-panel2 !border-white/15">
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

      {/* Table */}
      <section>
        <DataTable
          columns={tableColumns}
          data={filteredUsers}
          renderRow={(u, i) => (
            <tr key={u.id || u.name + i} className="table-row-hover">
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[34px] rounded-full bg-[#2a2c36] flex items-center justify-center font-bold text-[0.78rem] text-white/55">
                    {u.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-djati-text-bright">
                    {u.name}
                  </span>
                </div>
              </td>

              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <StatusBadge variant={u.role.toLowerCase()}>
                  {u.role}
                </StatusBadge>
              </td>

              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <StatusBadge variant={u.status.toLowerCase()} dot>
                  {u.status}
                </StatusBadge>
              </td>

              <td className="px-4 py-3.5 text-right pr-5 border-b border-white/[0.04]">
                <div className="flex justify-end gap-1.5">
                  <button className="btn-icon" onClick={() => { setSelectedUser(u); setShowModal(true); }}>
                    <Edit size={16} />
                  </button>

                  <button className="btn-icon" onClick={() => handleDisableUser(u.id, u.name)}>
                    <Ban size={16} />
                  </button>

                  <button className="btn-icon" onClick={() => handleResetPassword(u.id, u.name)}>
                    <Eye size={16} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </section>

      {/* MODAL */}
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