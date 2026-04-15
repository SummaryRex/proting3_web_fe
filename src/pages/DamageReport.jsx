import { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DataTable from '../components/ui/DataTable';
import SearchInput from '../components/ui/SearchInput';
import StatusBadge from '../components/ui/StatusBadge';
import DamageDetailModal from '../components/modals/DamageDetailModal';
import { reportData, tableRows } from '../mocks/damageReportData';

const tableColumns = [
  { label: 'REPORT ID' },
  { label: 'EQUIPMENT NAME' },
  { label: 'OPERATOR NAME' },
  { label: 'REPORT DATE' },
  { label: 'STATUS' },
  { label: 'ACTIONS' },
];

export default function DamageReport() {
  const [activeFilter, setActiveFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalData, setModalData] = useState(null);

  const openDetail = (id) => setModalData(reportData[id]);
  const closeDetail = () => setModalData(null);

  return (
    <DashboardLayout title="Damage Reports">
      {/* Filter Panel */}
      <section className="flex items-center justify-between gap-4 mb-5 panel px-5 py-4">
        <SearchInput
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-[0_1_400px]"
        />
        <div className="flex items-center gap-2">
          <span className="text-[0.8rem] text-djati-muted font-medium mr-1">Status:</span>
          {['Pending', 'Approved', 'Rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-lg px-4 py-2 text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 ${
                activeFilter === f
                  ? 'bg-status-pending-bg border border-djati-amber text-djati-amber'
                  : 'bg-transparent border border-djati-border-light text-[#d4d4d4] hover:border-djati-amber hover:text-djati-amber'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      <section>
        <DataTable
          columns={tableColumns}
          data={tableRows}
          className="!rounded-b-none !border-b-0"
          renderRow={(r, i) => (
            <tr key={r.id} className="table-row-hover">
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">{r.id}</td>
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">{r.equip}</td>
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">{r.operator}</td>
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">{r.date}</td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <StatusBadge variant={r.status.toLowerCase()}>{r.status}</StatusBadge>
              </td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openDetail(r.id)} className="btn-ghost px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md whitespace-nowrap">
                    View Detail
                  </button>
                  <button className="btn-success-outline px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md whitespace-nowrap">
                    Approve
                  </button>
                  <button className="btn-danger-outline px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md whitespace-nowrap">
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          )}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-djati-border panel !rounded-t-none !border-t-djati-border">
          <span className="text-[0.78rem] text-djati-muted">
            Showing <strong className="text-[#4caf50] font-bold">1</strong> to <strong className="text-[#4caf50] font-bold">4</strong> of <strong className="text-[#4caf50] font-bold">12</strong> reports
          </span>
          <div className="flex items-center gap-1.5">
            {['Previous', '1', '2', '3', 'Next'].map((p) => (
              <button
                key={p}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 ${
                  p === '1'
                    ? 'bg-[#4caf50] border border-[#4caf50] text-white'
                    : 'bg-transparent border border-djati-border-light text-[#d4d4d4] hover:border-djati-amber hover:text-djati-amber'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      <DamageDetailModal data={modalData} onClose={closeDetail} />
    </DashboardLayout>
  );
}
