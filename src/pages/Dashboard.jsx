import { FileText, Wrench, CheckCircle, AlertCircle, Download } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { barChartData, latestReports, statCards, statusLabels } from '../mocks/dashboardData';

const statIcons = [
  <FileText size={20} className="text-[#ff9800]" />,
  <Wrench size={20} className="text-[#ff9800]" />,
  <CheckCircle size={20} className="text-[#4caf50]" />,
  <AlertCircle size={20} className="text-[#f44336]" />,
];

const tableColumns = [
  { label: 'REPORT ID' },
  { label: 'EQUIPMENT NAME' },
  { label: 'OPERATOR' },
  { label: 'REPORT DATE' },
  { label: 'STATUS' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <DashboardLayout title="Dashboard Admin">
      {/* Greeting */}
      <section className="bg-gradient-to-br from-[#3a301a] to-[#2b230d] border border-[rgba(175,160,76,0.25)] rounded-[14px] px-6 py-5 flex items-center gap-4 mb-6">
        <div className="text-3xl flex-shrink-0">👋</div>
        <div>
          <h2 className="text-lg font-bold text-white">Good Morning, {firstName}!</h2>
          <p className="text-[0.82rem] text-white/70 mt-0.5">Let's manage, what's new today!</p>
        </div>
      </section>

      {/* Section header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Mining Maintenance Overview</h2>
          <p className="text-[0.82rem] text-djati-muted mt-0.5">Real-time equipment status and reports.</p>
        </div>
        <button className="btn-ghost gap-2 px-4 py-2 text-[0.8rem] font-semibold !bg-djati-panel2">
          <Download size={16} />
          Export to PDF
        </button>
      </div>

      {/* Stat Cards */}
      <section className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={statIcons[i]} />
        ))}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        {/* Equipment Downtime */}
        <article className="panel p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[0.95rem] font-bold text-white">Equipment Downtime</h3>
              <p className="text-[0.75rem] text-white/40 mt-0.5">Weekly hours overview</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-white">120 <small className="text-[0.72rem] font-medium text-white/45">hrs</small></span>
              <span className="block text-[0.7rem] font-semibold text-[#f44336] mt-0.5">↓ 5% vs last week</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-[160px] px-1 mt-2">
            {barChartData.map((b) => (
              <div key={b.day} className="flex-1 flex flex-col items-center h-full justify-end">
                <div
                  className={`w-[70%] max-w-[36px] rounded-t ${b.active ? 'bg-djati-amber' : 'bg-[rgba(255,179,0,0.35)]'}`}
                  style={{ height: b.h }}
                />
                <span className={`text-[0.68rem] mt-1.5 ${b.active ? 'text-white font-bold' : 'text-white/45 font-medium'}`}>
                  {b.day}
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Maintenance Activities */}
        <article className="panel p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[0.95rem] font-bold text-white">Maintenance Activities</h3>
              <p className="text-[0.75rem] text-white/40 mt-0.5">Monthly tasks completed</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-white">45 <small className="text-[0.72rem] font-medium text-white/45">tasks</small></span>
              <span className="block text-[0.7rem] font-semibold text-[#4caf50] mt-0.5">↑ 12% vs last month</span>
            </div>
          </div>
          <div className="mt-2">
            <svg viewBox="0 0 360 140" className="w-full h-[140px]" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffb300" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ffb300" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,120 C30,115 50,110 60,105 C80,95 100,100 120,90 C140,80 160,85 180,75 C200,65 220,70 240,50 C260,35 280,40 300,25 C320,15 340,10 360,5" fill="none" stroke="#ffb300" strokeWidth="2.5" />
              <path d="M0,120 C30,115 50,110 60,105 C80,95 100,100 120,90 C140,80 160,85 180,75 C200,65 220,70 240,50 C260,35 280,40 300,25 C320,15 340,10 360,5 L360,140 L0,140 Z" fill="url(#lineGrad)" />
            </svg>
            <div className="flex justify-between pt-1.5">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m) => (
                <span key={m} className="text-[0.68rem] text-white/45 font-medium">{m}</span>
              ))}
            </div>
          </div>
        </article>
      </section>

      {/* Table */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Latest Damage Reports</h3>
          <a href="#" className="text-[#4caf50] no-underline text-[0.82rem] font-semibold hover:underline">View All</a>
        </div>
        <DataTable
          columns={tableColumns}
          data={latestReports}
          renderRow={(r, i) => (
            <tr key={r.id} className="table-row-hover">
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">{r.id}</td>
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">{r.equip}</td>
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">{r.operator}</td>
              <td className="px-4 py-3.5 text-[0.82rem] text-djati-text border-b border-white/[0.04]">{r.date}</td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <StatusBadge variant={r.status}>{statusLabels[r.status]}</StatusBadge>
              </td>
            </tr>
          )}
        />
      </section>
    </DashboardLayout>
  );
}