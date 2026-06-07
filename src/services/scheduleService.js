import api from './api';

const BOOKING_ENDPOINT = '/admin/bookings';
const TECHNICIAN_ENDPOINT = '/admin/technicians';

function normalizeArrayResponse(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;

  if (Array.isArray(data?.bookings)) return data.bookings;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.technicians)) return data.technicians;
  if (Array.isArray(data?.users)) return data.users;

  return [];
}

function normalizeStatus(value) {
  const status = String(value || '')
    .toLowerCase()
    .trim()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');

  if (status === 'scheduled') return 'approved';
  if (status === 'finished') return 'completed';
  if (status === 'selesai') return 'completed';
  if (status === 'cancelled') return 'canceled';
  if (status === 'dibatalkan') return 'canceled';
  if (status === 'pending') return 'requested';

  return status;
}

function isClosedStatus(value) {
  const status = normalizeStatus(value);

  return ['completed', 'canceled', 'rejected'].includes(status);
}

function getTechnicianId(value) {
  if (!value) return null;

  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    const rawId =
      value.id ||
      value.user_id ||
      value.technician_id ||
      value.mechanic_id ||
      value.user?.id;

    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toDateObject(value) {
  if (!value) return null;

  try {
    const raw = String(value).trim();

    if (!raw || raw === '-' || raw.toLowerCase() === 'null') {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)) {
      const parsed = new Date(raw.replace(' ', 'T'));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch (_) {
    return null;
  }
}

function getRange(startValue, finishValue) {
  const start = toDateObject(startValue);

  if (!start) {
    return {
      start: null,
      end: null,
    };
  }

  let end = toDateObject(finishValue);

  if (!end || end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  return {
    start,
    end,
  };
}

function isOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;

  return aStart < bEnd && aEnd > bStart;
}

function checkConflictFromSchedules({
  schedules = [],
  technician_id,
  scheduled_at,
  estimated_finish_at,
  booking_id,
}) {
  const currentTechnicianId = getTechnicianId(technician_id);

  const currentRange = getRange(
    scheduled_at,
    estimated_finish_at
  );

  if (!currentTechnicianId || !currentRange.start || !currentRange.end) {
    return false;
  }

  return schedules.some((item) => {
    const status = normalizeStatus(item?.status || item?.raw?.status);

    if (isClosedStatus(status)) return false;

    const itemBookingId =
      item?.bookingId ||
      item?.booking_id ||
      item?.raw?.id ||
      item?.id;

    if (
      booking_id &&
      itemBookingId &&
      String(booking_id) === String(itemBookingId)
    ) {
      return false;
    }

    const itemTechnicianId = getTechnicianId(
      item?.technician_id ||
        item?.mechanic_id ||
        item?.raw?.technician_id ||
        item?.raw?.mechanic_id ||
        item?.technician ||
        item?.mechanic
    );

    if (
      !itemTechnicianId ||
      Number(itemTechnicianId) !== Number(currentTechnicianId)
    ) {
      return false;
    }

    const itemRange = getRange(
      item?.dateVal ||
        item?.scheduled_at ||
        item?.raw?.scheduled_at ||
        item?.date,
      item?.estimatedFinishAt ||
        item?.estimated_finish_at ||
        item?.raw?.estimated_finish_at
    );

    return isOverlap(
      itemRange.start,
      itemRange.end,
      currentRange.start,
      currentRange.end
    );
  });
}

export async function getTechnicians() {
  try {
    const { data } = await api.get(TECHNICIAN_ENDPOINT);

    const rows = normalizeArrayResponse(data);

    return rows.filter((item) => {
      const role = String(
        item?.role ||
          item?.role_name ||
          item?.user?.role ||
          item?.user?.role_name ||
          ''
      )
        .toLowerCase()
        .trim();

      if (!role) return true;

      return ['technician', 'teknisi', 'mechanic', 'mekanik'].includes(role);
    });
  } catch (error) {
    console.error('GET TECHNICIANS ERROR:', error.response || error);
    return [];
  }
}

/**
 * Untuk tabel Requested Service Bookings.
 * Route backend:
 * GET /api/admin/bookings?status=requested
 */
export async function getApprovedReports() {
  try {
    const { data } = await api.get(BOOKING_ENDPOINT, {
      params: {
        status: 'requested',
      },
    });

    return normalizeArrayResponse(data);
  } catch (error) {
    console.error('GET REQUESTED BOOKINGS ERROR:', error.response || error);
    return [];
  }
}

/**
 * Untuk tabel Maintenance Schedule List.
 * Route backend:
 * GET /api/admin/bookings?status=all
 */
export async function getSchedules() {
  try {
    const { data } = await api.get(BOOKING_ENDPOINT, {
      params: {
        status: 'all',
      },
    });

    return normalizeArrayResponse(data);
  } catch (error) {
    console.error('GET SCHEDULES ERROR:', error.response || error);
    return [];
  }
}

/**
 * Compatibility function.
 * Tidak dipakai langsung oleh MaintenanceScheduling saat ini.
 */
export async function createSchedule(scheduleData) {
  try {
    const bookingId =
      scheduleData?.booking_id ||
      scheduleData?.bookingId ||
      scheduleData?.id;

    if (!bookingId) {
      throw new Error('Booking ID tidak ditemukan untuk membuat schedule.');
    }

    return await approveBooking(bookingId, scheduleData);
  } catch (error) {
    console.error('CREATE SCHEDULE ERROR:', error.response || error);
    throw error.response?.data || error;
  }
}

/**
 * Compatibility function.
 * Tidak dipakai langsung oleh MaintenanceScheduling saat ini.
 */
export async function updateSchedule(id, updates) {
  try {
    return await rescheduleBooking(id, updates);
  } catch (error) {
    console.error('UPDATE SCHEDULE ERROR:', error.response || error);
    throw error.response?.data || error;
  }
}

/**
 * Approve booking / create schedule.
 * Route backend:
 * POST /api/admin/bookings/{booking}/approve
 */
export async function approveBooking(id, payload = {}) {
  try {
    const { data } = await api.post(
      `${BOOKING_ENDPOINT}/${id}/approve`,
      payload
    );

    return data?.data ?? data;
  } catch (error) {
    console.error('APPROVE BOOKING ERROR:', error.response || error);
    throw error.response?.data || error;
  }
}

/**
 * Reschedule booking.
 * Route backend:
 * POST /api/admin/bookings/{booking}/reschedule
 */
export async function rescheduleBooking(id, payload = {}) {
  try {
    const { data } = await api.post(
      `${BOOKING_ENDPOINT}/${id}/reschedule`,
      payload
    );

    return data?.data ?? data;
  } catch (error) {
    console.error('RESCHEDULE BOOKING ERROR:', error.response || error);
    throw error.response?.data || error;
  }
}

/**
 * Cancel booking / schedule.
 * Route backend:
 * POST /api/admin/bookings/{booking}/cancel
 */
export async function cancelBooking(id, payload = {}) {
  try {
    const { data } = await api.post(
      `${BOOKING_ENDPOINT}/${id}/cancel`,
      payload
    );

    return data?.data ?? data;
  } catch (error) {
    console.error('CANCEL BOOKING ERROR:', error.response || error);
    throw error.response?.data || error;
  }
}

/**
 * Validasi konflik schedule.
 *
 * Di api.php kamu belum ada route khusus:
 * POST /api/admin/bookings/validate-schedule-conflict
 *
 * Jadi function ini melakukan validasi lokal dengan mengambil semua booking.
 */
export async function validateScheduleConflict(payload = {}) {
  try {
    const schedules = await getSchedules();

    const conflict = checkConflictFromSchedules({
      schedules,
      technician_id: payload?.technician_id,
      scheduled_at: payload?.scheduled_at,
      estimated_finish_at: payload?.estimated_finish_at,
      booking_id: payload?.booking_id,
    });

    return {
      conflict,
      message: conflict
        ? 'Technician sudah memiliki jadwal pada tanggal dan jam tersebut.'
        : '',
    };
  } catch (error) {
    console.error('VALIDATE SCHEDULE CONFLICT ERROR:', error.response || error);

    return {
      conflict: false,
    };
  }
}

export function checkLocalScheduleConflict({
  schedules = [],
  technician_id,
  scheduled_at,
  estimated_finish_at,
  booking_id,
}) {
  return checkConflictFromSchedules({
    schedules,
    technician_id,
    scheduled_at,
    estimated_finish_at,
    booking_id,
  });
}