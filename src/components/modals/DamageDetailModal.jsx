import { MessageSquare } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const API_STORAGE_URL = 'http://127.0.0.1:8000/storage';

function formatDate(value) {
  if (!value || value === '-') return '-';

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return value;
  }
}

function formatKpi(value, suffix = '') {
  if (value === null || value === undefined || value === '' || value === 'null') {
    return '-';
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `${value}${suffix}`;
  }

  return `${number.toFixed(2)}${suffix}`;
}

function hasKpi(data) {
  return (
    data?.mttr !== null ||
    data?.mtbf !== null ||
    data?.ma !== null
  );
}

function getInitials(name) {
  if (!name || name === '-') return '?';

  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getImagePath(data) {
  return (
    data?.image ||
    data?.damageImage ||
    data?.damage_image ||
    data?.photo ||
    data?.raw?.image ||
    data?.raw?.damage_image ||
    null
  );
}

function getImageUrl(path) {
  if (!path || path === 'null' || path === '-') {
    return null;
  }

  if (String(path).startsWith('http')) {
    return path;
  }

  const cleanPath = String(path).replace(/^\/+/, '');

  return `${API_STORAGE_URL}/${cleanPath}`;
}

export default function DamageDetailModal({
  data,
  onClose,
  onApprove,
  onReject,
  onStoreFinishedRepair,
}) {
  if (!data) return null;

  const equipmentName =
    data.equipmentName ||
    data.equipName ||
    data.equip ||
    data.raw?.vehicle?.equipment_name ||
    'Unknown Unit';

  const plateNumber =
    data.plateNumber ||
    data.raw?.vehicle?.plate_number ||
    '-';

  const driverName =
    data.driverName ||
    data.operator ||
    data.raw?.driver?.username ||
    data.raw?.driver?.name ||
    '-';

  const description =
    data.description ||
    data.raw?.description ||
    '-';

  const damageType =
    data.damageType ||
    data.raw?.damage_type ||
    '-';

  const status =
    data.status ||
    data.rawStatus ||
    data.raw?.computed_status ||
    data.raw?.latest_technician_response?.status ||
    data.raw?.status ||
    'Reported';

  const technicianName =
    data.technicianName ||
    data.latestTechnicianResponse?.technician?.username ||
    data.raw?.latest_technician_response?.technician?.username ||
    '-';

  const technicianNote =
    data.technicianNote ||
    data.latestTechnicianResponse?.note ||
    data.raw?.latest_technician_response?.note ||
    '-';

  const submitDate =
    data.submitDate ||
    data.createdAt ||
    data.date ||
    data.raw?.created_at ||
    '-';

  const spareParts = Array.isArray(data.spareParts)
    ? data.spareParts
    : [];

  const reportId = data.id || data.damageReportId || data.raw?.id;

  const imagePath = getImagePath(data);
  const imageUrl = getImageUrl(imagePath);

  const isCompleted =
    status === 'Completed' ||
    status === 'Finished' ||
    data.rawStatus === 'selesai' ||
    data.raw?.computed_status === 'selesai';

  const isWaitingParts =
    status === 'Waiting Parts' ||
    status === 'On Hold' ||
    data.rawStatus === 'butuh_followup_admin' ||
    data.raw?.computed_status === 'butuh_followup_admin';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-djati-panel border border-djati-border-amber rounded-2xl w-full max-w-[880px] max-h-[90vh] flex flex-col shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-djati-border">
          <div>
            <h2 className="text-lg font-extrabold text-white">
              #{reportId || '-'}
            </h2>
            <p className="text-[0.75rem] text-djati-muted mt-1">
              {equipmentName} • Plate: {plateNumber}
            </p>
          </div>

          <button
            onClick={onClose}
            className="btn-icon !border-djati-border-light text-white/60 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 overflow-y-auto flex-1">
          {/* Left column */}
          <div className="p-6 border-r border-djati-border">
            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                DAMAGE PHOTO
              </h4>

              {imageUrl ? (
                <div className="bg-white/[0.03] border border-djati-border rounded-[10px] p-3">
                  <button
                    type="button"
                    onClick={() => window.open(imageUrl, '_blank')}
                    className="block w-full"
                    title="Open damage image"
                  >
                    <img
                      src={imageUrl}
                      alt={`Damage report ${reportId || ''}`}
                      className="w-full max-h-[260px] object-cover rounded-lg border border-djati-border-light hover:border-djati-amber transition-all"
                    />
                  </button>

                  <div className="mt-2 text-[0.7rem] text-djati-muted break-all">
                    {imagePath}
                  </div>
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-dashed border-djati-border rounded-[10px] px-4 py-8 text-center text-[0.82rem] text-white/50">
                  Gambar kerusakan belum tersedia.
                </div>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                DAMAGE DESCRIPTION
              </h4>

              <div className="bg-white/[0.03] border border-djati-border rounded-[10px] p-4 text-[0.82rem] leading-relaxed text-white/70">
                <div className="mb-2">
                  <strong className="text-djati-text-bright">Damage Type:</strong>{' '}
                  {damageType}
                </div>
                <div>{description}</div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                TECHNICIAN RESPONSE
              </h4>

              <div className="bg-white/[0.03] border border-djati-border rounded-[10px] p-4 text-[0.82rem] leading-relaxed text-white/70">
                <div className="mb-2">
                  <strong className="text-djati-text-bright">Technician:</strong>{' '}
                  {technicianName}
                </div>
                <div>
                  <strong className="text-djati-text-bright">Note:</strong>{' '}
                  {technicianNote}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                REQUESTED SPARE PARTS
              </h4>

              <div className="flex flex-col gap-2">
                {spareParts.length > 0 ? (
                  spareParts.map((p, index) => (
                    <div
                      key={p.part || p.id || index}
                      className="flex items-center justify-between bg-white/[0.03] border border-djati-border rounded-[10px] px-4 py-3"
                    >
                      <div>
                        <strong className="block text-[0.82rem] font-semibold text-djati-text-bright">
                          {p.name || p.part_name || 'Unknown Part'}
                        </strong>
                        <small className="text-[0.68rem] text-white/35 mt-0.5 block">
                          {p.part || p.code || '-'}
                        </small>
                      </div>

                      <StatusBadge variant={p.status || 'pending'}>
                        {p.status || 'Pending'}
                      </StatusBadge>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/[0.03] border border-djati-border rounded-[10px] px-4 py-3 text-[0.82rem] text-white/50">
                    Belum ada spare part yang diminta.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                EQUIPMENT INFO
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'EQUIPMENT NAME', value: equipmentName },
                  { label: 'PLATE NUMBER', value: plateNumber },
                  { label: 'TYPE', value: data.equipType || data.raw?.vehicle?.type || '-' },
                  { label: 'HOUR METER', value: data.hourMeter || data.raw?.vehicle?.hour_meter || '-' },
                ].map((f) => (
                  <div key={f.label}>
                    <small className="block text-[0.62rem] font-semibold tracking-wider text-djati-muted uppercase mb-1">
                      {f.label}
                    </small>
                    <strong className="text-[0.85rem] font-bold text-djati-text-bright">
                      {f.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                OPERATOR INFO
              </h4>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2a2c36] flex items-center justify-center font-bold text-[0.82rem] text-white/65 flex-shrink-0">
                  {data.operatorInitials || getInitials(driverName)}
                </div>

                <div className="flex-1">
                  <strong className="block text-[0.85rem] font-bold text-djati-text-bright">
                    {driverName}
                  </strong>
                  <small className="text-[0.72rem] text-djati-muted">
                    Driver
                  </small>
                </div>

                <button className="w-9 h-9 rounded-lg border border-[rgba(255,179,0,0.3)] bg-[rgba(255,179,0,0.08)] text-djati-amber cursor-pointer flex items-center justify-center flex-shrink-0 hover:bg-[rgba(255,179,0,0.18)] transition-colors">
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                REPORT DETAILS
              </h4>

              <div>
                {[
                  { label: 'Submission Date', value: formatDate(submitDate), className: '' },
                  { label: 'Severity Level', value: data.severity || '-', className: String(data.severity || '').includes('Critical') ? 'text-status-critical' : 'text-djati-amber' },
                  { label: 'Report Status', value: status, className: 'text-djati-amber' },
                  { label: 'Image Path', value: imagePath || '-', className: 'text-djati-muted' },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between gap-4 py-3 ${i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                  >
                    <span className="text-[0.82rem] text-djati-muted">
                      {row.label}
                    </span>
                    <strong className={`text-[0.82rem] font-semibold text-djati-text-bright text-right break-all ${row.className}`}>
                      {row.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                KPI ANALYTICS
              </h4>

              <div>
                {hasKpi(data) ? (
                  [
                    { label: 'MTTR', value: formatKpi(data.mttr, ' hrs') },
                    { label: 'MTBF', value: formatKpi(data.mtbf, ' hrs') },
                    { label: 'MA', value: formatKpi(data.ma, '%') },
                  ].map((row, i, arr) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                    >
                      <span className="text-[0.82rem] text-djati-muted">
                        {row.label}
                      </span>
                      <strong className="text-[0.82rem] font-semibold text-djati-text-bright">
                        {row.value}
                      </strong>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/[0.03] border border-djati-border rounded-[10px] px-4 py-3 text-[0.82rem] text-white/50">
                    KPI belum tersedia.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 px-6 py-5 border-t border-djati-border">
          {onReject && !isCompleted && (
            <button
              onClick={() => onReject(reportId)}
              className="btn-danger-outline flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase"
            >
              REJECT REPORT
            </button>
          )}

          {onApprove && isWaitingParts && (
            <button
              onClick={() => onApprove(reportId)}
              className="btn-primary flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase !from-[#ff9800] !to-[#f57c00] text-white"
            >
              APPROVE FOLLOW-UP
            </button>
          )}

          {onStoreFinishedRepair && isCompleted && (
            <button
              onClick={() => onStoreFinishedRepair(data)}
              className="btn-primary flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase !from-[#ff9800] !to-[#f57c00] text-white"
            >
              SAVE TO REPAIR HISTORY
            </button>
          )}

          {!onApprove && !onReject && !onStoreFinishedRepair && (
            <button
              onClick={onClose}
              className="btn-primary flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase !from-[#ff9800] !to-[#f57c00] text-white"
            >
              CLOSE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}