import api from './api';

function unwrapList(data) {
  const raw = data?.data ?? data;

  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw?.data && Array.isArray(raw.data)) {
    return raw.data;
  }

  if (data?.bookings && Array.isArray(data.bookings)) {
    return data.bookings;
  }

  if (data?.service_bookings && Array.isArray(data.service_bookings)) {
    return data.service_bookings;
  }

  return [];
}

function unwrapObject(data) {
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
}

function normalizeStatus(status) {
  if (!status) return 'requested';

  const value = String(status).toLowerCase().trim();

  if (value === 'pending') return 'requested';
  if (value === 'scheduled') return 'approved';
  if (value === 'finished') return 'completed';
  if (value === 'selesai') return 'completed';
  if (value === 'cancelled') return 'canceled';
  if (value === 'dibatalkan') return 'canceled';

  return value;
}

function cleanPayload(payload) {
  const result = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  });

  return result;
}

function getTechnicianId(value) {
  if (!value) return null;

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    const rawId =
      value.id ||
      value.user_id ||
      value.technician_id ||
      value.value;

    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getTechnicianName(value) {
  if (!value) return '-';

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    return (
      value.name ||
      value.username ||
      value.label ||
      value.full_name ||
      String(value.id || '-')
    );
  }

  return '-';
}

function buildNoteAdmin(scheduleData = {}) {
  const priority = scheduleData.priority || 'medium';
  const mechanic =
    scheduleData.mechanic ||
    scheduleData.technician ||
    scheduleData.technician_id;

  const mechanicName = getTechnicianName(mechanic);
  const notes = scheduleData.notes || scheduleData.note || '';

  if (scheduleData.note_admin) {
    return scheduleData.note_admin;
  }

  if (notes && notes.trim()) {
    return `Mechanic: ${mechanicName || '-'} | Priority: ${priority} | Notes: ${notes.trim()}`;
  }

  return `Mechanic: ${mechanicName || '-'} | Priority: ${priority}`;
}

function buildSchedulePayload(scheduleData = {}) {
  const scheduledAt =
    scheduleData.scheduled_at ||
    scheduleData.scheduledAt ||
    scheduleData.date ||
    scheduleData.dateVal;

  const estimatedFinishAt =
    scheduleData.estimated_finish_at ||
    scheduleData.estimatedFinishAt ||
    scheduleData.finish_at ||
    scheduleData.finishAt;

  const priority = scheduleData.priority || 'medium';

  const technicianId =
    scheduleData.technician_id ||
    scheduleData.technicianId ||
    getTechnicianId(scheduleData.mechanic) ||
    getTechnicianId(scheduleData.technician);

  if (!scheduledAt) {
    throw new Error('Tanggal schedule wajib diisi.');
  }

  return cleanPayload({
    scheduled_at: scheduledAt,
    estimated_finish_at: estimatedFinishAt,
    technician_id: technicianId,
    priority,
    note_admin: buildNoteAdmin(scheduleData),
  });
}

// -----------------------------------------------------------------------------
// ADMIN BOOKING LIST
// -----------------------------------------------------------------------------

export async function getApprovedReports() {
  const { data } = await api.get('/admin/bookings', {
    params: {
      status: 'requested',
    },
  });

  return unwrapList(data);
}

export async function getRequestedBookings() {
  return getApprovedReports();
}

export async function getSchedules() {
  const { data } = await api.get('/admin/bookings', {
    params: {
      status: 'all',
    },
  });

  return unwrapList(data);
}

export async function getAllBookings() {
  return getSchedules();
}

export async function getActiveSchedules() {
  const bookings = await getSchedules();

  return bookings.filter((booking) => {
    const status = normalizeStatus(booking?.status);

    return [
      'approved',
      'rescheduled',
      'in_progress',
      'completed',
    ].includes(status);
  });
}

export async function getPendingScheduleRequests() {
  const bookings = await getApprovedReports();

  return bookings.filter((booking) => {
    return normalizeStatus(booking?.status) === 'requested';
  });
}

// -----------------------------------------------------------------------------
// ADMIN ACTIONS
// -----------------------------------------------------------------------------

export async function approveBooking(bookingId, scheduleData = {}) {
  if (!bookingId) {
    throw new Error('Booking ID tidak valid.');
  }

  const payload = buildSchedulePayload(scheduleData);

  const { data } = await api.post(
    `/admin/bookings/${bookingId}/approve`,
    payload
  );

  return unwrapObject(data);
}

export async function rescheduleBooking(bookingId, scheduleData = {}) {
  if (!bookingId) {
    throw new Error('Booking ID tidak valid.');
  }

  const payload = buildSchedulePayload(scheduleData);

  const { data } = await api.post(
    `/admin/bookings/${bookingId}/reschedule`,
    payload
  );

  return unwrapObject(data);
}

export async function cancelBooking(bookingId, payload = {}) {
  if (!bookingId) {
    throw new Error('Booking ID tidak valid.');
  }

  const body = cleanPayload({
    note_admin:
      payload.note_admin ||
      payload.notes ||
      payload.note ||
      '',
  });

  const { data } = await api.post(
    `/admin/bookings/${bookingId}/cancel`,
    body
  );

  return unwrapObject(data);
}

// -----------------------------------------------------------------------------
// COMPATIBILITY UNTUK KODE LAMA
// -----------------------------------------------------------------------------

export async function createSchedule(scheduleData = {}) {
  const bookingId =
    scheduleData.bookingId ||
    scheduleData.booking_id ||
    scheduleData.id;

  if (!bookingId) {
    throw new Error(
      'Booking ID wajib dikirim. Schedule sekarang dibuat dari service booking driver.'
    );
  }

  return approveBooking(bookingId, scheduleData);
}

export async function updateSchedule(id, updates = {}) {
  const bookingId =
    updates.bookingId ||
    updates.booking_id ||
    id;

  if (!bookingId) {
    throw new Error('Booking ID tidak valid.');
  }

  return rescheduleBooking(bookingId, updates);
}

// -----------------------------------------------------------------------------
// OPTIONAL HELPERS
// -----------------------------------------------------------------------------

export function mapBookingStatusLabel(status) {
  const normalized = normalizeStatus(status);

  const labels = {
    requested: 'Requested',
    approved: 'Scheduled',
    rescheduled: 'Rescheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    canceled: 'Canceled',
    rejected: 'Rejected',
  };

  return labels[normalized] || status || '-';
}

export function isBookingEditable(status) {
  const normalized = normalizeStatus(status);

  return ['approved', 'rescheduled'].includes(normalized);
}

export function isBookingCancelable(status) {
  const normalized = normalizeStatus(status);

  return ['requested', 'approved', 'rescheduled'].includes(normalized);
}

export function isBookingClosed(status) {
  const normalized = normalizeStatus(status);

  return ['completed', 'canceled', 'rejected'].includes(normalized);
}