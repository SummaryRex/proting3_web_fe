import api from './api';

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

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

  if (
    data?.service_bookings &&
    Array.isArray(data.service_bookings)
  ) {
    return data.service_bookings;
  }

  if (
    raw?.service_bookings &&
    Array.isArray(raw.service_bookings)
  ) {
    return raw.service_bookings;
  }

  return [];
}

function unwrapObject(data) {
  if (
    data?.data &&
    typeof data.data === 'object' &&
    !Array.isArray(data.data)
  ) {
    return data.data;
  }

  return data;
}

function normalizeStatus(status) {
  if (!status) return 'requested';

  const value = String(status)
    .toLowerCase()
    .trim()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');

  if (value === 'pending') return 'requested';
  if (value === 'waiting') return 'requested';
  if (value === 'menunggu') return 'requested';

  if (value === 'scheduled') return 'approved';
  if (value === 'terjadwal') return 'approved';

  if (value === 'finished') return 'completed';
  if (value === 'complete') return 'completed';
  if (value === 'selesai') return 'completed';

  if (value === 'cancelled') return 'canceled';
  if (value === 'cancel') return 'canceled';
  if (value === 'dibatalkan') return 'canceled';

  if (value === 'reject') return 'rejected';
  if (value === 'ditolak') return 'rejected';

  return value;
}

function cleanPayload(payload = {}) {
  const result = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
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

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  if (typeof value === 'object') {
    const rawId =
      value.id ??
      value.user_id ??
      value.technician_id ??
      value.mechanic_id ??
      value.value;

    const parsed = Number(rawId);

    return Number.isFinite(parsed)
      ? parsed
      : null;
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
      value.user?.name ||
      value.user?.username ||
      String(value.id || '-')
    );
  }

  return '-';
}

function getRoleName(item) {
  const roleSource =
    item?.role?.name ||
    item?.role?.slug ||
    item?.role?.label ||
    item?.role ||
    item?.user_role?.name ||
    item?.user_role?.slug ||
    item?.user_role ||
    item?.role_name ||
    item?.type ||
    item?.user?.role?.name ||
    item?.user?.role?.slug ||
    item?.user?.role ||
    item?.user?.role_name ||
    '';

  if (!roleSource) return '';

  if (typeof roleSource === 'object') {
    return String(
      roleSource.name ||
        roleSource.slug ||
        roleSource.label ||
        roleSource.code ||
        ''
    )
      .toLowerCase()
      .trim();
  }

  return String(roleSource)
    .toLowerCase()
    .trim();
}

function isTechnicianRole(item, hasAnyRoleField = true) {
  const role = getRoleName(item);

  if (role) {
    return [
      'technician',
      'mekanik',
      'teknisi',
      'mechanic',
    ].includes(role);
  }

  // Kalau endpoint /admin/technicians memang sudah khusus teknisi,
  // tapi backend tidak mengirim field role, tetap izinkan data muncul.
  // Namun jika ada sebagian item punya role, item tanpa role tidak ikut.
  return !hasAnyRoleField;
}

function getDateKey(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  try {
    return new Date(value)
      .toISOString()
      .slice(0, 10);
  } catch {
    return '';
  }
}

function buildNoteAdmin(scheduleData = {}) {
  const priority =
    scheduleData.priority || 'medium';

  const mechanic =
    scheduleData.mechanic ||
    scheduleData.technician ||
    scheduleData.technician_id;

  const mechanicName =
    scheduleData.technician_name ||
    getTechnicianName(mechanic);

  const notes =
    scheduleData.notes ||
    scheduleData.note ||
    '';

  if (scheduleData.note_admin) {
    return scheduleData.note_admin;
  }

  if (notes && notes.trim()) {
    return `Mechanic: ${
      mechanicName || '-'
    } | Priority: ${priority} | Notes: ${notes.trim()}`;
  }

  return `Mechanic: ${
    mechanicName || '-'
  } | Priority: ${priority}`;
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

  const priority =
    scheduleData.priority || 'medium';

  const technicianId =
    scheduleData.technician_id ||
    scheduleData.technicianId ||
    scheduleData.mechanic_id ||
    getTechnicianId(scheduleData.mechanic) ||
    getTechnicianId(scheduleData.technician);

  if (!scheduledAt) {
    throw new Error(
      'Tanggal schedule wajib diisi.'
    );
  }

  if (!technicianId) {
    throw new Error(
      'Technician wajib dipilih.'
    );
  }

  return cleanPayload({
    scheduled_at: scheduledAt,
    estimated_finish_at: estimatedFinishAt,
    technician_id: Number(technicianId),
    priority,
    note_admin: buildNoteAdmin(scheduleData),
  });
}

async function getAdminBookings(params = {}) {
  const { data } = await api.get(
    '/admin/bookings',
    {
      params,
    }
  );

  return unwrapList(data);
}

// -----------------------------------------------------------------------------
// TECHNICIANS
// -----------------------------------------------------------------------------

export async function getTechnicians() {
  try {
    let responseData = null;
    let fromDedicatedEndpoint = true;

    try {
      const { data } = await api.get(
        '/admin/technicians'
      );

      responseData = data;
    } catch (error) {
      fromDedicatedEndpoint = false;

      console.warn(
        'GET /admin/technicians gagal, fallback ke /admin/users:',
        error
      );
    }

    let technicians = unwrapList(responseData);

    // FALLBACK JIKA /admin/technicians ADA TAPI RETURN KOSONG
    if (!technicians.length) {
      fromDedicatedEndpoint = false;

      const { data } = await api.get(
        '/admin/users'
      );

      console.log(
        'USERS RAW FALLBACK:',
        data
      );

      technicians = unwrapList(data);
    }

    console.log(
      'TECHNICIANS BEFORE FILTER:',
      technicians
    );

    const hasAnyRoleField = technicians.some(
      (item) => Boolean(getRoleName(item))
    );

    technicians = technicians.filter(
      (item) => isTechnicianRole(
        item,
        fromDedicatedEndpoint && !hasAnyRoleField
          ? false
          : hasAnyRoleField
      )
    );

    console.log(
      'TECHNICIANS AFTER FILTER:',
      technicians
    );

    technicians = technicians.map(
      (item, index) => ({
        id:
          item.id ||
          item.user_id ||
          item.technician_id ||
          index + 1,

        name:
          item.name ||
          item.username ||
          item.full_name ||
          item.label ||
          `Technician ${
            index + 1
          }`,

        username:
          item.username ||
          item.name ||
          item.full_name,

        role:
          getRoleName(item) ||
          'technician',
      })
    );

    console.log(
      'FINAL TECHNICIANS:',
      technicians
    );

    return technicians;
  } catch (error) {
    console.error(
      'GET TECHNICIANS ERROR:',
      error
    );

    return [];
  }
}

// -----------------------------------------------------------------------------
// ADMIN BOOKING LIST
// -----------------------------------------------------------------------------

export async function getApprovedReports() {
  try {
    /*
     * Menyesuaikan backend ServiceBookingApprovalController terbaru:
     * status=approval hanya mengembalikan request driver yang masih requested.
     * Jika backend lama belum mendukung status=approval, fallback ke requested.
     */
    let bookings = await getAdminBookings({
      status: 'approval',
    });

    if (!bookings.length) {
      bookings = await getAdminBookings({
        status: 'requested',
      });
    }

    return bookings.filter((booking) => {
      return normalizeStatus(booking?.status) === 'requested';
    });
  } catch (error) {
    console.error(
      'GET APPROVED REPORTS ERROR:',
      error
    );

    return [];
  }
}

export async function getRequestedBookings() {
  return getApprovedReports();
}

export async function getSchedules() {
  try {
    /*
     * Menyesuaikan backend baru:
     * status=active mengembalikan jadwal aktif saja.
     * Jika backend lama belum mendukung status=active, fallback ke all.
     */
    let bookings = await getAdminBookings({
      status: 'active',
    });

    if (!bookings.length) {
      bookings = await getAdminBookings({
        status: 'all',
      });
    }

    return bookings.filter((booking) => {
      const status = normalizeStatus(booking?.status);

      return ![
        'requested',
        'rejected',
        'canceled',
      ].includes(status);
    });
  } catch (error) {
    console.error(
      'GET SCHEDULES ERROR:',
      error
    );

    return [];
  }
}

export async function getAllBookings() {
  try {
    return await getAdminBookings({
      status: 'all',
    });
  } catch (error) {
    console.error(
      'GET ALL BOOKINGS ERROR:',
      error
    );

    return [];
  }
}

export async function getBookingHistory() {
  try {
    return await getAdminBookings({
      status: 'history',
    });
  } catch (error) {
    console.error(
      'GET BOOKING HISTORY ERROR:',
      error
    );

    return [];
  }
}

export async function getActiveSchedules() {
  const bookings =
    await getSchedules();

  return bookings.filter((booking) => {
    const status =
      normalizeStatus(
        booking?.status
      );

    return [
      'approved',
      'rescheduled',
      'in_progress',
      'completed',
    ].includes(status);
  });
}

export async function getPendingScheduleRequests() {
  const bookings =
    await getApprovedReports();

  return bookings.filter((booking) => {
    return (
      normalizeStatus(
        booking?.status
      ) === 'requested'
    );
  });
}

// -----------------------------------------------------------------------------
// VALIDASI BENTROK JADWAL
// -----------------------------------------------------------------------------

export async function validateScheduleConflict({
  technician_id,
  scheduled_at,
  booking_id = null,
}) {
  try {
    if (!technician_id || !scheduled_at) {
      return {
        conflict: false,
        booking: null,
      };
    }

    const bookings =
      await getSchedules();

    const targetDate =
      getDateKey(scheduled_at);

    const conflict =
      bookings.find((booking) => {
        const bookingDate =
          getDateKey(
            booking?.scheduled_at ||
              booking?.dateVal ||
              booking?.date
          );

        const bookingTechnicianId =
          booking?.technician_id ||
          booking?.mechanic_id ||
          booking?.technician?.id ||
          booking?.mechanic?.id ||
          booking?.user_id;

        const sameTechnician =
          Number(bookingTechnicianId) ===
          Number(technician_id);

        const sameDate =
          bookingDate === targetDate;

        const activeStatus = ![
          'completed',
          'canceled',
          'rejected',
        ].includes(
          normalizeStatus(
            booking?.status
          )
        );

        const notCurrentBooking =
          Number(booking?.id) !==
          Number(booking_id);

        return (
          sameTechnician &&
          sameDate &&
          activeStatus &&
          notCurrentBooking
        );
      });

    return {
      conflict: !!conflict,
      booking: conflict || null,
    };
  } catch (error) {
    console.error(
      'VALIDATE CONFLICT ERROR:',
      error
    );

    return {
      conflict: false,
      booking: null,
    };
  }
}

// -----------------------------------------------------------------------------
// ADMIN ACTIONS
// -----------------------------------------------------------------------------

export async function approveBooking(
  bookingId,
  scheduleData = {}
) {
  if (!bookingId) {
    throw new Error(
      'Booking ID tidak valid.'
    );
  }

  const payload =
    buildSchedulePayload(
      scheduleData
    );

  const validation =
    await validateScheduleConflict({
      technician_id:
        payload.technician_id,
      scheduled_at:
        payload.scheduled_at,
      booking_id: bookingId,
    });

  if (validation.conflict) {
    throw new Error(
      'Technician sudah memiliki jadwal pada tanggal tersebut.'
    );
  }

  const { data } = await api.post(
    `/admin/bookings/${bookingId}/approve`,
    payload
  );

  return unwrapObject(data);
}

export async function rescheduleBooking(
  bookingId,
  scheduleData = {}
) {
  if (!bookingId) {
    throw new Error(
      'Booking ID tidak valid.'
    );
  }

  const payload =
    buildSchedulePayload(
      scheduleData
    );

  const validation =
    await validateScheduleConflict({
      technician_id:
        payload.technician_id,
      scheduled_at:
        payload.scheduled_at,
      booking_id: bookingId,
    });

  if (validation.conflict) {
    throw new Error(
      'Technician sudah memiliki jadwal pada tanggal tersebut.'
    );
  }

  const { data } = await api.post(
    `/admin/bookings/${bookingId}/reschedule`,
    payload
  );

  return unwrapObject(data);
}

export async function rejectBooking(
  bookingId,
  payload = {}
) {
  if (!bookingId) {
    throw new Error(
      'Booking ID tidak valid.'
    );
  }

  const body = cleanPayload({
    note_admin:
      payload.note_admin ||
      payload.notes ||
      payload.note ||
      'Permintaan jadwal ditolak oleh admin.',
  });

  const { data } = await api.post(
    `/admin/bookings/${bookingId}/reject`,
    body
  );

  return unwrapObject(data);
}

export async function cancelBooking(
  bookingId,
  payload = {}
) {
  if (!bookingId) {
    throw new Error(
      'Booking ID tidak valid.'
    );
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

export async function createSchedule(
  scheduleData = {}
) {
  const bookingId =
    scheduleData.bookingId ||
    scheduleData.booking_id ||
    scheduleData.id;

  if (!bookingId) {
    throw new Error(
      'Booking ID wajib dikirim.'
    );
  }

  return approveBooking(
    bookingId,
    scheduleData
  );
}

export async function updateSchedule(
  id,
  updates = {}
) {
  const bookingId =
    updates.bookingId ||
    updates.booking_id ||
    id;

  if (!bookingId) {
    throw new Error(
      'Booking ID tidak valid.'
    );
  }

  return rescheduleBooking(
    bookingId,
    updates
  );
}

// -----------------------------------------------------------------------------
// OPTIONAL HELPERS
// -----------------------------------------------------------------------------

export function mapBookingStatusLabel(
  status
) {
  const normalized =
    normalizeStatus(status);

  const labels = {
    requested: 'Requested',
    approved: 'Scheduled',
    rescheduled: 'Rescheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    canceled: 'Canceled',
    rejected: 'Rejected',
  };

  return (
    labels[normalized] ||
    status ||
    '-'
  );
}

export function isBookingEditable(
  status
) {
  const normalized =
    normalizeStatus(status);

  return [
    'approved',
    'rescheduled',
  ].includes(normalized);
}

export function isBookingCancelable(
  status
) {
  const normalized =
    normalizeStatus(status);

  return [
    'requested',
    'approved',
    'rescheduled',
  ].includes(normalized);
}

export function isBookingRejectable(
  status
) {
  const normalized =
    normalizeStatus(status);

  return [
    'requested',
    'rescheduled',
  ].includes(normalized);
}

export function isBookingClosed(
  status
) {
  const normalized =
    normalizeStatus(status);

  return [
    'completed',
    'canceled',
    'rejected',
  ].includes(normalized);
}
