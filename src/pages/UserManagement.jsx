import { useState } from 'react';
import { Edit, Ban, Eye, Filter, ChevronDown } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DataTable from '../components/ui/DataTable';
import SearchInput from '../components/ui/SearchInput';
import StatusBadge from '../components/ui/StatusBadge';
import AddUserModal from '../components/modals/AddUserModal';
import { initialUsers } from '../mocks/userData';

const tableColumns = [
  { label: 'USER NAME' },
  { label: 'ROLE' },
  { label: 'STATUS' },
  { label: 'ACTIONS', className: '!text-right !pr-5' },
];

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

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
              className="input-base !pr-10 cursor-pointer appearance-none !bg-djati-panel2 !border-white/15 !text-[#d4d4d4] !text-[0.82rem] !font-semibold"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Mechanic">Mechanic</option>
              <option value="Operator">Operator</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" />
          </div>
          <button className="btn-ghost gap-2 px-4 py-2.5 text-[0.82rem] font-semibold !bg-djati-panel2 !border-white/15">
            <Filter size={16} />
            Filter
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary gap-2 px-5 py-2.5 text-[0.82rem] whitespace-nowrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add New User
          </button>
        </div>
      </section>

      {/* Users Table */}
      <section>
        <DataTable
          columns={tableColumns}
          data={filteredUsers}
          renderRow={(u, i) => (
            <tr key={u.name + i} className="table-row-hover">
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[34px] rounded-full bg-[#2a2c36] flex items-center justify-center font-bold text-[0.78rem] text-white/55 flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-djati-text-bright">{u.name}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <StatusBadge variant={u.role.toLowerCase()} pill={false}>{u.role}</StatusBadge>
              </td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <StatusBadge variant={u.status.toLowerCase()} dot>{u.status}</StatusBadge>
              </td>
              <td className="px-4 py-3.5 text-right pr-5 border-b border-white/[0.04]">
                <div className="flex items-center justify-end gap-1.5">
                  <button className="btn-icon" title="Edit"><Edit size={16} /></button>
                  <button className="btn-icon" title="Disable"><Ban size={16} /></button>
                  <button className="btn-icon" title="Reset Password"><Eye size={16} /></button>
                </div>
              </td>
            </tr>
          )}
        />
      </section>

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onCreate={(user) => { setUsers([...users, user]); setShowModal(false); }}
        />
      )}
    </DashboardLayout>
  );
}
