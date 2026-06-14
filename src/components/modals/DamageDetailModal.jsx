import { MessageSquare } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const API_STORAGE_URL = 'http://127.0.0.1:8000/storage';

function isEmptyValue(value) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    value === '-' ||
    String(value).trim().toLowerCase() === 'null' ||
    String(value).trim().toLowerCase() === 'undefined'
  );
}

function firstValid(...values) {
  return values.find((value) => !isEmptyValue(value)) || null;
}

function normalizeStatusValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');
}

function formatReadableText(value) {
  if (isEmptyValue(value)) return '-';

  return String(value)
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (isEmptyValue(value)) return '-';

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
  if (isEmptyValue(value)) {
    return '-';
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `${value}${suffix}`;
  }

  return `${number.toFixed(2)}${suffix}`;
}

function hasKpi(data) {
  return [data?.mttr, data?.mtbf, data?.ma].some(
    (value) => !isEmptyValue(value)
  );
}

function getInitials(name) {
  if (isEmptyValue(name)) return '?';

  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getUserName(user) {
  return firstValid(
    user?.username,
    user?.name,
    user?.full_name,
    user?.email
  );
}

function parseTechnicianResponseNote(note) {
  if (isEmptyValue(note)) {
    return {
      mechanic: null,
      priority: null,
      note: null,
    };
  }

  const text = String(note);

  const mechanicMatch = text.match(/Mechanic:\s*([^|]+)/i);
  const priorityMatch = text.match(/Priority:\s*([^|]+)/i);
  const notesMatch = text.match(/Notes:\s*(.+)$/i);

  return {
    mechanic: mechanicMatch?.[1]?.trim() || null,
    priority: priorityMatch?.[1]?.trim() || null,
    note: notesMatch?.[1]?.trim() || null,
  };
}

function getPriorityClass(priority) {
  const value = normalizeStatusValue(priority);

  if (['critical', 'fatal'].includes(value)) {
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  }

  if (value === 'high') {
    return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
  }

  if (value === 'medium') {
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
  }

  if (value === 'low') {
    return 'bg-green-500/10 text-green-400 border-green-500/30';
  }

  return 'bg-white/[0.04] text-djati-muted border-djati-border';
}

function getImagePath(data) {
  return firstValid(
    data?.image,
    data?.imageUrl,
    data?.damageImage,
    data?.damage_image,
    data?.photo,
    data?.image_path,
    data?.raw?.image_url,
    data?.raw?.imageUrl,
    data?.raw?.damage_image_url,
    data?.raw?.damageImageUrl,
    data?.raw?.photo_url,
    data?.raw?.photoUrl,
    data?.raw?.image,
    data?.raw?.damage_image,
    data?.raw?.damageImage,
    data?.raw?.photo,
    data?.raw?.image_path,
    data?.raw?.imagePath
  );
}

function getImageUrl(path) {
  if (isEmptyValue(path)) {
    return null;
  }

  const pathString = String(path);

  if (pathString.startsWith('http')) {
    return pathString;
  }

  let cleanPath = pathString.replace(/^\/+/, '');

  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.replace(/^storage\//, '');
  }

  return `${API_STORAGE_URL}/${cleanPath}`;
}

function getStatusCandidates(data, status) {
  return [
    status,
    data?.rawStatus,
    data?.bookingStatus,
    data?.rawBookingStatus,
    data?.raw?.status,
    data?.raw?.computed_status,
    data?.raw?.booking_status,
    data?.raw?.service_booking_status,
    data?.raw?.latest_service_booking?.status,
    data?.raw?.service_booking?.status,
    data?.raw?.booking?.status,
    data?.raw?.latest_technician_response?.status,
  ].map(normalizeStatusValue);
}

function isCompletedStatus(data, status) {
  const values = getStatusCandidates(data, status);

  return values.some((value) =>
    ['selesai', 'finished', 'completed', 'complete'].includes(value)
  );
}

function isWaitingPartsStatus(data, status) {
  const values = getStatusCandidates(data, status);

  return values.some((value) =>
    [
      'waiting_parts',
      'on_hold',
      'butuh_followup_admin',
      'butuh_followup',
      'menunggu_sparepart',
    ].includes(value)
  );
}

function isStartedOrInProgressStatus(data, status) {
  const values = getStatusCandidates(data, status);

  return values.some((value) =>
    [
      'proses',
      'diproses',
      'ongoing',
      'in_progress',
      'progress',
      'started',
      'start_job',
      'job_started',
      'repair_started',
      'technician_started',
      'working',
      'on_progress',
      'butuh_followup_admin',
      'butuh_followup',
      'waiting_parts',
      'menunggu_sparepart',
      'on_hold',
    ].includes(value)
  );
}

function isCanceledOrRejected(data, status) {
  const values = getStatusCandidates(data, status);

  return values.some((value) =>
    [
      'cancel',
      'canceled',
      'cancelled',
      'dibatalkan',
      'reject',
      'rejected',
      'ditolak',
    ].includes(value)
  );
}

function getLatestBooking(data) {
  const raw = data?.raw || {};

  return (
    data?.latestServiceBooking ||
    raw?.latest_service_booking ||
    raw?.latestServiceBooking ||
    raw?.service_booking ||
    raw?.serviceBooking ||
    raw?.booking ||
    {}
  );
}

function getLatestTechnicianResponse(data) {
  const raw = data?.raw || {};

  return (
    data?.latestTechnicianResponse ||
    raw?.latest_technician_response ||
    raw?.latestTechnicianResponse ||
    raw?.technician_response ||
    raw?.technicianResponse ||
    {}
  );
}

function getTechnicianName(data, isProcessed) {
  const raw = data?.raw || {};
  const latestResponse = getLatestTechnicianResponse(data);
  const latestBooking = getLatestBooking(data);
  const repair = data?.repair || raw?.repair || {};

  const noteAdmin =
    raw?.note_admin ||
    raw?.admin_note ||
    latestBooking?.note_admin ||
    latestBooking?.admin_note ||
    '';

  const parsedNote = parseTechnicianResponseNote(noteAdmin);

  const name = firstValid(
    data?.technicianName,
    data?.mechanic,

    getUserName(data?.technician),
    getUserName(data?.technician_user),

    latestResponse?.technician_name,
    latestResponse?.mechanic,
    getUserName(latestResponse?.technician),

    raw?.technician_name,
    raw?.mechanic,
    getUserName(raw?.technician),
    getUserName(raw?.technician_user),

    latestBooking?.technician_name,
    latestBooking?.mechanic,
    getUserName(latestBooking?.technician),
    getUserName(latestBooking?.technician_user),

    repair?.technician_name,
    repair?.mechanic,
    getUserName(repair?.technician),
    getUserName(repair?.technician_user),

    parsedNote.mechanic
  );

  if (name) return name;

  return isProcessed ? 'Belum tercatat' : '-';
}

function getTechnicianNote(data) {
  const raw = data?.raw || {};
  const latestResponse = getLatestTechnicianResponse(data);
  const latestBooking = getLatestBooking(data);

  return (
    firstValid(
      data?.technicianNote,
      data?.response_note,
      data?.note,

      latestResponse?.note,
      latestResponse?.response_note,
      latestResponse?.technician_note,

      latestBooking?.technician_note,
      latestBooking?.note_admin,
      latestBooking?.admin_note,
      latestBooking?.note,

      raw?.note,
      raw?.response_note,
      raw?.technician_note,
      raw?.note_admin,
      raw?.admin_note
    ) || '-'
  );
}

function getPriorityFromData(data, technicianNote) {
  const raw = data?.raw || {};
  const latestBooking = getLatestBooking(data);
  const latestResponse = getLatestTechnicianResponse(data);

  const parsedTechnicianNote = parseTechnicianResponseNote(technicianNote);

  const rawNoteAdmin =
    raw?.note_admin ||
    raw?.admin_note ||
    latestBooking?.note_admin ||
    latestBooking?.admin_note ||
    '';

  const parsedNoteAdmin = parseTechnicianResponseNote(rawNoteAdmin);

  return firstValid(
    data?.priority,
    data?.severity,
    data?.severityLevel,
    data?.severity_level,

    raw?.priority,
    raw?.severity,
    raw?.severity_level,
    raw?.damage_severity,

    latestBooking?.priority,
    latestBooking?.severity,
    latestBooking?.severity_level,

    latestResponse?.priority,
    latestResponse?.severity,
    latestResponse?.severity_level,
    latestResponse?.damage_severity,

    parsedTechnicianNote.priority,
    parsedNoteAdmin.priority
  );
}

function getSeverityLevel(data, isCompleted, technicianNote) {
  const raw = data?.raw || {};
  const latestResponse = getLatestTechnicianResponse(data);
  const latestBooking = getLatestBooking(data);

  const parsedTechnicianNote = parseTechnicianResponseNote(technicianNote);

  const severity = firstValid(
    data?.severity,
    data?.severityLevel,
    data?.severity_level,

    raw?.severity,
    raw?.severity_level,
    raw?.damage_severity,

    latestResponse?.severity,
    latestResponse?.severity_level,
    latestResponse?.damage_severity,

    latestBooking?.priority,
    latestBooking?.severity,
    latestBooking?.severity_level,

    parsedTechnicianNote.priority
  );

  if (severity) return severity;

  return isCompleted ? 'Belum ditentukan' : '-';
}

function getSpareParts(data) {
  const raw = data?.raw || {};

  const candidates = [
    data?.spareParts,
    data?.requestedSpareParts,
    data?.partUsages,
    data?.part_usages,
    data?.sparePartUsages,
    data?.spare_part_usages,
    data?.usedParts,
    data?.used_parts,
    data?.partsUsed,
    data?.parts_used,

    raw?.spareParts,
    raw?.spare_parts,
    raw?.requested_spare_parts,
    raw?.requestedSpareParts,
    raw?.part_usages,
    raw?.partUsages,
    raw?.spare_part_usages,
    raw?.sparePartUsages,
    raw?.used_parts,
    raw?.usedParts,
    raw?.parts_used,
    raw?.partsUsed,
    raw?.parts,

    raw?.repair?.part_usages,
    raw?.repair?.partUsages,
    raw?.repair?.spare_part_usages,
    raw?.repair?.sparePartUsages,
    raw?.repair?.used_parts,
    raw?.repair?.parts_used,

    raw?.latest_repair?.part_usages,
    raw?.latestRepair?.partUsages,

    raw?.latest_technician_response?.part_usages,
    raw?.latestTechnicianResponse?.partUsages,
    raw?.technician_response?.part_usages,
    raw?.technicianResponse?.partUsages,

    raw?.latest_service_booking?.part_usages,
    raw?.latestServiceBooking?.partUsages,
    raw?.service_booking?.part_usages,
    raw?.serviceBooking?.partUsages,
    raw?.booking?.part_usages,
  ];

  const found = candidates.find((item) => Array.isArray(item));

  return found || [];
}

export default function DamageDetailModal({
  data,
  onClose,
  onApprove,
  onReject,
}) {
  if (!data) return null;

  const equipmentName =
    firstValid(
      data.equipmentName,
      data.equipName,
      data.equip,
      data.raw?.vehicle?.equipment_name,
      data.raw?.vehicle?.name
    ) || 'Unknown Unit';

  const plateNumber =
    firstValid(
      data.plateNumber,
      data.raw?.vehicle?.plate_number,
      data.raw?.vehicle?.plate
    ) || '-';

  const driverName =
    firstValid(
      data.driverName,
      data.operator,
      data.raw?.driver?.username,
      data.raw?.driver?.name,
      data.raw?.driver?.full_name
    ) || '-';

  const description =
    firstValid(data.description, data.raw?.description) || '-';

  const damageType =
    firstValid(data.damageType, data.raw?.damage_type) || '-';

  const status =
    firstValid(
      data.status,
      data.rawStatus,
      data.raw?.computed_status,
      data.raw?.latest_technician_response?.status,
      data.raw?.status,
      data.bookingStatus,
      data.raw?.latest_service_booking?.status,
      data.raw?.service_booking?.status,
      data.raw?.booking?.status
    ) || 'Reported';

  const isCompleted = isCompletedStatus(data, status);
  const isWaitingParts = isWaitingPartsStatus(data, status);
  const isCanceledRejected = isCanceledOrRejected(data, status);
  const isStartedOrInProgress = isStartedOrInProgressStatus(data, status);

  const isProcessed = isCompleted || isWaitingParts || isStartedOrInProgress;

  const technicianName = getTechnicianName(data, isProcessed);
  const technicianNote = getTechnicianNote(data);

  const parsedTechnicianNote = parseTechnicianResponseNote(technicianNote);

  const displayTechnicianName =
    firstValid(parsedTechnicianNote.mechanic, technicianName) || '-';

  const displayPriority =
    firstValid(
      parsedTechnicianNote.priority,
      getPriorityFromData(data, technicianNote)
    ) || null;

  const displayTechnicianNote =
    firstValid(parsedTechnicianNote.note, technicianNote) || '-';

  const hasTechnicianResponse =
    !isEmptyValue(displayTechnicianName) ||
    !isEmptyValue(displayTechnicianNote);

  const submitDate =
    firstValid(
      data.submitDate,
      data.createdAt,
      data.created_at,
      data.date,
      data.raw?.created_at,
      data.raw?.reported_at
    ) || '-';

  const spareParts = getSpareParts(data);

  const reportId = firstValid(data.id, data.damageReportId, data.raw?.id);

  const imagePath = getImagePath(data);
  const imageUrl = getImageUrl(imagePath);

  const severityLevel = getSeverityLevel(data, isCompleted, technicianNote);
  const normalizedSeverity = normalizeStatusValue(severityLevel);

  const severityClassName =
    normalizedSeverity.includes('critical') ||
    normalizedSeverity.includes('fatal') ||
    normalizedSeverity.includes('high')
      ? 'text-status-critical'
      : normalizedSeverity === 'belum_ditentukan'
      ? 'text-djati-muted'
      : 'text-djati-amber';

  const showKpi = hasKpi(data);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-djati-panel border border-djati-border-amber rounded-2xl w-full max-w-[880px] max-h-[90vh] flex flex-col shadow-modal">
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

        <div className="grid grid-cols-2 overflow-y-auto flex-1">
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

                  <div className="mt-2 text-[0.7rem] text-djati-muted">
                    Klik gambar untuk membuka ukuran penuh.
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
                  <strong className="text-djati-text-bright">
                    Damage Type:
                  </strong>{' '}
                  {damageType}
                </div>
                <div>{description}</div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                TECHNICIAN RESPONSE
              </h4>

              {hasTechnicianResponse ? (
                <div className="bg-white/[0.03] border border-djati-border rounded-[12px] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2c36] border border-djati-border-light flex items-center justify-center text-[0.78rem] font-extrabold text-djati-amber flex-shrink-0">
                      {getInitials(displayTechnicianName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[0.65rem] text-djati-muted font-semibold uppercase tracking-wider">
                            Assigned Technician
                          </p>
                          <h5 className="text-[0.9rem] font-bold text-djati-text-bright mt-0.5 truncate">
                            {formatReadableText(displayTechnicianName)}
                          </h5>
                        </div>

                        {!isEmptyValue(displayPriority) && (
                          <span
                            className={`px-3 py-1 rounded-full border text-[0.66rem] font-bold uppercase tracking-wide whitespace-nowrap ${getPriorityClass(
                              displayPriority
                            )}`}
                          >
                            {formatReadableText(displayPriority)}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 rounded-lg bg-black/10 border border-white/[0.04] px-3 py-3">
                        <p className="text-[0.65rem] text-djati-muted font-semibold uppercase tracking-wider mb-1">
                          Response Note
                        </p>
                        <p className="text-[0.82rem] leading-relaxed text-white/75 break-words">
                          {!isEmptyValue(displayTechnicianNote)
                            ? displayTechnicianNote
                            : 'Belum ada catatan dari teknisi.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-djati-border rounded-[10px] px-4 py-3 text-[0.82rem] text-white/50">
                  Belum ada respons teknisi.
                </div>
              )}
            </div>

            <div>
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                SPARE PART USAGE
              </h4>

              <div className="flex flex-col gap-2">
                {spareParts.length > 0 ? (
                  spareParts.map((p, index) => {
                    const partName =
                      firstValid(
                        p.name,
                        p.part_name,
                        p.spare_part_name,
                        p.item_name,
                        p.part?.name,
                        p.part?.part_name,
                        p.spare_part?.name,
                        p.sparePart?.name,
                        p.item?.name
                      ) || 'Unknown Part';

                    const partCode =
                      firstValid(
                        p.code,
                        p.part_code,
                        p.spare_part_code,
                        p.item_code,
                        p.part?.code,
                        p.part?.part_code,
                        p.spare_part?.code,
                        p.sparePart?.code,
                        p.item?.code
                      ) || '-';

                    const partQty =
                      firstValid(
                        p.quantity,
                        p.qty,
                        p.used_qty,
                        p.usedQty,
                        p.amount
                      ) || 1;

                    const partStatus =
                      firstValid(
                        p.status,
                        p.approval_status,
                        p.usage_status
                      ) || 'used';

                    return (
                      <div
                        key={
                          p.id ||
                          p.part_id ||
                          p.spare_part_id ||
                          p.code ||
                          index
                        }
                        className="flex items-center justify-between gap-4 bg-white/[0.03] border border-djati-border rounded-[10px] px-4 py-3"
                      >
                        <div>
                          <strong className="block text-[0.82rem] font-semibold text-djati-text-bright">
                            {partName}
                          </strong>

                          <small className="text-[0.68rem] text-white/35 mt-0.5 block">
                            Code: {partCode}
                          </small>

                          <small className="text-[0.68rem] text-white/35 mt-0.5 block">
                            Qty: {partQty}
                          </small>
                        </div>

                        <StatusBadge variant={partStatus}>
                          {formatReadableText(partStatus)}
                        </StatusBadge>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white/[0.03] border border-djati-border rounded-[10px] px-4 py-3 text-[0.82rem] text-white/50">
                    Belum ada pemakaian spare part.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase mb-3">
                EQUIPMENT INFO
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'EQUIPMENT NAME', value: equipmentName },
                  { label: 'PLATE NUMBER', value: plateNumber },
                  {
                    label: 'TYPE',
                    value:
                      firstValid(
                        data.equipType,
                        data.raw?.vehicle?.type,
                        data.raw?.vehicle?.vehicle_type
                      ) || '-',
                  },
                  {
                    label: 'HOUR METER',
                    value:
                      firstValid(
                        data.hourMeter,
                        data.raw?.vehicle?.hour_meter,
                        data.raw?.hour_meter
                      ) || '-',
                  },
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
                  {
                    label: 'Submission Date',
                    value: formatDate(submitDate),
                    className: '',
                  },
                  {
                    label: 'Severity Level',
                    value: formatReadableText(severityLevel),
                    className: severityClassName,
                  },
                  {
                    label: 'Report Status',
                    value: formatReadableText(status),
                    className: 'text-djati-amber',
                  },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between gap-4 py-3 ${
                      i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''
                    }`}
                  >
                    <span className="text-[0.82rem] text-djati-muted">
                      {row.label}
                    </span>
                    <strong
                      className={`text-[0.82rem] font-semibold text-djati-text-bright text-right break-all ${row.className}`}
                    >
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
                {showKpi ? (
                  [
                    { label: 'MTTR', value: formatKpi(data.mttr, ' hrs') },
                    { label: 'MTBF', value: formatKpi(data.mtbf, ' hrs') },
                    { label: 'MA', value: formatKpi(data.ma, '%') },
                  ].map((row, i, arr) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between py-3 ${
                        i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''
                      }`}
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
                    KPI belum tersedia untuk laporan ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 px-6 py-5 border-t border-djati-border">
          {onReject &&
            !isCompleted &&
            !isCanceledRejected &&
            !isStartedOrInProgress && (
              <button
                onClick={() => onReject(reportId)}
                className="btn-danger-outline flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase"
              >
                REJECT REPORT
              </button>
            )}

          {onApprove && isWaitingParts && !isCanceledRejected && (
            <button
              onClick={() => onApprove(reportId)}
              className="btn-primary flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase !from-[#ff9800] !to-[#f57c00] text-white"
            >
              APPROVE FOLLOW-UP
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-ghost flex-1 py-3.5 px-6 text-[0.85rem] font-extrabold tracking-wider uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}