import api from './api';

const DASHBOARD_ENDPOINT = '/admin/dashboard';
const DAMAGE_REPORT_ENDPOINT = '/admin/damage-reports';

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
  return values.find((value) => !isEmptyValue(value)) ?? null;
}

function toNumber(value, fallback = 0) {
  if (isEmptyValue(value)) return fallback;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? fallback : numberValue;
}

function unwrapResponse(responseOrData) {
  const data = responseOrData?.data ?? responseOrData;

  if (
    data?.data &&
    typeof data.data === 'object' &&
    !Array.isArray(data.data)
  ) {
    return data.data;
  }

  return data || {};
}

function normalizeArrayResponse(data) {
  const raw = unwrapResponse(data);

  if (Array.isArray(raw)) return raw;

  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;

  if (Array.isArray(raw?.reports)) return raw.reports;
  if (Array.isArray(raw?.damage_reports)) return raw.damage_reports;
  if (Array.isArray(raw?.damageReports)) return raw.damageReports;

  if (Array.isArray(raw?.latest_reports)) return raw.latest_reports;
  if (Array.isArray(raw?.latestReports)) return raw.latestReports;

  if (Array.isArray(raw?.recent_reports)) return raw.recent_reports;
  if (Array.isArray(raw?.recentReports)) return raw.recentReports;

  return [];
}

function formatDate(value) {
  if (isEmptyValue(value)) return '-';

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (_) {
    return value;
  }
}

function getUserName(user) {
  if (!user || typeof user !== 'object') return null;

  return firstValid(
    user.name,
    user.username,
    user.full_name,
    user.email
  );
}

function normalizeDirection(value) {
  const direction = String(value || '')
    .trim()
    .toLowerCase();

  if (['up', 'increase', 'increased', 'naik', '+'].includes(direction)) {
    return 'up';
  }

  if (['down', 'decrease', 'decreased', 'turun', '-'].includes(direction)) {
    return 'down';
  }

  return 'same';
}

export const dashboardStatusLabels = {
  reported: 'Reported',
  in_progress: 'In Progress',
  waiting_parts: 'Waiting Parts',
  completed: 'Completed',
  fatal: 'Fatal',
  rejected: 'Rejected',
  canceled: 'Canceled',
  approved_followup_admin: 'Follow-up Approved',
};

export function normalizeStatus(status) {
  const value = String(status || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');

  if (
    [
      'menunggu',
      'reported',
      'waiting',
      'pending',
      'request',
      'requested',
    ].includes(value)
  ) {
    return 'reported';
  }

  if (
    [
      'proses',
      'diproses',
      'ongoing',
      'in_progress',
      'progress',
      'on_progress',
      'approved',
      'scheduled',
      'started',
      'working',
      'job_started',
      'repair_started',
      'technician_started',
    ].includes(value)
  ) {
    return 'in_progress';
  }

  if (
    [
      'butuh_followup_admin',
      'butuh_followup',
      'menunggu_sparepart',
      'waiting_parts',
      'on_hold',
    ].includes(value)
  ) {
    return 'waiting_parts';
  }

  if (
    [
      'selesai',
      'finished',
      'completed',
      'complete',
    ].includes(value)
  ) {
    return 'completed';
  }

  if (
    [
      'fatal',
      'critical',
    ].includes(value)
  ) {
    return 'fatal';
  }

  if (
    [
      'rejected',
      'reject',
      'ditolak',
    ].includes(value)
  ) {
    return 'rejected';
  }

  if (
    [
      'canceled',
      'cancelled',
      'cancel',
      'dibatalkan',
    ].includes(value)
  ) {
    return 'canceled';
  }

  if (
    [
      'approved_followup_admin',
      'followup_approved',
      'follow_up_approved',
    ].includes(value)
  ) {
    return 'approved_followup_admin';
  }

  return value || 'reported';
}

function getStatusLabel(status) {
  const variant = normalizeStatus(status);

  return dashboardStatusLabels[variant] || 'Reported';
}

function getVehicle(report) {
  return report?.vehicle || report?.unit || report?.equipment || {};
}

function getDriver(report) {
  return report?.driver || report?.operator_user || report?.user || {};
}

function getLatestTechnicianResponse(report) {
  if (report?.latest_technician_response) {
    return report.latest_technician_response;
  }

  if (report?.latestTechnicianResponse) {
    return report.latestTechnicianResponse;
  }

  if (Array.isArray(report?.technician_responses)) {
    return report.technician_responses[report.technician_responses.length - 1] || null;
  }

  if (Array.isArray(report?.technicianResponses)) {
    return report.technicianResponses[report.technicianResponses.length - 1] || null;
  }

  return null;
}

function getLatestBooking(report) {
  return (
    report?.booking ||
    report?.service_booking ||
    report?.serviceBooking ||
    report?.latest_service_booking ||
    report?.latestServiceBooking ||
    {}
  );
}

function getReportStatus(report) {
  const latest = getLatestTechnicianResponse(report);
  const booking = getLatestBooking(report);

  return firstValid(
    report?.computed_status,
    report?.computedStatus,
    latest?.status,
    booking?.status,
    report?.status,
    'menunggu'
  );
}

function getEquipmentName(report) {
  const vehicle = getVehicle(report);

  return firstValid(
    report?.equipmentName,
    report?.equipment_name,
    report?.equip,
    report?.equipName,
    report?.vehicle_name,
    report?.unit_name,

    vehicle?.equipment_name,
    vehicle?.equipmentName,
    vehicle?.name,
    vehicle?.unit_name,
    vehicle?.vehicle_name,
    vehicle?.model_name
  );
}

function getPlateNumber(report) {
  const vehicle = getVehicle(report);

  return firstValid(
    report?.plateNumber,
    report?.plate_number,
    report?.license_plate,
    report?.police_number,

    vehicle?.plate_number,
    vehicle?.plateNumber,
    vehicle?.plate,
    vehicle?.license_plate,
    vehicle?.police_number
  );
}

function normalizeDamageReport(report = {}) {
  const latest = getLatestTechnicianResponse(report);
  const vehicle = getVehicle(report);
  const driver = getDriver(report);
  const rawStatus = getReportStatus(report);
  const status = normalizeStatus(rawStatus);

  const id = report?.id ?? report?.damage_report_id ?? report?.damageReportId;

  return {
    id: id ? `#${id}` : '-',
    rawId: id,
    damageReportId: id,

    equip:
      getEquipmentName(report) ||
      'Unknown Unit',

    plateNumber:
      getPlateNumber(report) ||
      '-',

    operator:
      firstValid(
        report?.operator,
        report?.operator_name,
        report?.driverName,
        report?.driver_name,
        getUserName(driver)
      ) || '-',

    damageType:
      firstValid(
        report?.damageType,
        report?.damage_type,
        report?.type_of_damage
      ) || '-',

    description:
      firstValid(
        report?.description,
        report?.damage_description,
        report?.note
      ) || '-',

    date:
      formatDate(
        firstValid(
          report?.date,
          report?.created_at,
          report?.createdAt,
          report?.reported_at,
          report?.reportedAt
        )
      ),

    rawStatus,
    status,
    statusLabel: getStatusLabel(status),

    technician:
      firstValid(
        latest?.technician?.username,
        latest?.technician?.name,
        latest?.technician_name,
        latest?.mechanic
      ) || '-',

    technicianNote:
      firstValid(
        latest?.note,
        latest?.response_note,
        latest?.technician_note
      ) || '-',

    mttr: latest?.mttr ?? report?.mttr ?? null,
    mtbf: latest?.mtbf ?? report?.mtbf ?? null,
    ma: latest?.ma ?? report?.ma ?? null,

    latestTechnicianResponse: latest,
    technicianResponses:
      report?.technician_responses ||
      report?.technicianResponses ||
      [],

    vehicle,
    driver,
    raw: report,
  };
}

function normalizeLatestReports(raw = {}) {
  const rows =
    raw?.latest_reports ||
    raw?.latestReports ||
    raw?.latest_damage_reports ||
    raw?.latestDamageReports ||
    raw?.recent_reports ||
    raw?.recentReports ||
    raw?.damage_reports ||
    raw?.damageReports ||
    raw?.reports ||
    [];

  if (!Array.isArray(rows)) return [];

  return rows.map(normalizeDamageReport);
}

function normalizeChartHeight(value) {
  if (isEmptyValue(value)) return '0%';

  if (typeof value === 'string' && value.includes('%')) {
    return value;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return '0%';
  }

  const safeValue = Math.max(0, Math.min(numberValue, 100));

  return `${safeValue}%`;
}

function normalizeChartData(raw = {}) {
  const rows =
    raw?.downtime_chart ||
    raw?.downtimeChart ||
    raw?.weekly_downtime ||
    raw?.weeklyDowntime ||
    raw?.bar_chart ||
    raw?.barChart ||
    raw?.chart ||
    [];

  if (!Array.isArray(rows) || rows.length === 0) return [];

  const mappedRows = rows.map((item, index) => {
    const value = toNumber(item?.value ?? item?.hours ?? item?.total, 0);

    return {
      day: item?.day || item?.label || item?.name || `D${index + 1}`,
      value,
      rawHeight: item?.h ?? item?.height ?? null,
      active: Boolean(item?.active),
    };
  });

  const maxValue = Math.max(...mappedRows.map((item) => item.value), 0);

  return mappedRows.map((item) => {
    const calculatedHeight =
      item.rawHeight !== null && item.rawHeight !== undefined
        ? normalizeChartHeight(item.rawHeight)
        : maxValue > 0
          ? `${Math.max(8, Math.round((item.value / maxValue) * 100))}%`
          : '0%';

    return {
      day: item.day,
      value: item.value,
      h: calculatedHeight,
      active:
        item.active ||
        (maxValue > 0 && item.value === maxValue),
    };
  });
}

const fallbackChartData = [
  { day: 'Mon', h: '30%', value: 30, active: false },
  { day: 'Tue', h: '40%', value: 40, active: false },
  { day: 'Wed', h: '35%', value: 35, active: false },
  { day: 'Thu', h: '50%', value: 50, active: true },
  { day: 'Fri', h: '80%', value: 80, active: false },
  { day: 'Sat', h: '20%', value: 20, active: false },
  { day: 'Sun', h: '10%', value: 10, active: false },
];

export function normalizeStats(data = {}) {
  const raw =
    data?.stats && typeof data.stats === 'object'
      ? {
          ...data,
          ...data.stats,
        }
      : data;

  return {
    drivers: toNumber(
      firstValid(
        raw?.drivers,
        raw?.driver_count,
        raw?.driverCount,
        raw?.total_drivers,
        raw?.totalDrivers
      ),
      0
    ),

    technicians: toNumber(
      firstValid(
        raw?.technicians,
        raw?.technician_count,
        raw?.technicianCount,
        raw?.total_technicians,
        raw?.totalTechnicians
      ),
      0
    ),

    vehicles: toNumber(
      firstValid(
        raw?.vehicles,
        raw?.vehicle_count,
        raw?.vehicleCount,
        raw?.total_vehicles,
        raw?.totalVehicles
      ),
      0
    ),

    followups: toNumber(
      firstValid(
        raw?.followups,
        raw?.follow_ups,
        raw?.followUps,
        raw?.followup_count,
        raw?.followupCount,
        raw?.waiting_parts,
        raw?.waitingParts,
        raw?.on_hold_reports,
        raw?.onHoldReports
      ),
      0
    ),

    parts: toNumber(
      firstValid(
        raw?.parts,
        raw?.part_count,
        raw?.partCount,
        raw?.total_parts,
        raw?.totalParts
      ),
      0
    ),

    transactions: toNumber(
      firstValid(
        raw?.transactions,
        raw?.transaction_count,
        raw?.transactionCount,
        raw?.total_transactions,
        raw?.totalTransactions
      ),
      0
    ),

    downtimeHours: toNumber(
      firstValid(
        raw?.downtime_hours,
        raw?.downtimeHours,
        raw?.total_downtime_hours,
        raw?.totalDowntimeHours
      ),
      0
    ),

    downtimeChange:
      firstValid(
        raw?.downtime_change,
        raw?.downtimeChange,
        raw?.downtime_percentage,
        raw?.downtimePercentage
      ) || '0%',

    downtimeChangeDirection: normalizeDirection(
      firstValid(
        raw?.downtime_change_direction,
        raw?.downtimeChangeDirection,
        raw?.downtime_direction,
        raw?.downtimeDirection
      )
    ),

    maintenanceTasks: toNumber(
      firstValid(
        raw?.maintenance_tasks,
        raw?.maintenanceTasks,
        raw?.completed_tasks,
        raw?.completedTasks,
        raw?.tasks
      ),
      0
    ),

    maintenanceChange:
      firstValid(
        raw?.maintenance_change,
        raw?.maintenanceChange,
        raw?.task_change,
        raw?.taskChange
      ) || '0%',

    maintenanceChangeDirection: normalizeDirection(
      firstValid(
        raw?.maintenance_change_direction,
        raw?.maintenanceChangeDirection,
        raw?.maintenance_direction,
        raw?.maintenanceDirection,
        raw?.task_change_direction,
        raw?.taskChangeDirection
      )
    ),

    latestReports: normalizeLatestReports(raw),
    barChartData: normalizeChartData(raw),
  };
}

async function getApi(path, config = {}) {
  const response = await api.get(path, config);

  return unwrapResponse(response);
}

async function postApi(path, payload = {}) {
  const response = await api.post(path, payload);

  return unwrapResponse(response);
}

export async function getDashboardStats() {
  try {
    const raw = await getApi(DASHBOARD_ENDPOINT);

    console.log('🔥 DASHBOARD RAW:', raw);

    return normalizeStats(raw || {});
  } catch (error) {
    console.error('❌ DASHBOARD ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return normalizeStats({});
  }
}

export async function getLatestReports(limit = 5) {
  try {
    const response = await api.get(DAMAGE_REPORT_ENDPOINT, {
      params: { limit },
    });

    console.log('🔥 LATEST REPORTS RAW:', response.data);

    const rows = normalizeArrayResponse(response.data);

    return rows.map(normalizeDamageReport);
  } catch (error) {
    console.error('❌ LATEST REPORTS ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return [];
  }
}

export async function getFollowUpReports() {
  try {
    const response = await api.get(`${DAMAGE_REPORT_ENDPOINT}/follow-ups/list`);

    console.log('🔥 FOLLOW UP REPORTS RAW:', response.data);

    const rows = normalizeArrayResponse(response.data);

    return rows.map(normalizeDamageReport);
  } catch (error) {
    console.error('❌ FOLLOW UP REPORTS ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return [];
  }
}

export async function getFinishedRepairReports() {
  try {
    const response = await api.get(`${DAMAGE_REPORT_ENDPOINT}/finished-repairs`);

    console.log('🔥 FINISHED REPAIR REPORTS RAW:', response.data);

    const rows = normalizeArrayResponse(response.data);

    return rows.map(normalizeDamageReport);
  } catch (error) {
    console.error('❌ FINISHED REPAIR REPORTS ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return [];
  }
}

export async function storeFinishedRepairHistory(damageReportId, payload = {}) {
  try {
    if (!damageReportId) {
      throw new Error('damageReportId tidak valid');
    }

    const raw = await postApi(
      `${DAMAGE_REPORT_ENDPOINT}/${damageReportId}/store-finished-repair`,
      {
        admin_note: payload.admin_note ?? payload.adminNote ?? '',
        action: payload.action ?? '',
        cost: payload.cost ?? 0,
      }
    );

    console.log('✅ STORE FINISHED REPAIR RAW:', raw);

    return {
      success: true,
      message:
        raw?.message ||
        'Finished repair history berhasil disimpan.',
      data: raw,
      repair: raw?.repair ?? null,
      damageReport: raw?.damage_report ?? raw?.damageReport ?? null,
    };
  } catch (error) {
    console.error('❌ STORE FINISHED REPAIR ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Gagal menyimpan finished repair history.',
      error: error?.response?.data || error,
    };
  }
}

export async function approveFollowUp(damageReportId, adminNote = '') {
  try {
    if (!damageReportId) {
      throw new Error('damageReportId tidak valid');
    }

    let raw;

    try {
      raw = await postApi(
        `${DAMAGE_REPORT_ENDPOINT}/${damageReportId}/approve-follow-up`,
        {
          admin_note: adminNote,
        }
      );
    } catch (firstError) {
      const status = Number(firstError?.response?.status);

      if (![404, 405].includes(status)) {
        throw firstError;
      }

      raw = await postApi(
        `${DAMAGE_REPORT_ENDPOINT}/${damageReportId}/complete`,
        {
          admin_note: adminNote,
        }
      );
    }

    console.log('✅ APPROVE FOLLOW UP RAW:', raw);

    return {
      success: true,
      message:
        raw?.message ||
        'Follow-up berhasil disetujui.',
      data: raw,
    };
  } catch (error) {
    console.error('❌ APPROVE FOLLOW UP ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Gagal approve follow-up.',
      error: error?.response?.data || error,
    };
  }
}

export async function getChartData() {
  try {
    const response = await api.get(`${DASHBOARD_ENDPOINT}/chart`);

    const raw = response.data?.data ?? response.data;

    if (!Array.isArray(raw)) return fallbackChartData;

    const maxValue = Math.max(
      ...raw.map((item) => toNumber(item?.value ?? item?.hours ?? item?.total, 0)),
      0
    );

    return raw.map((item, index) => {
      const value = toNumber(item?.value ?? item?.hours ?? item?.total, 0);

      return {
        day: item?.day || item?.label || item?.name || `D${index + 1}`,
        value,
        h:
          item?.h ||
          item?.height ||
          (maxValue > 0
            ? `${Math.max(8, Math.round((value / maxValue) * 100))}%`
            : '0%'),
        active:
          Boolean(item?.active) ||
          (maxValue > 0 && value === maxValue),
      };
    });
  } catch (error) {
    console.error('❌ CHART ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return fallbackChartData;
  }
}