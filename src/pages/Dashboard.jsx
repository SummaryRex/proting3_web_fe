import { useState, useEffect } from 'react';
import {
  FileText,
  Wrench,
  CheckCircle,
  Download,
} from 'lucide-react';

import DashboardLayout from '../components/layouts/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';

import { useAuth } from '../contexts/AuthContext';

import {
  getDashboardStats,
  getLatestReports,
  dashboardStatusLabels,
} from '../services/dashboardService';

const statIcons = [
  <FileText size={20} className="text-[#ff9800]" />,
  <Wrench size={20} className="text-[#ff9800]" />,
  <CheckCircle size={20} className="text-[#4caf50]" />,
];

const tableColumns = [
  { label: 'REPORT ID' },
  { label: 'EQUIPMENT NAME' },
  { label: 'OPERATOR' },
  { label: 'REPORT DATE' },
  { label: 'STATUS' },
];

const defaultStats = {
  drivers: 0,
  technicians: 0,
  vehicles: 0,
  latestReports: [],
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 4 && hour < 11) return 'Good Morning';
  if (hour >= 11 && hour < 15) return 'Good Afternoon';
  if (hour >= 15 && hour < 18) return 'Good Evening';

  return 'Good Night';
}

function getStatusLabel(status) {
  return dashboardStatusLabels?.[status] || 'Reported';
}

function getGeneratedDate() {
  return new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const { user } = useAuth();

  const firstName =
    user?.name?.split(' ')[0] ||
    user?.username ||
    'User';

  const [stats, setStats] = useState(defaultStats);
  const [latestReports, setLatestReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const dashboardData = await getDashboardStats();

        if (!active) return;

        const normalizedStats = {
          ...defaultStats,
          ...dashboardData,
        };

        let reportsData = normalizedStats.latestReports || [];

        if (!reportsData.length) {
          reportsData = await getLatestReports(5);
        }

        setStats(normalizedStats);
        setLatestReports(reportsData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);

        if (!active) return;

        setStats(defaultStats);
        setLatestReports([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout title="Dashboard Admin">
      {/* WEB DASHBOARD */}
      <section className="bg-gradient-to-br from-[#3a301a] to-[#2b230d] border border-[rgba(175,160,76,0.25)] rounded-[14px] px-6 py-5 flex items-center gap-4 mb-6">
        <div className="text-3xl flex-shrink-0">👋</div>

        <div>
          <h2 className="text-lg font-bold text-white">
            {getGreeting()}, {firstName}!
          </h2>

          <p className="text-[0.82rem] text-white/70 mt-0.5">
            Let's manage, what's new today!
          </p>
        </div>
      </section>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">
            Mining Maintenance Overview
          </h2>

          <p className="text-[0.82rem] text-djati-muted mt-0.5">
            Real-time equipment status and reports.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="no-print btn-ghost gap-2 px-4 py-2 text-[0.8rem] font-semibold !bg-djati-panel2"
        >
          <Download size={16} />
          Export to PDF
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <StatCard
          label="Drivers"
          value={loading ? '...' : stats.drivers}
          icon={statIcons[0]}
        />

        <StatCard
          label="Technicians"
          value={loading ? '...' : stats.technicians}
          icon={statIcons[1]}
        />

        <StatCard
          label="Vehicles"
          value={loading ? '...' : stats.vehicles}
          icon={statIcons[2]}
        />
      </section>

      <section className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              Latest Damage Reports
            </h3>

            <p className="text-[0.78rem] text-djati-muted mt-0.5">
              Daftar laporan kerusakan terbaru dari operator.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#171a23]/95 shadow-2xl shadow-black/20">
          <DataTable
            columns={tableColumns}
            data={latestReports}
            renderRow={(r, i) => (
              <tr key={r.rawId || r.damageReportId || r.id || i}>
                <td className="px-4 py-3.5">{r.id}</td>
                <td className="px-4 py-3.5">{r.equip}</td>
                <td className="px-4 py-3.5">{r.operator}</td>
                <td className="px-4 py-3.5">{r.date}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge variant={r.status}>
                    {r.statusLabel || getStatusLabel(r.status)}
                  </StatusBadge>
                </td>
              </tr>
            )}
          />

          {loading && (
            <div className="border-t border-white/10 bg-[#171a23]/95 px-5 py-4 text-sm text-djati-muted">
              Memuat laporan terbaru...
            </div>
          )}

          {!loading && latestReports.length === 0 && (
            <div className="border-t border-white/10 bg-[#171a23]/95 px-5 py-4 text-sm text-djati-muted">
              Belum ada laporan kerusakan terbaru.
            </div>
          )}
        </div>
      </section>

      {/* PRINT / PDF ONLY */}
      <section className="print-dashboard-only">
        <div className="print-header">
          <div>
            <h1>DJATI Mining</h1>
            <p>Dashboard Admin Report</p>
          </div>

          <div className="print-date">
            Generated: {getGeneratedDate()}
          </div>
        </div>

        <div className="print-summary">
          <div className="print-card">
            <span>Drivers</span>
            <strong>{stats.drivers}</strong>
          </div>

          <div className="print-card">
            <span>Technicians</span>
            <strong>{stats.technicians}</strong>
          </div>

          <div className="print-card">
            <span>Vehicles</span>
            <strong>{stats.vehicles}</strong>
          </div>
        </div>

        <div className="print-section">
          <h2>Latest Damage Reports</h2>

          <table className="print-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Equipment Name</th>
                <th>Operator</th>
                <th>Report Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {latestReports.length > 0 ? (
                latestReports.map((report, index) => (
                  <tr key={report.rawId || report.damageReportId || index}>
                    <td>{report.id}</td>
                    <td>{report.equip}</td>
                    <td>{report.operator}</td>
                    <td>{report.date}</td>
                    <td>
                      {report.statusLabel || getStatusLabel(report.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    No latest damage reports available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}