import api from './api';

/**
 * ===============================
 * DAMAGE REPORT SERVICE (ADMIN)
 * ===============================
 */

function normalizeStatus(status) {
  const value = String(status || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');

  switch (value) {
    case 'menunggu':
    case 'reported':
    case 'waiting':
      return 'Reported';

    case 'requested':
    case 'pending':
      return 'Requested';

    case 'approved':
    case 'scheduled':
      return 'Scheduled';

    case 'rescheduled':
      return 'Rescheduled';

    case 'proses':
    case 'diproses':
    case 'ongoing':
    case 'in_progress':
    case 'progress':
    case 'started':
    case 'start_job':
    case 'job_started':
    case 'repair_started':
    case 'technician_started':
    case 'working':
    case 'on_progress':
      return 'In Progress';

    case 'butuh_followup_admin':
    case 'butuh_followup':
    case 'menunggu_sparepart':
    case 'waiting_parts':
    case 'on_hold':
      return 'Waiting Parts';

    case 'approved_followup_admin':
      return 'Follow-up Approved';

    case 'selesai':
    case 'finished':
    case 'completed':
    case 'complete':
      return 'Completed';

    case 'cancel':
    case 'canceled':
    case 'cancelled':
    case 'dibatalkan':
      return 'Canceled';

    case 'reject':
    case 'rejected':
    case 'ditolak':
      return 'Rejected';

    case 'fatal':
      return 'Fatal';

    default:
      return status || 'Reported';
  }
}

function getLatestTechnicianResponse(report) {
  if (report?.latest_technician_response) {
    return report.latest_technician_response;
  }

  if (Array.isArray(report?.technician_responses)) {
    return report.technician_responses[report.technician_responses.length - 1] || null;
  }

  return null;
}

function getLatestServiceBooking(report) {
  if (report?.latest_service_booking) {
    return report.latest_service_booking;
  }

  if (report?.service_booking) {
    return report.service_booking;
  }

  if (report?.booking) {
    return report.booking;
  }

  if (Array.isArray(report?.service_bookings) && report.service_bookings.length > 0) {
    return report.service_bookings[report.service_bookings.length - 1];
  }

  if (Array.isArray(report?.bookings) && report.bookings.length > 0) {
    return report.bookings[report.bookings.length - 1];
  }

  return null;
}

function getRawBookingStatus(report) {
  const booking = getLatestServiceBooking(report);

  return (
    booking?.status ||
    report?.booking_status ||
    report?.service_booking_status ||
    null
  );
}

function getRawReportStatus(report) {
  const bookingStatus = getRawBookingStatus(report);

  const normalizedBookingStatus = String(bookingStatus || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');

  if (
    normalizedBookingStatus === 'cancel' ||
    normalizedBookingStatus === 'canceled' ||
    normalizedBookingStatus === 'cancelled' ||
    normalizedBookingStatus === 'dibatalkan' ||
    normalizedBookingStatus === 'reject' ||
    normalizedBookingStatus === 'rejected' ||
    normalizedBookingStatus === 'ditolak'
  ) {
    return bookingStatus;
  }

  return (
    report?.computed_status ||
    report?.latest_technician_response?.status ||
    bookingStatus ||
    report?.status ||
    'menunggu'
  );
}

function getDamageImage(report) {
  return (
    report?.image ||
    report?.damage_image ||
    report?.damageImage ||
    report?.photo ||
    report?.image_url ||
    report?.imageUrl ||
    null
  );
}

function getSpareParts(report, latest) {
  const possibleSources = [
    report?.spare_parts,
    report?.spareParts,
    report?.requested_spare_parts,
    report?.requestedSpareParts,
    report?.parts,
    report?.repair_parts,
    latest?.spare_parts,
    latest?.spareParts,
    latest?.requested_spare_parts,
    latest?.requestedSpareParts,
    latest?.parts,
  ];

  const source = possibleSources.find((item) => Array.isArray(item));

  if (!source) return [];

  return source.map((part) => ({
    id: part?.id,

    name:
      part?.name ||
      part?.part_name ||
      part?.spare_part_name ||
      part?.item_name ||
      part?.spare_part?.name ||
      part?.part?.name ||
      'Unknown Part',

    part:
      part?.part_code ||
      part?.spare_part_code ||
      part?.code ||
      part?.part ||
      part?.spare_part?.code ||
      part?.part?.code ||
      '-',

    code:
      part?.part_code ||
      part?.spare_part_code ||
      part?.code ||
      part?.spare_part?.code ||
      part?.part?.code ||
      '-',

    quantity:
      part?.quantity ||
      part?.qty ||
      part?.jumlah ||
      1,

    status:
      part?.status ||
      part?.approval_status ||
      part?.pivot?.status ||
      'pending',

    raw: part,
  }));
}

export function normalizeDamageReport(report) {
  const latest = getLatestTechnicianResponse(report);
  const booking = getLatestServiceBooking(report);
  const rawBookingStatus = getRawBookingStatus(report);
  const rawStatus = getRawReportStatus(report);
  const image = getDamageImage(report);
  const spareParts = getSpareParts(report, latest);

  return {
    id: report?.id,
    damageReportId: report?.id,

    equipmentName:
      report?.vehicle?.equipment_name ||
      report?.equipment_name ||
      report?.vehicle_name ||
      'Unknown Unit',

    equip:
      report?.vehicle?.equipment_name ||
      report?.equipment_name ||
      report?.vehicle_name ||
      'Unknown Unit',

    plateNumber:
      report?.vehicle?.plate_number ||
      report?.plate_number ||
      '-',

    driverName:
      report?.driver?.username ||
      report?.driver?.name ||
      report?.operator_name ||
      report?.operator ||
      '-',

    operator:
      report?.driver?.username ||
      report?.driver?.name ||
      report?.operator_name ||
      report?.operator ||
      '-',

    damageType:
      report?.damage_type ||
      report?.damageType ||
      '-',

    description:
      report?.description ||
      '-',

    image,
    damageImage: image,
    damage_image: image,
    photo: image,

    date:
      report?.created_at ||
      '-',

    createdAt:
      report?.created_at ||
      '-',

    submitDate:
      report?.created_at ||
      '-',

    rawStatus,
    status: normalizeStatus(rawStatus),

    booking,
    serviceBooking: booking,
    rawBookingStatus,
    bookingStatus: normalizeStatus(rawBookingStatus),

    technicianName:
      latest?.technician?.username ||
      latest?.technician?.name ||
      '-',

    technicianNote:
      latest?.note ||
      latest?.response_note ||
      '-',

    spareParts,

    equipType:
      report?.vehicle?.type ||
      report?.vehicle?.vehicle_type ||
      report?.type ||
      '-',

    hourMeter:
      report?.vehicle?.hour_meter ||
      report?.hour_meter ||
      '-',

    severity:
      report?.severity ||
      report?.severity_level ||
      '-',

    mttr:
      latest?.mttr ??
      report?.mttr ??
      null,

    mtbf:
      latest?.mtbf ??
      report?.mtbf ??
      null,

    ma:
      latest?.ma ??
      report?.ma ??
      null,

    repairHistorySaved:
      report?.repair_history_saved ?? false,

    repairHistory:
      report?.repair_history ?? null,

    latestTechnicianResponse: latest,
    technicianResponses: report?.technician_responses || [],

    raw: report,
  };
}

function normalizeListResponse(data) {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.data?.data)
        ? data.data.data
        : [];

  return raw.map(normalizeDamageReport);
}

export async function getReports(filters = {}) {
  try {
    const { data } = await api.get('/admin/damage-reports', {
      params: filters,
    });

    console.log('GET REPORTS RAW:', data);

    return normalizeListResponse(data);
  } catch (error) {
    console.error('GET REPORTS ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

export async function getReportById(id) {
  try {
    const { data } = await api.get(`/admin/damage-reports/${id}`);

    console.log('GET REPORT BY ID RAW:', data);

    const raw = data?.data ?? data;

    return normalizeDamageReport(raw);
  } catch (error) {
    console.error('GET REPORT BY ID ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

export async function approveReport(id, adminNote = '') {
  try {
    const { data } = await api.post(
      `/admin/damage-reports/${id}/complete`,
      {
        admin_note: adminNote,
      }
    );

    return data;
  } catch (error) {
    console.error('APPROVE REPORT ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

export async function approveFollowUp(id, adminNote = '') {
  try {
    const { data } = await api.post(
      `/admin/damage-reports/${id}/approve-follow-up`,
      {
        admin_note: adminNote,
      }
    );

    return data;
  } catch (error) {
    console.error('APPROVE FOLLOW UP ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

export async function rejectReport(id, reason = '') {
  try {
    const { data } = await api.post(
      `/admin/damage-reports/${id}/reject`,
      {
        reason,
      }
    );

    return data;
  } catch (error) {
    console.error('REJECT REPORT ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

export async function getLatestReports() {
  try {
    const { data } = await api.get('/admin/damage-reports', {
      params: { limit: 5 },
    });

    return normalizeListResponse(data);
  } catch (error) {
    console.error('GET LATEST REPORTS ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

export async function getFollowUpReports() {
  try {
    const { data } = await api.get('/admin/damage-reports/follow-ups/list');

    return normalizeListResponse(data);
  } catch (error) {
    console.error('GET FOLLOW UP REPORTS ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

export async function getFinishedRepairReports() {
  try {
    const { data } = await api.get('/admin/damage-reports/finished-repairs');

    return normalizeListResponse(data);
  } catch (error) {
    console.error('GET FINISHED REPAIR REPORTS ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

export async function storeFinishedRepairHistory(id, payload = {}) {
  try {
    const { data } = await api.post(
      `/admin/damage-reports/${id}/store-finished-repair`,
      {
        admin_note: payload.admin_note ?? payload.adminNote ?? '',
        action: payload.action ?? '',
        cost: payload.cost ?? 0,
      }
    );

    return {
      success: true,
      message:
        data?.message ||
        'Finished repair history berhasil disimpan.',
      data,
      repair: data?.repair ?? null,
      damageReport: data?.damage_report ?? null,
    };
  } catch (error) {
    console.error('STORE FINISHED REPAIR ERROR:', error.response || error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Gagal menyimpan finished repair history.',
      error: error.response?.data || error,
    };
  }
}