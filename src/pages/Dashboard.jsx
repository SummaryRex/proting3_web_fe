import { useState, useEffect } from 'react';
import { FileText, Wrench, CheckCircle, AlertCircle, Download } from 'lucide-react';

import DashboardLayout from '../components/layouts/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';

import { useAuth } from '../contexts/AuthContext';

// 🔥 SERVICE (backend)
import { getDashboardStats } from '../services/dashboardService';

// ✅ tetap pakai mock (sementara)
import { barChartData, latestReports, statusLabels } from '../mocks/dashboardData';

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

  // 🔥 STATE
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH DATA
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        alert('Gagal mengambil data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <DashboardLayout title="Dashboard Admin">
      {/* Greeting */}
      <section className="bg-gradient-to-br from-[#3a301a] to-[#2b230d] border border-[rgba(175,160,76,0.25)] rounded-[14px] px-6 py-5 flex items-center gap-4 mb-6">
        <div className="text-3xl flex-shrink-0">👋</div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Good Morning, {firstName}!
          </h2>
          <p className="text-[0.82rem] text-white/70 mt-0.5">
            Let's manage, what's new today!
          </p>
        </div>
      </section>

      {/* Section header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">
            Mining Maintenance Overview
          </h2>
          <p className="text-[0.82rem] text-djati-muted mt-0.5">
            Real-time equipment status and reports.
          </p>
        </div>
        <button className="btn-ghost gap-2 px-4 py-2 text-[0.8rem] font-semibold !bg-djati-panel2">
          <Download size={16} />
          Export to PDF
        </button>
      </div>

      {/* 🔥 Stat Cards (FROM BACKEND) */}
      <section className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Drivers"
          value={stats?.drivers || 0}
          icon={statIcons[0]}
        />
        <StatCard
          label="Technicians"
          value={stats?.technicians || 0}
          icon={statIcons[1]}
        />
        <StatCard
          label="Vehicles"
          value={stats?.vehicles || 0}
          icon={statIcons[2]}
        />
        <StatCard
          label="Follow Ups"
          value={stats?.followups || 0}
          icon={statIcons[3]}
        />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        {/* Equipment Downtime */}
        <article className="panel p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[0.95rem] font-bold text-white">
                Equipment Downtime
              </h3>
              <p className="text-[0.75rem] text-white/40 mt-0.5">
                Weekly hours overview
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-white">
                120{' '}
                <small className="text-[0.72rem] font-medium text-white/45">
                  hrs
                </small>
              </span>
              <span className="block text-[0.7rem] font-semibold text-[#f44336] mt-0.5">
                ↓ 5% vs last week
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2 h-[160px] px-1 mt-2">
            {barChartData.map((b) => (
              <div
                key={b.day}
                className="flex-1 flex flex-col items-center h-full justify-end"
              >
                <div
                  className={`w-[70%] max-w-[36px] rounded-t ${
                    b.active
                      ? 'bg-djati-amber'
                      : 'bg-[rgba(255,179,0,0.35)]'
                  }`}
                  style={{ height: b.h }}
                />
                <span
                  className={`text-[0.68rem] mt-1.5 ${
                    b.active
                      ? 'text-white font-bold'
                      : 'text-white/45 font-medium'
                  }`}
                >
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
              <h3 className="text-[0.95rem] font-bold text-white">
                Maintenance Activities
              </h3>
              <p className="text-[0.75rem] text-white/40 mt-0.5">
                Monthly tasks completed
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-white">
                45{' '}
                <small className="text-[0.72rem] font-medium text-white/45">
                  tasks
                </small>
              </span>
              <span className="block text-[0.7rem] font-semibold text-[#4caf50] mt-0.5">
                ↑ 12% vs last month
              </span>
            </div>
          </div>

          <div className="mt-2">
            <svg viewBox="0 0 360 140" className="w-full h-[140px]">
              <path
                d="M0,120 C60,110 120,90 180,75 C240,50 300,25 360,5"
                fill="none"
                stroke="#ffb300"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </article>
      </section>

      {/* Table */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">
            Latest Damage Reports
          </h3>
        </div>

        <DataTable
          columns={tableColumns}
          data={latestReports}
          renderRow={(r, i) => (
            <tr key={r.id}>
              <td className="px-4 py-3.5">{r.id}</td>
              <td className="px-4 py-3.5">{r.equip}</td>
              <td className="px-4 py-3.5">{r.operator}</td>
              <td className="px-4 py-3.5">{r.date}</td>
              <td className="px-4 py-3.5">
                <StatusBadge variant={r.status}>
                  {statusLabels[r.status]}
                </StatusBadge>
              </td>
            </tr>
          )}
        />
      </section>
    </DashboardLayout>
  );
}