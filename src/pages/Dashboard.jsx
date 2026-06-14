import { useState, useEffect } from 'react';
import {
  FileText,
  Wrench,
  CheckCircle,
  AlertCircle,
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
  <AlertCircle size={20} className="text-[#f44336]" />,
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
  followups: 0,
  parts: 0,
  transactions: 0,

  downtimeHours: 0,
  downtimeChange: '0%',
  downtimeChangeDirection: 'same',

  maintenanceTasks: 0,
  maintenanceChange: '0%',
  maintenanceChangeDirection: 'same',

  latestReports: [],
  barChartData: [],
};

const emptyChartData = [
  { day: 'Mon', h: '0%', value: 0, active: false },
  { day: 'Tue', h: '0%', value: 0, active: false },
  { day: 'Wed', h: '0%', value: 0, active: false },
  { day: 'Thu', h: '0%', value: 0, active: false },
  { day: 'Fri', h: '0%', value: 0, active: false },
  { day: 'Sat', h: '0%', value: 0, active: false },
  { day: 'Sun', h: '0%', value: 0, active: false },
];

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

function getChangeSymbol(direction, defaultSymbol = '↓') {
  if (direction === 'up') return '↑';
  if (direction === 'down') return '↓';
  return defaultSymbol;
}

function getChangeColor(direction, defaultColor = 'text-[#f44336]') {
  if (direction === 'up') return 'text-[#4caf50]';
  if (direction === 'down') return 'text-[#f44336]';
  return defaultColor;
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
  const [chartData, setChartData] = useState(emptyChartData);
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

        const backendChart =
          normalizedStats.barChartData?.length > 0
            ? normalizedStats.barChartData
            : emptyChartData;

        setStats(normalizedStats);
        setLatestReports(reportsData);
        setChartData(backendChart);
      } catch (err) {
        console.error('Dashboard fetch error:', err);

        if (!active) return;

        setStats(defaultStats);
        setLatestReports([]);
        setChartData(emptyChartData);
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

  const downtimeHours = Number(stats?.downtimeHours || 0);
  const maintenanceTasks = Number(stats?.maintenanceTasks || 0);

  const downtimeDirection = stats?.downtimeChangeDirection || 'same';
  const maintenanceDirection = stats?.maintenanceChangeDirection || 'same';

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

      <section className="grid grid-cols-4 gap-4 mb-6">
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

        <StatCard
          label="Follow Ups"
          value={loading ? '...' : stats.followups}
          icon={statIcons[3]}
        />
      </section>

      <section className="grid grid-cols-2 gap-4 mb-6">
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
                {loading ? '...' : downtimeHours}{' '}
                <small className="text-[0.72rem] font-medium text-white/45">
                  hrs
                </small>
              </span>

              <span
                className={`block text-[0.7rem] font-semibold mt-0.5 ${getChangeColor(
                  downtimeDirection,
                  'text-[#f44336]'
                )}`}
              >
                {getChangeSymbol(downtimeDirection, '↓')}{' '}
                {stats.downtimeChange || '0%'} vs last week
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2 h-[160px] px-1 mt-2">
            {chartData.map((b, index) => (
              <div
                key={`${b.day}-${index}`}
                className="flex-1 flex flex-col items-center h-full justify-end"
              >
                <div
                  className={`w-[70%] max-w-[36px] rounded-t ${
                    b.active
                      ? 'bg-djati-amber'
                      : 'bg-[rgba(255,179,0,0.35)]'
                  }`}
                  style={{ height: b.h || '0%' }}
                  title={`${b.value || 0} hrs`}
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
                {loading ? '...' : maintenanceTasks}{' '}
                <small className="text-[0.72rem] font-medium text-white/45">
                  tasks
                </small>
              </span>

              <span
                className={`block text-[0.7rem] font-semibold mt-0.5 ${getChangeColor(
                  maintenanceDirection,
                  'text-[#4caf50]'
                )}`}
              >
                {getChangeSymbol(maintenanceDirection, '↑')}{' '}
                {stats.maintenanceChange || '0%'} vs last month
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

          <div className="print-card">
            <span>Follow Ups</span>
            <strong>{stats.followups}</strong>
          </div>
        </div>

        <div className="print-section">
          <h2>Maintenance Overview</h2>

          <div className="print-overview-grid">
            <div>
              <p className="print-label">Equipment Downtime</p>
              <h3>{downtimeHours} hrs</h3>
              <p>{stats.downtimeChange || '0%'} vs last week</p>
            </div>

            <div>
              <p className="print-label">Maintenance Activities</p>
              <h3>{maintenanceTasks} tasks</h3>
              <p>{stats.maintenanceChange || '0%'} vs last month</p>
            </div>
          </div>
        </div>

        <div className="print-section">
          <h2>Weekly Downtime Chart</h2>

          <div className="print-chart">
            {chartData.map((item, index) => (
              <div
                className="print-chart-item"
                key={`${item.day}-${index}`}
              >
                <div className="print-chart-bar-wrap">
                  <div
                    className="print-chart-bar"
                    style={{ height: item.h || '0%' }}
                  />
                </div>

                <span>{item.day}</span>
                <small>{item.value || 0} hrs</small>
              </div>
            ))}
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