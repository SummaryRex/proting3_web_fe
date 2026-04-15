import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, XCircle } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ScheduleModal from '../components/modals/ScheduleModal';
import EditScheduleModal from '../components/modals/EditScheduleModal';
import { approvedReports, initialSchedules, statusLabels, priorityLabels } from '../mocks/maintenanceData';

const reportColumns = [
  { label: 'Equipment Name' },
  { label: 'Damage Description' },
  { label: 'Operator' },
  { label: 'Report Date' },
  { label: 'Action' },
];

const scheduleColumns = [
  { label: 'Schedule ID' },
  { label: 'Equipment Name' },
  { label: 'Mechanic Name' },
  { label: 'Scheduled Date' },
  { label: 'Priority' },
  { label: 'Status' },
  { label: 'Actions', className: '!text-right !pr-5' },
];

export default function MaintenanceScheduling() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [schedEquip, setSchedEquip] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [editData, setEditData] = useState(null);

  const openScheduleModal = (equipName) => { setSchedEquip(equipName); setShowSchedule(true); };

  const confirmSchedule = ({ mechanic, date, priority }) => {
    const newId = `MS-${1050 + schedules.length}`;
    const formatted = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setSchedules([...schedules, { id: newId, equip: schedEquip, mechanic, date: formatted, dateVal: date, priority, status: 'scheduled' }]);
    setShowSchedule(false);
  };

  const openEditModal = (id) => { const s = schedules.find((x) => x.id === id); if (s) setEditData(s); };
  const saveEdit = (updated) => { setSchedules(schedules.map((s) => s.id === updated.id ? updated : s)); setEditData(null); };

  return (
    <DashboardLayout title="Maintenance Scheduling">
      {/* Approved Damage Reports */}
      <section className="panel p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#e8e8e8]">Approved Damage Reports</h2>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/damage-reports'); }} className="text-[0.8rem] font-semibold text-djati-amber no-underline hover:underline">
            View All
          </a>
        </div>
        <DataTable
          columns={reportColumns}
          data={approvedReports}
          renderRow={(r) => (
            <tr key={r.id} className="table-row-hover">
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                <strong className="text-djati-text-bright font-semibold">{r.equip}</strong>
              </td>
              <td className="px-4 py-3.5 max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis text-[0.84rem] text-white/50 border-b border-white/[0.04]">
                {r.desc}
              </td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{r.operator}</td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{r.date}</td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <button onClick={() => openScheduleModal(r.equip)} className="btn-primary px-4 py-2 text-[0.8rem] whitespace-nowrap">
                  Schedule
                </button>
              </td>
            </tr>
          )}
        />
      </section>

      {/* Maintenance Schedule List */}
      <section className="panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#e8e8e8]">Maintenance Schedule List</h2>
          <a href="#" className="text-[0.8rem] font-semibold text-djati-amber no-underline hover:underline">View All</a>
        </div>
        <DataTable
          columns={scheduleColumns}
          data={schedules}
          renderRow={(s) => (
            <tr key={s.id} className="table-row-hover">
              <td className="px-4 py-3.5 font-semibold text-[0.82rem] text-white/60 border-b border-white/[0.04]">#{s.id}</td>
              <td className="px-4 py-3.5 text-[0.84rem] border-b border-white/[0.04]">
                <strong className="text-djati-text-bright font-semibold">{s.equip}</strong>
              </td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{s.mechanic}</td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{s.date}</td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <StatusBadge variant={s.priority}>{priorityLabels[s.priority]}</StatusBadge>
              </td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <StatusBadge variant={s.status}>{statusLabels[s.status]}</StatusBadge>
              </td>
              <td className="px-4 py-3.5 text-right pr-5 border-b border-white/[0.04]">
                <div className="flex items-center justify-end gap-1.5">
                  <button className="btn-icon" title="Edit" onClick={() => openEditModal(s.id)}>
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon hover:!bg-[rgba(211,47,47,0.12)] hover:!text-status-critical" title="Cancel">
                    <XCircle size={16} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </section>

      {showSchedule && <ScheduleModal equipName={schedEquip} onClose={() => setShowSchedule(false)} onConfirm={confirmSchedule} />}
      {editData && <EditScheduleModal data={editData} onClose={() => setEditData(null)} onSave={saveEdit} />}
    </DashboardLayout>
  );
}
