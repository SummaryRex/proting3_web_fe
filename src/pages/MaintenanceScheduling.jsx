import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, XCircle, RefreshCw, CalendarCheck } from 'lucide-react';

import DashboardLayout from '../components/layouts/DashboardLayout';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ScheduleModal from '../components/modals/ScheduleModal';
import EditScheduleModal from '../components/modals/EditScheduleModal';

import {
  getApprovedReports,
  getSchedules,
  approveBooking,
  rescheduleBooking,
  cancelBooking,
} from '../services/scheduleService';

const reportColumns = [
  { label: 'Equipment Name' },
  { label: 'Damage Description' },
  { label: 'Operator' },
  { label: 'Preferred Date' },
  { label: 'Report Date' },
  { label: 'Action' },
];

const scheduleColumns = [
  { label: 'Schedule ID' },
  { label: 'Equipment Name' },
  { label: 'Driver' },
  { label: 'Technician' },
  { label: 'Scheduled Date' },
  { label: 'Priority' },
  { label: 'Status' },
  { label: 'Actions', className: '!text-right !pr-5' },
];

const statusLabels = {
  requested: 'Requested',
  pending: 'Requested',
  approved: 'Scheduled',
  scheduled: 'Scheduled',
  rescheduled: 'Rescheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  finished: 'Completed',
  selesai: 'Completed',
  canceled: 'Canceled',
  cancelled: 'Canceled',
  rejected: 'Rejected',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const activeScheduleStatuses = [
  'approved',
  'scheduled',
  'rescheduled',
  'in_progress',
  'completed',
  'canceled',
  'cancelled',
];

const editableStatuses = ['approved', 'scheduled', 'rescheduled'];
const cancelableStatuses = ['approved', 'scheduled', 'rescheduled', 'requested'];

function normalizeStatus(value) {
  if (!value) return 'requested';

  const status = String(value)
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

function getVehicleFromBooking(booking) {
  return (
    booking?.vehicle ||
    booking?.damage_report?.vehicle ||
    booking?.damageReport?.vehicle ||
    booking?.report?.vehicle ||
    {}
  );
}

function getDriverFromBooking(booking) {
  return (
    booking?.driver ||
    booking?.damage_report?.driver ||
    booking?.damageReport?.driver ||
    booking?.report?.driver ||
    {}
  );
}

function getDamageReportFromBooking(booking) {
  return (
    booking?.damage_report ||
    booking?.damageReport ||
    booking?.report ||
    {}
  );
}

function getTechnicianFromBooking(booking) {
  return (
    booking?.technician ||
    booking?.assigned_technician ||
    booking?.assignedTechnician ||
    {}
  );
}

function extractMechanicFromNote(noteAdmin) {
  if (!noteAdmin || typeof noteAdmin !== 'string') {
    return '';
  }

  const match = noteAdmin.match(/Mechanic:\s*([^|]+)/i);

  if (!match) {
    return '';
  }

  return match[1]?.trim() || '';
}

function getMechanicNameFromBooking(booking) {
  const technician = getTechnicianFromBooking(booking);
  const report = getDamageReportFromBooking(booking);
  const latest = report?.latest_technician_response;

  if (typeof technician === 'string') {
    return technician;
  }

  return (
    technician?.username ||
    technician?.name ||
    latest?.technician?.username ||
    latest?.technician?.name ||
    booking?.technician_name ||
    booking?.mechanic_name ||
    extractMechanicFromNote(booking?.note_admin) ||
    '-'
  );
}

function getMechanicIdFromValue(value) {
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

function getMechanicNameFromValue(value) {
  if (!value) return '-';

  if (typeof value === 'string') return value;

  if (typeof value === 'number') return String(value);

  if (typeof value === 'object') {
    return (
      value.username ||
      value.name ||
      value.label ||
      value.full_name ||
      value.user?.username ||
      value.user?.name ||
      String(value.id || '-')
    );
  }

  return '-';
}

function normalizeBookingToReport(booking) {
  const vehicle = getVehicleFromBooking(booking);
  const driver = getDriverFromBooking(booking);
  const report = getDamageReportFromBooking(booking);

  return {
    id: report?.id || booking?.damage_report_id || booking?.id,
    bookingId: booking?.id,
    damageReportId: booking?.damage_report_id || report?.id,

    equip:
      vehicle?.equipment_name ||
      vehicle?.name ||
      booking?.equipment_name ||
      'Unknown Unit',

    plateNumber:
      vehicle?.plate_number ||
      booking?.plate_number ||
      '-',

    desc:
      report?.description ||
      booking?.note_driver ||
      '-',

    damageType:
      report?.damage_type ||
      '-',

    operator:
      driver?.username ||
      driver?.name ||
      '-',

    date:
      booking?.requested_at ||
      report?.created_at ||
      booking?.created_at ||
      '-',

    preferredAt:
      booking?.preferred_at || '-',

    priority:
      booking?.priority || 'medium',

    status:
      normalizeStatus(booking?.status || 'requested'),

    raw: booking,
  };
}

function normalizeBookingToSchedule(booking) {
  const vehicle = getVehicleFromBooking(booking);
  const driver = getDriverFromBooking(booking);
  const report = getDamageReportFromBooking(booking);
  const technician = getTechnicianFromBooking(booking);

  const scheduledDate =
    booking?.scheduled_at ||
    booking?.preferred_at ||
    booking?.updated_at ||
    booking?.created_at;

  const status = normalizeStatus(booking?.status || 'approved');

  const technicianId =
    booking?.technician_id ||
    booking?.mechanic_id ||
    technician?.id ||
    technician?.user_id ||
    technician?.technician_id ||
    null;

  const technicianName = getMechanicNameFromBooking(booking);

  return {
    id: booking?.id ? `MS-${booking.id}` : '-',
    bookingId: booking?.id,
    damageReportId: booking?.damage_report_id || report?.id,

    equip:
      vehicle?.equipment_name ||
      vehicle?.name ||
      booking?.equipment_name ||
      'Unknown Unit',

    plateNumber:
      vehicle?.plate_number ||
      booking?.plate_number ||
      '-',

    driver:
      driver?.username ||
      driver?.name ||
      '-',

    technician_id: technicianId,
    mechanic_id: technicianId,
    technician_name: technicianName,
    mechanic: technicianName,

    date: formatDate(scheduledDate),
    dateVal: booking?.scheduled_at || scheduledDate || '',

    estimatedFinishAt: booking?.estimated_finish_at || '',
    preferredAt: booking?.preferred_at || '',

    priority:
      booking?.priority ||
      'medium',

    status,

    noteAdmin:
      booking?.note_admin || '',

    raw: booking,
  };
}

function buildAdminNote({ mechanic, priority, notes }) {
  const mechanicName = getMechanicNameFromValue(mechanic);
  const cleanPriority = priority || 'medium';
  const cleanNotes = notes?.trim();

  if (cleanNotes) {
    return `Mechanic: ${mechanicName || '-'} | Priority: ${cleanPriority} | Notes: ${cleanNotes}`;
  }

  return `Mechanic: ${mechanicName || '-'} | Priority: ${cleanPriority}`;
}

export default function MaintenanceScheduling() {
  const navigate = useNavigate();

  const [requestedRows, setRequestedRows] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [schedEquip, setSchedEquip] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const [showSchedule, setShowSchedule] = useState(false);
  const [editData, setEditData] = useState(null);

  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = isLoadingReports || isLoadingSchedules;

  const stats = useMemo(() => {
    const requested = requestedRows.length;

    const active = schedules.filter((x) =>
      ['approved', 'rescheduled', 'in_progress'].includes(x.status)
    ).length;

    const completed = schedules.filter((x) => x.status === 'completed').length;
    const canceled = schedules.filter((x) => x.status === 'canceled').length;

    return {
      requested,
      active,
      completed,
      canceled,
    };
  }, [requestedRows, schedules]);

  const loadRequestedBookings = async () => {
    try {
      setIsLoadingReports(true);

      const bookings = await getApprovedReports();

      console.log('REQUESTED API:', bookings);

      const rows = (Array.isArray(bookings) ? bookings : [])
        .filter((booking) => normalizeStatus(booking?.status) === 'requested')
        .map(normalizeBookingToReport);

      setRequestedRows(rows);
    } catch (error) {
      console.error('LOAD REQUEST ERROR:', error);
      setRequestedRows([]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadSchedules = async () => {
    try {
      setIsLoadingSchedules(true);

      const bookings = await getSchedules();

      console.log('SCHEDULE API:', bookings);

      const rows = (Array.isArray(bookings) ? bookings : [])
        .filter((booking) =>
          activeScheduleStatuses.includes(normalizeStatus(booking?.status))
        )
        .map(normalizeBookingToSchedule);

      setSchedules(rows);
    } catch (error) {
      console.error('LOAD SCHEDULE ERROR:', error);
      setSchedules([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      loadRequestedBookings(),
      loadSchedules(),
    ]);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openScheduleModal = (report) => {
    setSelectedReport(report);
    setSchedEquip(report.equip);
    setShowSchedule(true);
  };

  const confirmSchedule = async (scheduleData) => {
    if (!selectedReport) return;

    try {
      setIsSubmitting(true);

      console.log('SCHEDULE DATA FROM MODAL:', scheduleData);

      if (!selectedReport.bookingId) {
        alert('Booking ID tidak ditemukan.');
        return;
      }

      const technicianId =
        scheduleData?.technician_id ||
        scheduleData?.mechanic_id ||
        scheduleData?.technician?.id ||
        scheduleData?.mechanic?.id ||
        getMechanicIdFromValue(scheduleData?.technician) ||
        getMechanicIdFromValue(scheduleData?.mechanic);

      if (!technicianId) {
        alert('Technician wajib dipilih.');
        return;
      }

      const scheduledAt =
        scheduleData?.scheduled_at ||
        scheduleData?.date ||
        scheduleData?.dateVal;

      if (!scheduledAt) {
        alert('Tanggal schedule wajib diisi.');
        return;
      }

      const mechanicName =
        scheduleData?.technician_name ||
        getMechanicNameFromValue(scheduleData?.technician) ||
        getMechanicNameFromValue(scheduleData?.mechanic);

      const payload = {
        scheduled_at: scheduledAt,
        estimated_finish_at:
          scheduleData?.estimated_finish_at ||
          scheduleData?.estimatedFinishAt ||
          null,
        priority: scheduleData?.priority || 'medium',
        technician_id: Number(technicianId),
        note_admin: buildAdminNote({
          mechanic: mechanicName,
          priority: scheduleData?.priority,
          notes: scheduleData?.notes,
        }),
      };

      console.log('APPROVE BOOKING PAYLOAD:', payload);

      await approveBooking(selectedReport.bookingId, payload);

      setShowSchedule(false);
      setSelectedReport(null);
      setSchedEquip('');

      await refreshAll();

      alert('Schedule maintenance berhasil dibuat.');
    } catch (error) {
      console.error('CONFIRM SCHEDULE ERROR:', error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Gagal membuat schedule maintenance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (id) => {
    const schedule = schedules.find((x) => x.id === id);

    if (schedule) {
      setEditData(schedule);
    }
  };

  const saveEdit = async (updated) => {
    try {
      setIsSubmitting(true);

      console.log('EDIT DATA FROM MODAL:', updated);

      if (!updated?.bookingId) {
        alert('Booking ID tidak valid.');
        return;
      }

      if (updated?.status === 'cancelled' || updated?.status === 'canceled') {
        await cancelBooking(updated.bookingId, {
          note_admin:
            updated.noteAdmin ||
            `Schedule untuk ${updated.equip || 'unit'} dibatalkan admin.`,
        });

        setEditData(null);
        await refreshAll();

        alert('Schedule berhasil dibatalkan.');
        return;
      }

      if (!updated?.dateVal) {
        alert('Tanggal schedule wajib diisi.');
        return;
      }

      const technicianId =
        updated?.technician_id ||
        updated?.mechanic_id ||
        updated?.raw?.technician_id ||
        updated?.raw?.mechanic_id ||
        updated?.raw?.technician?.id ||
        updated?.raw?.mechanic?.id ||
        getMechanicIdFromValue(updated?.technician) ||
        getMechanicIdFromValue(updated?.mechanic);

      if (!technicianId) {
        alert('Technician ID tidak ditemukan. Data schedule tidak valid.');
        return;
      }

      const mechanicName =
        updated?.technician_name ||
        updated?.mechanic_name ||
        getMechanicNameFromValue(updated?.technician) ||
        getMechanicNameFromValue(updated?.mechanic) ||
        getMechanicNameFromBooking(updated?.raw);

      const payload = {
        scheduled_at: updated.dateVal,
        estimated_finish_at: updated.estimatedFinishAt || null,
        priority: updated.priority || 'medium',
        technician_id: Number(technicianId),
        note_admin:
          updated.noteAdmin?.trim() ||
          buildAdminNote({
            mechanic: mechanicName,
            priority: updated.priority,
            notes: '',
          }),
      };

      console.log('RESCHEDULE PAYLOAD:', payload);

      await rescheduleBooking(updated.bookingId, payload);

      setEditData(null);

      await refreshAll();

      alert('Schedule berhasil diperbarui.');
    } catch (error) {
      console.error('SAVE EDIT ERROR:', error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Gagal update schedule.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSchedule = async (schedule) => {
    if (!schedule?.bookingId) {
      alert('ID booking tidak valid.');
      return;
    }

    const confirmed = window.confirm(
      `Batalkan jadwal maintenance untuk ${schedule.equip}?`
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      await cancelBooking(schedule.bookingId, {
        note_admin: `Schedule untuk ${schedule.equip} dibatalkan admin.`,
      });

      await refreshAll();
    } catch (error) {
      console.error('CANCEL SCHEDULE ERROR:', error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Gagal membatalkan jadwal.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Maintenance Scheduling">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="panel p-5">
          <div className="text-[0.75rem] text-djati-muted">
            Waiting Admin
          </div>
          <div className="text-2xl font-bold text-djati-amber mt-1">
            {stats.requested}
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[0.75rem] text-djati-muted">
            Active Schedule
          </div>
          <div className="text-2xl font-bold text-blue-300 mt-1">
            {stats.active}
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[0.75rem] text-djati-muted">
            Completed
          </div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            {stats.completed}
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-[0.75rem] text-djati-muted">
            Canceled
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1">
            {stats.canceled}
          </div>
        </div>
      </section>

      <section className="panel p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-[#e8e8e8]">
              Requested Service Bookings
            </h2>
            <p className="text-[0.75rem] text-djati-muted mt-1">
              Booking dari driver yang masih menunggu admin menentukan jadwal dan teknisi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isLoading || isSubmitting}
              onClick={refreshAll}
              className="text-[0.8rem] font-semibold text-djati-amber hover:underline disabled:opacity-60 flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/damage-reports');
              }}
              className="text-[0.8rem] font-semibold text-djati-amber no-underline hover:underline"
            >
              View All
            </a>
          </div>
        </div>

        <DataTable
          columns={reportColumns}
          data={requestedRows}
          renderRow={(r) => (
            <tr
              key={`${r.bookingId || 'booking'}-${r.id}`}
              className="table-row-hover"
            >
              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                <strong className="text-djati-text-bright font-semibold">
                  {r.equip}
                </strong>
                <div className="text-[0.7rem] text-djati-muted mt-1">
                  Plate: {r.plateNumber || '-'}
                </div>
                <div className="text-[0.7rem] text-djati-muted mt-1">
                  Booking: #{r.bookingId || '-'} • Report: #{r.damageReportId || '-'}
                </div>
              </td>

              <td className="px-4 py-3.5 max-w-[260px] whitespace-nowrap overflow-hidden text-ellipsis text-[0.84rem] text-white/50 border-b border-white/[0.04]">
                {r.desc}
                {r.damageType && r.damageType !== '-' && (
                  <div className="text-[0.7rem] text-djati-muted mt-1">
                    Type: {r.damageType}
                  </div>
                )}
              </td>

              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                {r.operator}
              </td>

              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                {formatDate(r.preferredAt)}
              </td>

              <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                {formatDate(r.date)}
              </td>

              <td className="px-4 py-3.5 border-b border-white/[0.04]">
                <button
                  disabled={isSubmitting}
                  onClick={() => openScheduleModal(r)}
                  className="btn-primary px-4 py-2 text-[0.8rem] whitespace-nowrap disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  <CalendarCheck size={14} />
                  Schedule
                </button>
              </td>
            </tr>
          )}
        />

        {isLoadingReports && (
          <div className="mt-4 text-sm text-djati-muted">
            Loading requested bookings...
          </div>
        )}

        {!isLoadingReports && requestedRows.length === 0 && (
          <div className="mt-4 text-sm text-djati-muted">
            Belum ada booking driver yang menunggu jadwal.
          </div>
        )}
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-[#e8e8e8]">
              Maintenance Schedule List
            </h2>
            <p className="text-[0.75rem] text-djati-muted mt-1">
              Jadwal service yang sudah disetujui admin dan akan tampil di mobile teknisi.
            </p>
          </div>

          <button
            type="button"
            disabled={isLoading || isSubmitting}
            onClick={refreshAll}
            className="text-[0.8rem] font-semibold text-djati-amber hover:underline disabled:opacity-60 flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <DataTable
          columns={scheduleColumns}
          data={schedules}
          renderRow={(s) => {
            const isEditDisabled =
              isSubmitting || !editableStatuses.includes(s.status);

            const isCancelDisabled =
              isSubmitting || !cancelableStatuses.includes(s.status);

            return (
              <tr key={s.id} className="table-row-hover">
                <td className="px-4 py-3.5 font-semibold text-[0.82rem] text-white/60 border-b border-white/[0.04]">
                  #{s.id}
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] border-b border-white/[0.04]">
                  <strong className="text-djati-text-bright font-semibold">
                    {s.equip}
                  </strong>
                  <div className="text-[0.7rem] text-djati-muted mt-1">
                    Plate: {s.plateNumber || '-'}
                  </div>
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  {s.driver}
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  {s.mechanic}
                </td>

                <td className="px-4 py-3.5 text-[0.84rem] text-djati-text border-b border-white/[0.04]">
                  {s.date}
                </td>

                <td className="px-4 py-3.5 border-b border-white/[0.04]">
                  <StatusBadge variant={s.priority}>
                    {priorityLabels[s.priority] || s.priority || 'Medium'}
                  </StatusBadge>
                </td>

                <td className="px-4 py-3.5 border-b border-white/[0.04]">
                  <StatusBadge variant={s.status}>
                    {statusLabels[s.status] || s.status}
                  </StatusBadge>
                </td>

                <td className="px-4 py-3.5 text-right pr-5 border-b border-white/[0.04]">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      className="btn-icon"
                      title={
                        isEditDisabled
                          ? 'Hanya jadwal scheduled/rescheduled yang bisa diedit'
                          : 'Edit'
                      }
                      disabled={isEditDisabled}
                      onClick={() => openEditModal(s.id)}
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      className="btn-icon hover:!bg-[rgba(211,47,47,0.12)] hover:!text-status-critical"
                      title={
                        isCancelDisabled
                          ? 'Jadwal ini tidak bisa dibatalkan'
                          : 'Cancel'
                      }
                      disabled={isCancelDisabled}
                      onClick={() => handleCancelSchedule(s)}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />

        {isLoadingSchedules && (
          <div className="mt-4 text-sm text-djati-muted">
            Loading schedules...
          </div>
        )}

        {!isLoadingSchedules && schedules.length === 0 && (
          <div className="mt-4 text-sm text-djati-muted">
            Belum ada jadwal maintenance aktif.
          </div>
        )}
      </section>

      {showSchedule && (
        <ScheduleModal
          equipName={schedEquip}
          existingSchedules={schedules}
          onClose={() => {
            setShowSchedule(false);
            setSelectedReport(null);
            setSchedEquip('');
          }}
          onConfirm={confirmSchedule}
        />
      )}

      {editData && (
        <EditScheduleModal
          data={editData}
          onClose={() => setEditData(null)}
          onSave={saveEdit}
        />
      )}
    </DashboardLayout>
  );
}