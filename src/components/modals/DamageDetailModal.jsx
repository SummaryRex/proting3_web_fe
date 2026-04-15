import { MessageSquare } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

export default function DamageDetailModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-djati-panel border border-djati-border-amber rounded-2xl w-full max-w-[820px] max-h-[90vh] flex flex-col shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-djati-border">
          <h2 className="text-lg font-extrabold text-white">{data.id}</h2>
          <button onClick={onClose} className="btn-icon !border-djati-border-light text-white/60 hover:text-white text-xl">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 overflow-y-auto flex-1">
          {/* Left column */}
          <div className="p-6 border-r border-djati-border">
            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">DAMAGE DESCRIPTION</h4>
              <div className="bg-white/[0.03] border border-djati-border rounded-[10px] p-4 text-[0.82rem] leading-relaxed text-white/70">
                {data.description}
              </div>
            </div>
            <div>
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">REQUESTED SPARE PARTS</h4>
              <div className="flex flex-col gap-2">
                {data.spareParts.map((p) => (
                  <div key={p.part} className="flex items-center justify-between bg-white/[0.03] border border-djati-border rounded-[10px] px-4 py-3">
                    <div>
                      <strong className="block text-[0.82rem] font-semibold text-djati-text-bright">{p.name}</strong>
                      <small className="text-[0.68rem] text-white/35 mt-0.5 block">{p.part}</small>
                    </div>
                    <StatusBadge variant="pending">Pending</StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">EQUIPMENT INFO</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'EQUIPMENT NAME', value: data.equipName },
                  { label: 'ASSET ID', value: data.assetId },
                  { label: 'TYPE', value: data.equipType },
                  { label: 'HOUR METER', value: data.hourMeter },
                ].map((f) => (
                  <div key={f.label}>
                    <small className="block text-[0.62rem] font-semibold tracking-wider text-djati-muted uppercase mb-1">{f.label}</small>
                    <strong className="text-[0.85rem] font-bold text-djati-text-bright">{f.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">OPERATOR INFO</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2a2c36] flex items-center justify-center font-bold text-[0.82rem] text-white/65 flex-shrink-0">
                  {data.operatorInitials}
                </div>
                <div className="flex-1">
                  <strong className="block text-[0.85rem] font-bold text-djati-text-bright">{data.operator}</strong>
                  <small className="text-[0.72rem] text-djati-muted">Operator</small>
                </div>
                <button className="w-9 h-9 rounded-lg border border-[rgba(255,179,0,0.3)] bg-[rgba(255,179,0,0.08)] text-djati-amber cursor-pointer flex items-center justify-center flex-shrink-0 hover:bg-[rgba(255,179,0,0.18)] transition-colors">
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">REPORT DETAILS</h4>
              <div>
                {[
                  { label: 'Submission Date', value: data.submitDate, className: '' },
                  { label: 'Severity Level', value: data.severity, className: data.severity.includes('Critical') ? 'text-status-critical' : 'text-djati-amber' },
                  { label: 'Report Status', value: data.status, className: 'text-djati-amber' },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                    <span className="text-[0.82rem] text-djati-muted">{row.label}</span>
                    <strong className={`text-[0.82rem] font-semibold text-djati-text-bright ${row.className}`}>{row.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 px-6 py-5 border-t border-djati-border">
          <button className="btn-danger-outline flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase">
            REJECT REPORT
          </button>
          <button className="btn-primary flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase !from-[#ff9800] !to-[#f57c00] text-white">
            APPROVE REPORT
          </button>
        </div>
      </div>
    </div>
  );
}
