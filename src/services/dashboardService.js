import api from './api';

// ─────────────────────────────
// NORMALIZE DASHBOARD STATS
// ─────────────────────────────
const normalizeStats = (data) => ({
  drivers: data?.drivers ?? 0,
  technicians: data?.technicians ?? 0,
  vehicles: data?.vehicles ?? 0,
  followups: data?.followups ?? 0,
  parts: data?.parts ?? 0,
  transactions: data?.transactions ?? 0,
});

// ─────────────────────────────
// NORMALIZE STATUS
// ─────────────────────────────
const normalizeStatus = (status) => {
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

    case 'selesai':
    case 'finished':
    case 'completed':
    case 'complete':
      return 'Completed';

    case 'fatal':
      return 'Fatal';

    case 'approved_followup_admin':
      return 'Follow-up Approved';

    default:
      return status || 'Reported';
  }
};

// ─────────────────────────────
// GET RAW STATUS FROM DAMAGE REPORT
// ─────────────────────────────
const getReportStatus = (report) => {
  return (
    report?.computed_status ||
    report?.latest_technician_response?.status ||
    report?.status ||
    'menunggu'
  );
};

// ─────────────────────────────
// GET LATEST TECHNICIAN RESPONSE
// ─────────────────────────────
const getLatestTechnicianResponse = (report) => {
  if (report?.latest_technician_response) {
    return report.latest_technician_response;
  }

  if (Array.isArray(report?.technician_responses)) {
    return report.technician_responses[report.technician_responses.length - 1] || null;
  }

  return null;
};

// ─────────────────────────────
// NORMALIZE DAMAGE REPORT ITEM
// ─────────────────────────────
const normalizeDamageReport = (r) => {
  const latest = getLatestTechnicianResponse(r);
  const rawStatus = getReportStatus(r);

  return {
    id: r?.id,
    damageReportId: r?.id,

    equip:
      r?.vehicle?.equipment_name ||
      r?.vehicle_name ||
      r?.equipment_name ||
      'Unknown',

    plateNumber:
      r?.vehicle?.plate_number ||
      r?.plate_number ||
      '-',

    operator:
      r?.driver?.username ||
      r?.driver?.name ||
      r?.operator_name ||
      r?.operator ||
      '-',

    damageType:
      r?.damage_type ||
      '-',

    description:
      r?.description ||
      '-',

    date:
      r?.created_at ||
      '-',

    rawStatus,
    status: normalizeStatus(rawStatus),

    technician:
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

    latestTechnicianResponse: latest,
    technicianResponses: r?.technician_responses || [],
    raw: r,
  };
};

// ─────────────────────────────
// GET DASHBOARD STATS
// endpoint: GET /admin/dashboard
// ─────────────────────────────
export async function getDashboardStats() {
  try {
    const response = await api.get('/admin/dashboard');

    console.log('🔥 DASHBOARD RAW:', response.data);

    // Laravel bisa return langsung JSON atau wrapped
    const raw = response.data?.data ?? response.data;

    return normalizeStats(raw || {});
  } catch (error) {
    console.error('❌ DASHBOARD ERROR:', error.response || error);

    // biar UI tetap hidup (tidak blank screen)
    return normalizeStats({});
  }
}

// ─────────────────────────────
// GET LATEST REPORTS
// endpoint: GET /admin/damage-reports
// ─────────────────────────────
export async function getLatestReports() {
  try {
    const response = await api.get('/admin/damage-reports', {
      params: { limit: 5 },
    });

    console.log('🔥 LATEST REPORTS RAW:', response.data);

    const raw = response.data?.data ?? response.data;

    if (!Array.isArray(raw)) return [];

    return raw.map(normalizeDamageReport);
  } catch (error) {
    console.error('❌ LATEST REPORTS ERROR:', error.response || error);

    return []; // jangan crash UI
  }
}

// ─────────────────────────────
// GET FOLLOW UP REPORTS
// endpoint: GET /admin/damage-reports/follow-ups/list
// ─────────────────────────────
export async function getFollowUpReports() {
  try {
    const response = await api.get('/admin/damage-reports/follow-ups/list');

    console.log('🔥 FOLLOW UP REPORTS RAW:', response.data);

    const raw = response.data?.data ?? response.data;

    if (!Array.isArray(raw)) return [];

    return raw.map(normalizeDamageReport);
  } catch (error) {
    console.error('❌ FOLLOW UP REPORTS ERROR:', error.response || error);

    return [];
  }
}

// ─────────────────────────────
// GET FINISHED REPAIR REPORTS FROM TECHNICIAN
// endpoint: GET /admin/damage-reports/finished-repairs
// ─────────────────────────────
export async function getFinishedRepairReports() {
  try {
    const response = await api.get('/admin/damage-reports/finished-repairs');

    console.log('🔥 FINISHED REPAIR REPORTS RAW:', response.data);

    const raw = response.data?.data ?? response.data;

    if (!Array.isArray(raw)) return [];

    return raw.map(normalizeDamageReport);
  } catch (error) {
    console.error('❌ FINISHED REPAIR REPORTS ERROR:', error.response || error);

    return [];
  }
}

// ─────────────────────────────
// STORE FINISHED REPAIR TO ADMIN REPAIR HISTORY
// endpoint: POST /admin/damage-reports/{damageReport}/store-finished-repair
// ─────────────────────────────
export async function storeFinishedRepairHistory(damageReportId, payload = {}) {
  try {
    if (!damageReportId) {
      throw new Error('damageReportId tidak valid');
    }

    const response = await api.post(
      `/admin/damage-reports/${damageReportId}/store-finished-repair`,
      {
        admin_note: payload.admin_note ?? payload.adminNote ?? '',
        action: payload.action ?? '',
        cost: payload.cost ?? 0,
      }
    );

    console.log('✅ STORE FINISHED REPAIR RAW:', response.data);

    return {
      success: true,
      message:
        response.data?.message ||
        'Finished repair history berhasil disimpan.',
      data: response.data,
      repair: response.data?.repair ?? null,
      damageReport: response.data?.damage_report ?? null,
    };
  } catch (error) {
    console.error('❌ STORE FINISHED REPAIR ERROR:', error.response || error);

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

// ─────────────────────────────
// APPROVE FOLLOW UP
// endpoint: POST /admin/damage-reports/{damageReport}/approve-follow-up
// fallback legacy endpoint: /complete
// ─────────────────────────────
export async function approveFollowUp(damageReportId, adminNote = '') {
  try {
    if (!damageReportId) {
      throw new Error('damageReportId tidak valid');
    }

    const response = await api.post(
      `/admin/damage-reports/${damageReportId}/approve-follow-up`,
      {
        admin_note: adminNote,
      }
    );

    console.log('✅ APPROVE FOLLOW UP RAW:', response.data);

    return {
      success: true,
      message:
        response.data?.message ||
        'Follow-up berhasil disetujui.',
      data: response.data,
    };
  } catch (error) {
    console.error('❌ APPROVE FOLLOW UP ERROR:', error.response || error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Gagal approve follow-up.',
      error: error.response?.data || error,
    };
  }
}

// ─────────────────────────────
// OPTIONAL: CHART DATA (kalau backend ready)
// endpoint: /admin/dashboard/chart
// ─────────────────────────────
export async function getChartData() {
  try {
    const response = await api.get('/admin/dashboard/chart');

    const raw = response.data?.data ?? response.data;

    if (!Array.isArray(raw)) return [];

    return raw.map((item) => ({
      day: item.day,
      h: `${item.value}%`,
      active: item.active || false,
    }));
  } catch (error) {
    console.error('❌ CHART ERROR:', error.response || error);

    // fallback supaya UI tetap jalan
    return [
      { day: 'Mon', h: '30%', active: false },
      { day: 'Tue', h: '40%', active: false },
      { day: 'Wed', h: '35%', active: false },
      { day: 'Thu', h: '50%', active: true },
      { day: 'Fri', h: '80%', active: false },
      { day: 'Sat', h: '20%', active: false },
      { day: 'Sun', h: '10%', active: false },
    ];
  }
}