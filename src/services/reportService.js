import api from './api';

/**
 * ===============================
 * DAMAGE REPORT SERVICE (ADMIN)
 * ===============================
 */

/**
 * Normalize status backend ke label UI admin.
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

    case 'proses':
    case 'diproses':
    case 'ongoing':
    case 'in_progress':
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

    case 'fatal':
      return 'Fatal';

    default:
      return status || 'Reported';
  }
}

/**
 * Ambil response teknisi terbaru.
 */
function getLatestTechnicianResponse(report) {
  if (report?.latest_technician_response) {
    return report.latest_technician_response;
  }

  if (Array.isArray(report?.technician_responses)) {
    return report.technician_responses[report.technician_responses.length - 1] || null;
  }

  return null;
}

/**
 * Ambil status asli dari report.
 */
function getRawReportStatus(report) {
  return (
    report?.computed_status ||
    report?.latest_technician_response?.status ||
    report?.status ||
    'menunggu'
  );
}

/**
 * Ambil path gambar dari berbagai kemungkinan field backend.
 */
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

/**
 * Normalize item damage report agar UI admin lebih mudah pakai.
 */
export function normalizeDamageReport(report) {
  const latest = getLatestTechnicianResponse(report);
  const rawStatus = getRawReportStatus(report);
  const image = getDamageImage(report);

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

    rawStatus,
    status: normalizeStatus(rawStatus),

    technicianName:
      latest?.technician?.username ||
      latest?.technician?.name ||
      '-',

    technicianNote:
      latest?.note ||
      latest?.response_note ||
      '-',

    mttr: latest?.mttr ?? null,
    mtbf: latest?.mtbf ?? null,
    ma: latest?.ma ?? null,

    repairHistorySaved:
      report?.repair_history_saved ?? false,

    repairHistory:
      report?.repair_history ?? null,

    latestTechnicianResponse: latest,
    technicianResponses: report?.technician_responses || [],

    raw: report,
  };
}

/**
 * Normalize response list dari Laravel:
 * - bisa langsung array
 * - bisa { data: [...] }
 * - bisa pagination { data: { data: [...] } }
 */
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

/**
 * Get all damage reports (admin)
 * GET /admin/damage-reports
 */
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

/**
 * Get report detail by ID
 * GET /admin/damage-reports/{id}
 */
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

/**
 * Mark report as completed / approve follow-up
 * POST /admin/damage-reports/{id}/complete
 */
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

/**
 * Approve follow-up alias endpoint baru.
 * POST /admin/damage-reports/{id}/approve-follow-up
 */
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

/**
 * Reject report
 * POST /admin/damage-reports/{id}/reject
 *
 * Catatan:
 * Pastikan route backend /reject memang tersedia.
 * Kalau belum ada, function ini akan tetap error 404 dari backend.
 */
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

/**
 * Get latest reports for dashboard
 * GET /admin/damage-reports?limit=5
 */
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

/**
 * Get follow-up reports
 * GET /admin/damage-reports/follow-ups/list
 */
export async function getFollowUpReports() {
  try {
    const { data } = await api.get('/admin/damage-reports/follow-ups/list');

    return normalizeListResponse(data);
  } catch (error) {
    console.error('GET FOLLOW UP REPORTS ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

/**
 * Get finished repair reports from technician
 * GET /admin/damage-reports/finished-repairs
 *
 * Data ini berasal dari technician_responses status=selesai.
 */
export async function getFinishedRepairReports() {
  try {
    const { data } = await api.get('/admin/damage-reports/finished-repairs');

    return normalizeListResponse(data);
  } catch (error) {
    console.error('GET FINISHED REPAIR REPORTS ERROR:', error.response || error);
    throw error.response?.data || error.message;
  }
}

/**
 * Store finished repair history to admin repairs table
 * POST /admin/damage-reports/{id}/store-finished-repair
 *
 * Dipakai setelah teknisi update status Finished/selesai.
 */
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