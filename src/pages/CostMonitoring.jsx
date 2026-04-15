import { useState } from 'react';
import { TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { sparePartsData, costHistoryData } from '../mocks/costData';

const sparePartsColumns = [
  { label: 'PART NAME' },
  { label: 'EQUIPMENT' },
  { label: 'REQUESTED DATE' },
  { label: 'EST. COST (RP)' },
  { label: 'ACTIONS' },
];

const historyColumns = [
  { label: 'EQUIPMENT NAME' },
  { label: 'REPAIR DATE' },
  { label: 'SPARE PART' },
  { label: 'LABOR COST (RP)' },
  { label: 'TOTAL COST (RP)' },
];

export default function CostMonitoring() {
  const [spareParts, setSpareParts] = useState(sparePartsData.map((s) => ({ ...s, status: 'pending' })));

  const handleAction = (idx, action) => {
    setSpareParts((prev) => prev.map((s, i) => i === idx ? { ...s, status: action } : s));
  };

  const pendingCount = spareParts.filter((s) => s.status === 'pending').length;

  return (
    <DashboardLayout title="Cost Monitoring">
      {/* Stat Cards */}
      <section className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="TOTAL MAINTENANCE COST"
          prefix="Rp"
          value="4.285.000.000"
          trend={
            <>
              <TrendingUp size={14} className="text-[#4caf50]" />
              <span className="text-[0.75rem] text-[#4caf50] font-semibold">+12% vs last quarter</span>
            </>
          }
        />
        <StatCard
          label="MONTHLY COST (OCT 2026)"
          value={<><span className="text-[1.7rem]">Rp 842.150.000</span></>}
          highlight={false}
          trend={
            <>
              <Clock size={14} className="text-white/35" />
              <span className="text-[0.75rem] text-white/40 font-medium">Projected: Rp 900.000.000</span>
            </>
          }
        />
        <StatCard
          label="SPAREPART EXPENSES"
          prefix="Rp"
          value="1.520.400.000"
          highlight={false}
          trend={
            <>
              <AlertTriangle size={14} className="text-status-critical" />
              <span className="text-[0.75rem] text-status-critical font-semibold">Over budget by 4.2%</span>
            </>
          }
        />
      </section>

      {/* Approve Spare Parts */}
      <section className="panel p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1.05rem] font-bold text-[#e8e8e8]">Approve Spare Parts</h2>
          {pendingCount > 0 && (
            <StatusBadge variant="pending" pill={false}>
              {pendingCount} PENDING ACTIONS
            </StatusBadge>
          )}
        </div>
        <DataTable
          columns={sparePartsColumns}
          data={spareParts}
          renderRow={(part, idx) => (
            <tr key={idx} className="table-row-hover">
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                <strong className="block text-djati-text-bright font-bold text-[0.86rem]">{part.name}</strong>
                <small className="text-[0.68rem] text-white/35">{part.pn}</small>
              </td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{part.equipment}</td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{part.date}</td>
              <td className="px-4 py-3.5 text-[0.84rem] text-[#ff9800] font-bold border-b border-white/[0.04]">{part.cost}</td>
              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                {part.status === 'pending' ? (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleAction(idx, 'approved')} className="btn-success-outline px-3.5 py-1.5 text-[0.72rem] !rounded-md whitespace-nowrap">
                      APPROVE
                    </button>
                    <button onClick={() => handleAction(idx, 'rejected')} className="btn-danger-outline px-3.5 py-1.5 text-[0.72rem] !rounded-md whitespace-nowrap">
                      REJECT
                    </button>
                  </div>
                ) : (
                  <StatusBadge variant={part.status}>{part.status}</StatusBadge>
                )}
              </td>
            </tr>
          )}
        />
      </section>

      {/* Maintenance Cost History */}
      <section className="panel p-6">
        <h2 className="text-[1.05rem] font-bold text-[#e8e8e8] mb-5">Maintenance Cost History</h2>
        <DataTable
          columns={historyColumns}
          data={costHistoryData}
          renderRow={(row, idx) => (
            <tr key={idx} className="table-row-hover">
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                <strong className="block text-djati-text-bright font-bold text-[0.86rem]">{row.equip}</strong>
                <small className="text-[0.68rem] text-white/35">{row.serial}</small>
              </td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{row.date}</td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{row.spare}</td>
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">{row.labor}</td>
              <td className="px-4 py-3.5 text-[0.84rem] text-white font-bold border-b border-white/[0.04]">{row.total}</td>
            </tr>
          )}
        />
      </section>
    </DashboardLayout>
  );
}
