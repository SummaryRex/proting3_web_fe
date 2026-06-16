import api from './api';

const REPORT_ENDPOINT = '/admin/damage-reports';
const REPORT_FALLBACK_ENDPOINT = '/admin/reports';

const _API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
const STORAGE_BASE_URL = `${_API_BASE}/storage`;

// -----------------------------------------------------------------------------
// BASIC HELPERS
// -----------------------------------------------------------------------------

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

function normalizeArrayResponse(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;

  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.damage_reports)) return data.damage_reports;
  if (Array.isArray(data?.damageReports)) return data.damageReports;

  if (Array.isArray(data?.data?.reports)) return data.data.reports;
  if (Array.isArray(data?.data?.damage_reports)) {
    return data.data.damage_reports;
  }
  if (Array.isArray(data?.data?.damageReports)) {
    return data.data.damageReports;
  }

  if (Array.isArray(data?.damage_report)) return data.damage_report;
  if (Array.isArray(data?.data?.damage_report)) return data.data.damage_report;

  return [];
}

function normalizeObjectResponse(data) {
  if (
    data?.data &&
    typeof data.data === 'object' &&
    !Array.isArray(data.data)
  ) {
    return data.data;
  }

  if (
    data?.damage_report &&
    typeof data.damage_report === 'object' &&
    !Array.isArray(data.damage_report)
  ) {
    return data.damage_report;
  }

  if (
    data?.damageReport &&
    typeof data.damageReport === 'object' &&
    !Array.isArray(data.damageReport)
  ) {
    return data.damageReport;
  }

  if (
    data?.report &&
    typeof data.report === 'object' &&
    !Array.isArray(data.report)
  ) {
    return data.report;
  }

  return data;
}

function normalizeStatus(value) {
  const status = String(value || '')
    .toLowerCase()
    .trim()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');

  if (status === 'pending') return 'reported';
  if (status === 'request') return 'reported';
  if (status === 'requested') return 'reported';
  if (status === 'menunggu') return 'reported';
  if (status === 'waiting') return 'reported';

  if (status === 'approved') return 'in_progress';
  if (status === 'scheduled') return 'in_progress';
  if (status === 'progress') return 'in_progress';
  if (status === 'on_progress') return 'in_progress';
  if (status === 'diproses') return 'in_progress';
  if (status === 'proses') return 'in_progress';
  if (status === 'ongoing') return 'in_progress';
  if (status === 'started') return 'in_progress';
  if (status === 'job_started') return 'in_progress';
  if (status === 'repair_started') return 'in_progress';
  if (status === 'technician_started') return 'in_progress';
  if (status === 'working') return 'in_progress';

  if (status === 'finished') return 'completed';
  if (status === 'selesai') return 'completed';
  if (status === 'complete') return 'completed';

  if (status === 'cancelled') return 'canceled';
  if (status === 'dibatalkan') return 'canceled';
  if (status === 'cancel') return 'canceled';

  if (status === 'menunggu_sparepart') return 'waiting_parts';
  if (status === 'butuh_followup') return 'waiting_parts';
  if (status === 'butuh_followup_admin') return 'waiting_parts';
  if (status === 'on_hold') return 'waiting_parts';

  if (status === 'critical') return 'fatal';

  return status || 'reported';
}

function mapStatusLabel(value) {
  const status = normalizeStatus(value);

  const labels = {
    reported: 'Reported',
    in_progress: 'In Progress',
    waiting_parts: 'Waiting Parts',
    completed: 'Completed',
    fatal: 'Fatal',
    rejected: 'Rejected',
    canceled: 'Canceled',
    approved_followup_admin: 'Follow-up Approved',
  };

  return labels[status] || value || 'Reported';
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

function getImageUrl(path) {
  if (isEmptyValue(path)) return null;

  const value = String(path);

  if (value.startsWith('http')) {
    return value;
  }

  let cleanPath = value.replace(/^\/+/, '');

  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.replace(/^storage\//, '');
  }

  return `${STORAGE_BASE_URL}/${cleanPath}`;
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

function cleanText(value) {
  if (isEmptyValue(value)) return null;

  return String(value).trim();
}

function removeCodeInParentheses(value) {
  if (isEmptyValue(value)) return null;

  const text = String(value).trim();

  const cleaned = text
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim();

  return cleaned || text;
}

function combineBrandModel(brand, model) {
  const b = cleanText(brand);
  const m = cleanText(model);

  if (b && m) return `${b} ${m}`;
  if (b) return b;
  if (m) return m;

  return null;
}

function parseScheduleNote(note) {
  if (isEmptyValue(note)) {
    return {
      mechanic: null,
      priority: null,
      notes: null,
    };
  }

  const text = String(note);

  const mechanicMatch = text.match(/Mechanic:\s*([^|]+)/i);
  const priorityMatch = text.match(/Priority:\s*([^|]+)/i);
  const notesMatch = text.match(/Notes:\s*(.+)$/i);

  return {
    mechanic: mechanicMatch?.[1]?.trim() || null,
    priority: priorityMatch?.[1]?.trim() || null,
    notes: notesMatch?.[1]?.trim() || null,
  };
}

function formatSeverityFromPriority(priority) {
  const value = String(priority || '').toLowerCase().trim();

  if (value === 'critical') return 'Critical';
  if (value === 'fatal') return 'Fatal';
  if (value === 'high') return 'High';
  if (value === 'medium') return 'Medium';
  if (value === 'low') return 'Low';

  return null;
}

// -----------------------------------------------------------------------------
// HOUR METER HELPERS
// -----------------------------------------------------------------------------

function normalizeMeterValue(value) {
  if (isEmptyValue(value)) return null;

  if (typeof value === 'string') {
    const clean = value.replace(',', '.').trim();

    if (clean === '') return null;

    const numberValue = Number(clean);

    if (!Number.isNaN(numberValue)) {
      return numberValue;
    }

    return clean;
  }

  const numberValue = Number(value);

  if (!Number.isNaN(numberValue)) {
    return numberValue;
  }

  return value;
}

function isPositiveMeter(value) {
  const normalized = normalizeMeterValue(value);

  if (normalized === null) return false;

  const numberValue = Number(normalized);

  return !Number.isNaN(numberValue) && numberValue > 0;
}

function isZeroMeter(value) {
  const normalized = normalizeMeterValue(value);

  if (normalized === null) return false;

  const numberValue = Number(normalized);

  return !Number.isNaN(numberValue) && numberValue === 0;
}

function firstPositiveMeter(...values) {
  for (const value of values) {
    if (isPositiveMeter(value)) {
      return normalizeMeterValue(value);
    }
  }

  return null;
}

function firstAnyMeter(...values) {
  for (const value of values) {
    const normalized = normalizeMeterValue(value);

    if (!isEmptyValue(normalized)) {
      return normalized;
    }
  }

  return null;
}

function formatHourMeterValue(value) {
  if (isEmptyValue(value)) return '-';

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return value;
  }

  return numberValue.toFixed(2);
}

function getLatestObject(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) {
      return value[value.length - 1];
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
  }

  return {};
}

// -----------------------------------------------------------------------------
// API FALLBACK HELPERS
// -----------------------------------------------------------------------------

function shouldTryGetFallback(error) {
  const status = Number(error?.response?.status);

  return [404, 405, 500].includes(status);
}

function shouldTryPostFallback(error) {
  const status = Number(error?.response?.status);

  return [404, 405].includes(status);
}

async function getWithFallback(paths = [], config = {}) {
  let lastError = null;

  for (const path of paths) {
    try {
      const { data } = await api.get(path, config);
      return data;
    } catch (error) {
      lastError = error;

      console.error(`GET ${path} ERROR:`, {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      if (!shouldTryGetFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function postWithFallback(paths = [], payload = {}) {
  let lastError = null;

  for (const path of paths) {
    try {
      const { data } = await api.post(path, payload);
      return data;
    } catch (error) {
      lastError = error;

      console.error(`POST ${path} ERROR:`, {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      if (!shouldTryPostFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

// -----------------------------------------------------------------------------
// RAW DATA HELPERS
// -----------------------------------------------------------------------------

function getVehicle(raw) {
  return raw?.vehicle || raw?.unit || raw?.equipment || {};
}

function getDriver(raw) {
  return raw?.driver || raw?.operator || raw?.user || {};
}

function getLatestTechnicianResponse(raw) {
  return (
    raw?.latest_technician_response ||
    raw?.latestTechnicianResponse ||
    raw?.technician_response ||
    raw?.technicianResponse ||
    {}
  );
}

function getLatestBooking(raw) {
  return (
    raw?.latest_service_booking ||
    raw?.latestServiceBooking ||
    raw?.service_booking ||
    raw?.serviceBooking ||
    raw?.booking ||
    {}
  );
}

function getLatestDailyLog(raw) {
  const vehicle = getVehicle(raw);

  return getLatestObject(
    raw?.latest_vehicle_daily_log,
    raw?.latestVehicleDailyLog,
    raw?.vehicle_daily_log,
    raw?.vehicleDailyLog,
    raw?.daily_log,
    raw?.dailyLog,
    raw?.vehicle_daily_logs,
    raw?.vehicleDailyLogs,
    raw?.daily_logs,
    raw?.dailyLogs,

    vehicle?.latest_vehicle_daily_log,
    vehicle?.latestVehicleDailyLog,
    vehicle?.vehicle_daily_log,
    vehicle?.vehicleDailyLog,
    vehicle?.daily_log,
    vehicle?.dailyLog,
    vehicle?.vehicle_daily_logs,
    vehicle?.vehicleDailyLogs,
    vehicle?.daily_logs,
    vehicle?.dailyLogs
  );
}

function getEquipmentNameFromRaw(raw) {
  const vehicle = getVehicle(raw);

  return firstValid(
    raw?.equipmentName,
    raw?.equipment_name,
    raw?.equipName,
    raw?.equip_name,
    raw?.unit_name,
    raw?.vehicle_name,

    vehicle?.equipment_name,
    vehicle?.equipmentName,
    vehicle?.name,
    vehicle?.unit_name,
    vehicle?.vehicle_name,
    vehicle?.model_name
  );
}

function getEquipmentTypeFromRaw(raw) {
  const vehicle = getVehicle(raw);
  const equipmentName = getEquipmentNameFromRaw(raw);

  return firstValid(
    raw?.equipType,
    raw?.equip_type,
    raw?.equipmentType,
    raw?.equipment_type,
    raw?.vehicleType,
    raw?.vehicle_type,
    raw?.unitType,
    raw?.unit_type,
    raw?.type,
    raw?.category,
    raw?.jenis,
    raw?.class,
    raw?.classification,

    vehicle?.equipType,
    vehicle?.equip_type,
    vehicle?.equipmentType,
    vehicle?.equipment_type,
    vehicle?.vehicleType,
    vehicle?.vehicle_type,
    vehicle?.unitType,
    vehicle?.unit_type,
    vehicle?.type,
    vehicle?.category,
    vehicle?.jenis,
    vehicle?.class,
    vehicle?.classification,

    combineBrandModel(vehicle?.brand, vehicle?.model),
    combineBrandModel(vehicle?.merk, vehicle?.model),
    combineBrandModel(vehicle?.manufacturer, vehicle?.model),

    vehicle?.brand,
    vehicle?.merk,
    vehicle?.manufacturer,
    vehicle?.model,

    removeCodeInParentheses(equipmentName)
  );
}

function getHourMeterFromRaw(raw) {
  const vehicle = getVehicle(raw);
  const latestBooking = getLatestBooking(raw);
  const latestDailyLog = getLatestDailyLog(raw);

  /*
   * Urutan prioritas:
   * 1. Nilai hour meter langsung dari damage report.
   * 2. Nilai dari daily log driver.
   * 3. Nilai dari service booking.
   * 4. Nilai dari vehicle.
   *
   * Nilai 0 dari vehicle tidak langsung dipakai,
   * karena biasanya itu default awal dan bisa menutupi nilai yang diisi driver.
   */

  const directReportMeters = [
    raw?.hour_meter,
    raw?.hourMeter,
    raw?.hm,
    raw?.current_hour_meter,
    raw?.currentHourMeter,
    raw?.last_hour_meter,
    raw?.lastHourMeter,
    raw?.odometer,
    raw?.mileage,
    raw?.meter,
    raw?.meter_value,
  ];

  const dailyLogMeters = [
    latestDailyLog?.hour_meter,
    latestDailyLog?.hourMeter,
    latestDailyLog?.hm,
    latestDailyLog?.current_hour_meter,
    latestDailyLog?.currentHourMeter,
    latestDailyLog?.last_hour_meter,
    latestDailyLog?.lastHourMeter,
    latestDailyLog?.odometer,
    latestDailyLog?.mileage,
    latestDailyLog?.meter,
    latestDailyLog?.meter_value,
  ];

  const bookingMeters = [
    latestBooking?.hour_meter,
    latestBooking?.hourMeter,
    latestBooking?.hm,
    latestBooking?.current_hour_meter,
    latestBooking?.currentHourMeter,
    latestBooking?.last_hour_meter,
    latestBooking?.lastHourMeter,
    latestBooking?.odometer,
    latestBooking?.mileage,
    latestBooking?.meter,
    latestBooking?.meter_value,
  ];

  const vehicleMeters = [
    vehicle?.hour_meter,
    vehicle?.hourMeter,
    vehicle?.hm,
    vehicle?.current_hour_meter,
    vehicle?.currentHourMeter,
    vehicle?.last_hour_meter,
    vehicle?.lastHourMeter,
    vehicle?.odometer,
    vehicle?.mileage,
    vehicle?.meter,
    vehicle?.meter_value,
  ];

  const positiveFromReport = firstPositiveMeter(...directReportMeters);
  if (positiveFromReport !== null) return positiveFromReport;

  const positiveFromDailyLog = firstPositiveMeter(...dailyLogMeters);
  if (positiveFromDailyLog !== null) return positiveFromDailyLog;

  const positiveFromBooking = firstPositiveMeter(...bookingMeters);
  if (positiveFromBooking !== null) return positiveFromBooking;

  const positiveFromVehicle = firstPositiveMeter(...vehicleMeters);
  if (positiveFromVehicle !== null) return positiveFromVehicle;

  /*
   * Kalau semua tidak ada yang positif, jangan pakai 0 dari vehicle dulu.
   * Ambil nilai non-empty dari report/daily log/booking.
   */
  const anyFromReport = firstAnyMeter(...directReportMeters);
  if (anyFromReport !== null && !isZeroMeter(anyFromReport)) return anyFromReport;

  const anyFromDailyLog = firstAnyMeter(...dailyLogMeters);
  if (anyFromDailyLog !== null && !isZeroMeter(anyFromDailyLog)) {
    return anyFromDailyLog;
  }

  const anyFromBooking = firstAnyMeter(...bookingMeters);
  if (anyFromBooking !== null && !isZeroMeter(anyFromBooking)) {
    return anyFromBooking;
  }

  /*
   * Fallback terakhir:
   * jika memang hanya vehicle yang punya 0, return null agar UI tidak memaksa 0.00.
   */
  return null;
}

function getTechnicianNameFromRaw(raw) {
  const latestResponse = getLatestTechnicianResponse(raw);
  const latestBooking = getLatestBooking(raw);

  const noteAdmin =
    raw?.note_admin ||
    raw?.admin_note ||
    latestBooking?.note_admin ||
    latestBooking?.admin_note ||
    '';

  const parsedNote = parseScheduleNote(noteAdmin);

  return firstValid(
    raw?.technician_name,
    raw?.mechanic,

    getUserName(raw?.technician),
    getUserName(raw?.technician_user),
    getUserName(raw?.mechanic_user),

    latestResponse?.technician_name,
    latestResponse?.mechanic,
    getUserName(latestResponse?.technician),
    getUserName(latestResponse?.technician_user),

    latestBooking?.technician_name,
    latestBooking?.mechanic,
    getUserName(latestBooking?.technician),
    getUserName(latestBooking?.technician_user),
    getUserName(latestBooking?.mechanic_user),

    parsedNote.mechanic
  );
}

function getTechnicianNoteFromRaw(raw) {
  const latestResponse = getLatestTechnicianResponse(raw);
  const latestBooking = getLatestBooking(raw);

  const rawNote = firstValid(
    raw?.technician_note,
    raw?.response_note,
    raw?.note,

    latestResponse?.note,
    latestResponse?.response_note,
    latestResponse?.technician_note,

    latestBooking?.technician_note,
    latestBooking?.note_admin,
    latestBooking?.admin_note,
    latestBooking?.note,

    raw?.note_admin,
    raw?.admin_note
  );

  const parsedNote = parseScheduleNote(rawNote);

  return parsedNote.notes || rawNote || '-';
}

function getSeverityFromRaw(raw) {
  const latestResponse = getLatestTechnicianResponse(raw);
  const latestBooking = getLatestBooking(raw);

  const noteAdmin =
    raw?.note_admin ||
    raw?.admin_note ||
    latestBooking?.note_admin ||
    latestBooking?.admin_note ||
    '';

  const parsedNote = parseScheduleNote(noteAdmin);

  const severity = firstValid(
    raw?.severity,
    raw?.severity_level,
    raw?.damage_severity,
    raw?.priority,

    latestResponse?.severity,
    latestResponse?.severity_level,
    latestResponse?.damage_severity,
    latestResponse?.priority,

    latestBooking?.priority,
    latestBooking?.severity,
    latestBooking?.severity_level,

    parsedNote.priority
  );

  return formatSeverityFromPriority(severity) || severity;
}

function getImagePathFromRaw(raw) {
  return firstValid(
    raw?.image_url,
    raw?.imageUrl,
    raw?.damage_image_url,
    raw?.damageImageUrl,
    raw?.photo_url,
    raw?.photoUrl,
    raw?.image,
    raw?.damage_image,
    raw?.damageImage,
    raw?.photo,
    raw?.image_path,
    raw?.imagePath,
    raw?.damage_photo,
    raw?.file_path
  );
}

function getSparePartsFromRaw(raw) {
  const candidates = [
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

    raw?.repair_history?.part_usages,
    raw?.repair_history?.partUsages,
    raw?.repair_history?.items,
    raw?.repairHistory?.partUsages,
    raw?.repairHistory?.items,

    raw?.repair?.part_usages,
    raw?.repair?.partUsages,
    raw?.repair?.spare_part_usages,
    raw?.repair?.sparePartUsages,
    raw?.repair?.used_parts,
    raw?.repair?.parts_used,
    raw?.repair?.items,

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

function getKpiValue(raw, ...keys) {
  for (const key of keys) {
    const value = key
      .split('.')
      .reduce((obj, part) => obj?.[part], raw);

    if (!isEmptyValue(value)) {
      return value;
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// MAPPER
// -----------------------------------------------------------------------------

function mapReport(raw = {}) {
  const driver = getDriver(raw);
  const latestResponse = getLatestTechnicianResponse(raw);
  const latestBooking = getLatestBooking(raw);

  const rawStatus = firstValid(
    raw?.computed_status,
    raw?.computedStatus,
    raw?.status,
    latestResponse?.status,
    latestBooking?.status
  );

  const normalizedStatus = normalizeStatus(rawStatus);

  const imagePath = getImagePathFromRaw(raw);
  const technicianName = getTechnicianNameFromRaw(raw);
  const severity = getSeverityFromRaw(raw);
  const spareParts = getSparePartsFromRaw(raw);

  const equipmentName = getEquipmentNameFromRaw(raw);
  const equipmentType = getEquipmentTypeFromRaw(raw);
  const hourMeter = getHourMeterFromRaw(raw);
  const formattedHourMeter = formatHourMeterValue(hourMeter);

  const isProcessed = [
    'in_progress',
    'waiting_parts',
    'completed',
    'fatal',
  ].includes(normalizedStatus);

  const submitDate = firstValid(
    raw?.submitDate,
    raw?.created_at,
    raw?.createdAt,
    raw?.reported_at,
    raw?.reportedAt,
    raw?.date
  );

  const mttr = getKpiValue(
    raw,
    'mttr',
    'MTTR',
    'kpi.mttr',
    'kpi.MTTR',
    'kpi_mttr',
    'mttr_hours',
    'latest_technician_response.mttr',
    'latestTechnicianResponse.mttr',
    'booking.mttr',
    'service_booking.mttr',
    'latest_service_booking.mttr'
  );

  const mtbf = getKpiValue(
    raw,
    'mtbf',
    'MTBF',
    'kpi.mtbf',
    'kpi.MTBF',
    'kpi_mtbf',
    'mtbf_hours',
    'latest_technician_response.mtbf',
    'latestTechnicianResponse.mtbf',
    'booking.mtbf',
    'service_booking.mtbf',
    'latest_service_booking.mtbf'
  );

  const ma = getKpiValue(
    raw,
    'ma',
    'MA',
    'kpi.ma',
    'kpi.MA',
    'maintenance_availability',
    'availability',
    'kpi_ma',
    'latest_technician_response.ma',
    'latestTechnicianResponse.ma',
    'booking.ma',
    'service_booking.ma',
    'latest_service_booking.ma'
  );

  const vehicle = getVehicle(raw);

  return {
    id: raw?.id,
    damageReportId: raw?.id,

    equipmentName: equipmentName || 'Unknown Unit',
    equipName: equipmentName || 'Unknown Unit',

    plateNumber:
      firstValid(
        raw?.plateNumber,
        raw?.plate_number,
        raw?.license_plate,
        raw?.police_number,

        vehicle?.plate_number,
        vehicle?.plateNumber,
        vehicle?.plate,
        vehicle?.license_plate,
        vehicle?.police_number
      ) || '-',

    equipType: equipmentType || '-',
    equipmentType: equipmentType || '-',
    type: equipmentType || '-',

    /*
     * Pakai formattedHourMeter agar modal tidak memaksa default 0.00.
     */
    hourMeter: formattedHourMeter,
    hour_meter: formattedHourMeter,

    driverName:
      firstValid(
        raw?.driverName,
        raw?.driver_name,
        getUserName(driver)
      ) || '-',

    operator:
      firstValid(
        raw?.operator,
        raw?.driver_name,
        getUserName(driver)
      ) || '-',

    submitDate: submitDate || '-',
    createdAt: submitDate || '-',
    date: submitDate || '-',
    formattedSubmitDate: formatDate(submitDate),

    damageType:
      firstValid(
        raw?.damageType,
        raw?.damage_type,
        raw?.type_of_damage
      ) || '-',

    description:
      firstValid(
        raw?.description,
        raw?.damage_description,
        raw?.note
      ) || '-',

    rawStatus: rawStatus || 'reported',
    status: mapStatusLabel(rawStatus),

    severity:
      severity || (normalizedStatus === 'completed' ? 'Belum ditentukan' : '-'),

    technicianName:
      technicianName || (isProcessed ? 'Belum tercatat' : '-'),

    technicianNote: getTechnicianNoteFromRaw(raw),

    latestTechnicianResponse: latestResponse,
    latestServiceBooking: latestBooking,

    bookingStatus:
      firstValid(
        latestBooking?.status,
        raw?.booking_status,
        raw?.service_booking_status
      ) || null,

    rawBookingStatus:
      firstValid(
        raw?.booking_status,
        raw?.service_booking_status,
        latestBooking?.status
      ) || null,

    image: imagePath,
    damage_image: imagePath,
    imageUrl: getImageUrl(imagePath),

    spareParts,
    partUsages: spareParts,
    part_usages: spareParts,

    mttr,
    mtbf,
    ma,

    raw: {
      ...raw,
      equipment_type: equipmentType,
      equipType: equipmentType,
      hour_meter: hourMeter,
      hourMeter,
      formatted_hour_meter: formattedHourMeter,
      spare_parts: spareParts,
      part_usages: spareParts,
      mttr,
      mtbf,
      ma,
    },
  };
}

// -----------------------------------------------------------------------------
// PUBLIC FUNCTIONS
// -----------------------------------------------------------------------------
// Catatan alur:
// reportService.js hanya dipakai untuk Damage Report, riwayat, detail,
// approve follow-up, dan finished repair history.
// Reject approval booking ada di scheduleService.js melalui rejectBooking().

export async function getReports(params = {}) {
  try {
    const data = await getWithFallback(
      [REPORT_ENDPOINT, REPORT_FALLBACK_ENDPOINT],
      {
        params,
      }
    );

    const rows = normalizeArrayResponse(data);

    console.log('DAMAGE REPORT RAW RESPONSE:', data);
    console.log('DAMAGE REPORT ROWS:', rows);

    return rows.map(mapReport);
  } catch (error) {
    console.error('GET REPORTS ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    return [];
  }
}

export async function getReportById(id) {
  try {
    if (!id) {
      throw new Error('Report ID tidak valid.');
    }

    const data = await getWithFallback([
      `${REPORT_ENDPOINT}/${id}`,
      `${REPORT_FALLBACK_ENDPOINT}/${id}`,
    ]);

    console.log('DAMAGE REPORT DETAIL RAW:', data);

    return mapReport(normalizeObjectResponse(data));
  } catch (error) {
    console.error('GET REPORT DETAIL ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    throw error.response?.data || error;
  }
}

export async function approveFollowUp(id, payload = {}) {
  try {
    if (!id) {
      throw new Error('Report ID tidak valid.');
    }

    const body =
      typeof payload === 'string'
        ? { note: payload }
        : {
            note:
              payload?.note ||
              payload?.notes ||
              payload?.admin_note ||
              payload?.note_admin ||
              '',
          };

    const data = await postWithFallback(
      [
        `${REPORT_ENDPOINT}/${id}/approve-follow-up`,
        `${REPORT_FALLBACK_ENDPOINT}/${id}/approve-follow-up`,
        `${REPORT_ENDPOINT}/${id}/approve-followup`,
        `${REPORT_FALLBACK_ENDPOINT}/${id}/approve-followup`,
      ],
      body
    );

    return normalizeObjectResponse(data);
  } catch (error) {
    console.error('APPROVE FOLLOW UP ERROR:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    throw error.response?.data || error;
  }
}

export function getReportImageUrl(path) {
  return getImageUrl(path);
}