import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ListChecks,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import ScheduleModal from '../components/modals/ScheduleModal';

import {
  getApprovedReports,
  getSchedules,
  approveBooking,
  rejectBooking,
} from '../services/scheduleService';

const statusLabels = {
  requested: 'Menunggu Admin',
  pending: 'Menunggu Admin',
  approved: 'Terjadwal',
  scheduled: 'Terjadwal',
  rescheduled: 'Dijadwalkan Ulang',
  in_progress: 'Dalam Proses',
  completed: 'Selesai',
  finished: 'Selesai',
  selesai: 'Selesai',
  canceled: 'Dibatalkan',
  cancelled: 'Dibatalkan',
  rejected: 'Ditolak',
};

const priorityLabels = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  critical: 'Kritis',
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

function getFriendlyErrorMessage(error, fallback) {
  const serverMessage = error?.response?.data?.message;
  const message = String(serverMessage || '').toLowerCase();

  const isTechnicalMessage =
    message.includes('localhost') ||
    message.includes('127.0.0.1') ||
    message.includes('endpoint') ||
    message.includes('network error') ||
    message.includes('request failed') ||
    message.includes('axios') ||
    message.includes('http://') ||
    message.includes('https://');

  if (serverMessage && !isTechnicalMessage) {
    return serverMessage;
  }

  return fallback;
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
      month: 'long',
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

  const match = noteAdmin.match(/(?:Mechanic|Teknisi):\s*([^|]+)/i);

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
      'Unit Tidak Diketahui',

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
      'Unit Tidak Diketahui',

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
      booking?.priority || 'medium',

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
    return `Teknisi: ${mechanicName || '-'} | Prioritas: ${cleanPriority} | Catatan: ${cleanNotes}`;
  }

  return `Teknisi: ${mechanicName || '-'} | Prioritas: ${cleanPriority}`;
}

function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const colorClass =
    notification.type === 'success'
      ? 'border-green-500/40 bg-green-500/10 text-green-400'
      : notification.type === 'warning'
      ? 'border-djati-amber/40 bg-djati-amber/10 text-djati-amber'
      : 'border-red-500/40 bg-red-500/10 text-red-400';

  const title =
    notification.type === 'success'
      ? 'Berhasil'
      : notification.type === 'warning'
      ? 'Perhatian'
      : 'Terjadi Kendala';

  return (
    <div className="fixed right-5 top-5 z-[9999] w-[340px] max-w-[calc(100vw-2rem)]">
      <div
        className={`rounded-2xl border bg-[#171a23] px-4 py-3 shadow-2xl backdrop-blur ${colorClass}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold">{title}</h4>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              {notification.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-lg leading-none opacity-70 transition hover:opacity-100"
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, hint, tone = 'amber' }) {
  const toneClass =
    tone === 'green'
      ? 'border-green-500/20 bg-green-500/10 text-green-400'
      : tone === 'blue'
      ? 'border-blue-500/20 bg-blue-500/10 text-blue-300'
      : tone === 'red'
      ? 'border-red-500/20 bg-red-500/10 text-red-400'
      : 'border-djati-amber/20 bg-djati-amber/10 text-djati-amber';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/45">{label}</p>
          <h3 className="mt-2 text-3xl font-bold text-white">{value}</h3>
          {hint && <p className="mt-1 text-xs text-white/30">{hint}</p>}
        </div>

        <div className={`rounded-2xl border p-3 ${toneClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const value = priority || 'medium';

  const config = {
    low: 'border-green-500/30 bg-green-500/10 text-green-400',
    medium: 'border-djati-amber/30 bg-djati-amber/10 text-djati-amber',
    high: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    critical: 'border-red-500/30 bg-red-500/10 text-red-400',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        config[value] || config.medium
      }`}
    >
      {priorityLabels[value] || value || 'Sedang'}
    </span>
  );
}

function ScheduleStatusBadge({ status }) {
  const value = normalizeStatus(status);

  const config = {
    requested: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    approved: 'border-green-500/30 bg-green-500/10 text-green-400',
    rescheduled: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    in_progress: 'border-djati-amber/30 bg-djati-amber/10 text-djati-amber',
    completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    canceled: 'border-red-500/30 bg-red-500/10 text-red-400',
    rejected: 'border-red-500/30 bg-red-500/10 text-red-400',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        config[value] || 'border-white/10 bg-white/5 text-white/60'
      }`}
    >
      {statusLabels[value] || value || '-'}
    </span>
  );
}

function EmptyState({ title, description, icon: Icon = ClipboardList }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Icon size={22} className="text-white/35" />
      </div>

      <p className="font-semibold text-white/70">{title}</p>

      {description && (
        <p className="mt-1 text-xs text-white/35">{description}</p>
      )}
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171a23] p-5 shadow-2xl">
        <h3 className="text-base font-bold text-white">{title}</h3>

        <p className="mt-2 text-sm leading-relaxed text-white/50">
          {message}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceScheduling() {
  const navigate = useNavigate();

  const [requestedRows, setRequestedRows] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [schedEquip, setSchedEquip] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const [showSchedule, setShowSchedule] = useState(false);

  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
    });
  };

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [notification]);

  const stats = useMemo(() => {
    const requested = requestedRows.length;

    const active = schedules.filter((item) =>
      ['approved', 'rescheduled', 'in_progress'].includes(item.status)
    ).length;

    const completed = schedules.filter((item) => item.status === 'completed').length;
    const canceled = schedules.filter((item) => item.status === 'canceled').length;

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

      const rows = (Array.isArray(bookings) ? bookings : [])
        .filter((booking) => normalizeStatus(booking?.status) === 'requested')
        .map(normalizeBookingToReport);

      setRequestedRows(rows);
    } catch (error) {
      console.error('GAGAL MEMUAT PERMINTAAN JADWAL:', error);

      showNotification(
        'error',
        getFriendlyErrorMessage(
          error,
          'Permintaan jadwal belum dapat dimuat. Periksa koneksi atau coba beberapa saat lagi.'
        )
      );

      setRequestedRows([]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadSchedules = async () => {
    try {
      setIsLoadingSchedules(true);

      const bookings = await getSchedules();

      const rows = (Array.isArray(bookings) ? bookings : [])
        .filter((booking) =>
          activeScheduleStatuses.includes(normalizeStatus(booking?.status))
        )
        .map(normalizeBookingToSchedule);

      setSchedules(rows);
    } catch (error) {
      console.error('GAGAL MEMUAT JADWAL PERAWATAN:', error);

      showNotification(
        'error',
        getFriendlyErrorMessage(
          error,
          'Jadwal perawatan belum dapat dimuat. Silakan coba kembali.'
        )
      );

      setSchedules([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadRequestedBookings(),
      loadSchedules(),
    ]);
  };

  useEffect(() => {
    loadAllData();
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

      if (!selectedReport.bookingId) {
        showNotification('warning', 'ID pemesanan tidak ditemukan.');
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
        showNotification('warning', 'Teknisi wajib dipilih.');
        return;
      }

      const scheduledAt =
        scheduleData?.scheduled_at ||
        scheduleData?.date ||
        scheduleData?.dateVal;

      if (!scheduledAt) {
        showNotification('warning', 'Tanggal jadwal wajib diisi.');
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

      await approveBooking(selectedReport.bookingId, payload);

      setShowSchedule(false);
      setSelectedReport(null);
      setSchedEquip('');

      await loadAllData();

      showNotification('success', 'Jadwal perawatan berhasil dibuat.');
    } catch (error) {
      console.error('GAGAL MEMBUAT JADWAL:', error);

      showNotification(
        'error',
        getFriendlyErrorMessage(
          error,
          'Jadwal perawatan belum dapat dibuat. Periksa kembali data jadwal.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const openRejectDialog = (row) => {
    if (!row?.bookingId) {
      showNotification('warning', 'ID pemesanan tidak ditemukan.');
      return;
    }

    setRejectTarget(row);
  };

  const closeRejectDialog = () => {
    if (isRejecting) return;
    setRejectTarget(null);
  };

  const confirmRejectBooking = async () => {
    if (!rejectTarget?.bookingId) {
      showNotification('warning', 'ID pemesanan tidak ditemukan.');
      return;
    }

    try {
      setIsRejecting(true);

      await rejectBooking(rejectTarget.bookingId, {
        note_admin: 'Permintaan jadwal ditolak oleh admin.',
      });

      setRejectTarget(null);

      await loadAllData();

      showNotification('success', 'Permintaan jadwal berhasil ditolak.');
    } catch (error) {
      console.error('GAGAL MENOLAK PERMINTAAN JADWAL:', error);

      showNotification(
        'error',
        getFriendlyErrorMessage(
          error,
          'Permintaan jadwal belum dapat ditolak. Periksa data atau coba beberapa saat lagi.'
        )
      );
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      <Sidebar />

      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Tolak Permintaan Jadwal"
        message={`Apakah Anda yakin ingin menolak permintaan jadwal untuk ${rejectTarget?.equip || 'unit ini'}? Data akan berubah menjadi status Ditolak dan tidak tampil lagi di approval aktif.`}
        confirmText="Ya, Tolak"
        cancelText="Batal"
        loading={isRejecting}
        onConfirm={confirmRejectBooking}
        onCancel={closeRejectDialog}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%)] p-5 md:p-7">
          <div className="mx-auto max-w-[1600px]">
            <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-djati-amber/20 bg-djati-amber/10 px-3 py-1 text-xs font-bold text-djati-amber">
                  Maintenance Scheduling
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Penjadwalan Perawatan
                </h1>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">
                  Kelola permintaan servis dari pengemudi, tentukan jadwal
                  perawatan, pilih teknisi, serta pantau status jadwal dalam
                  satu halaman dengan tampilan yang konsisten seperti VehiclePage.
                </p>
              </div>

            </header>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <SummaryCard
                icon={ClipboardList}
                label="Menunggu Admin"
                value={stats.requested}
                hint="Permintaan jadwal dari pengemudi"
              />

              <SummaryCard
                icon={Clock3}
                label="Jadwal Aktif"
                value={stats.active}
                hint="Terjadwal atau sedang berjalan"
                tone="blue"
              />

              <SummaryCard
                icon={CheckCircle2}
                label="Selesai"
                value={stats.completed}
                hint="Perawatan telah selesai"
                tone="green"
              />

              <SummaryCard
                icon={XCircle}
                label="Dibatalkan"
                value={stats.canceled}
                hint="Jadwal yang dibatalkan"
                tone="red"
              />
            </section>

            <section className="mb-6 rounded-2xl border border-white/10 bg-[#171a23]/95 shadow-2xl shadow-black/20">
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-djati-amber">
                      Permintaan Jadwal Servis
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      Daftar permintaan dari pengemudi yang masih menunggu admin
                      menentukan jadwal dan teknisi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/damage-reports')}
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-djati-amber/20 bg-djati-amber/10 px-4 py-2.5 text-xs font-bold text-djati-amber transition hover:bg-djati-amber/20"
                  >
                    <ListChecks size={15} />
                    Lihat Semua Laporan
                  </button>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1180px] table-auto text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-djati-amber text-xs uppercase tracking-wide text-black">
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Unit / Equipment
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Deskripsi Kerusakan
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Pengemudi
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Tanggal Permintaan
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Tanggal Laporan
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-right font-bold">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoadingReports ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-5 py-10 text-center text-white/50"
                        >
                          Memuat permintaan jadwal...
                        </td>
                      </tr>
                    ) : requestedRows.length > 0 ? (
                      requestedRows.map((row) => (
                        <tr
                          key={`${row.bookingId || 'booking'}-${row.id}`}
                          className="border-b border-white/5 transition hover:bg-white/[0.04]"
                        >
                          <td className="px-5 py-4">
                            <div className="min-w-[220px]">
                              <div className="font-bold text-white">
                                {row.equip}
                              </div>

                              <div className="mt-1 text-xs text-white/35">
                                Nomor Polisi: {row.plateNumber || '-'}
                              </div>

                              <div className="mt-1 text-xs text-white/30">
                                Booking: #{row.bookingId || '-'} • Laporan: #
                                {row.damageReportId || '-'}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[300px]">
                              <p className="line-clamp-2 text-white/65">
                                {row.desc}
                              </p>

                              {row.damageType && row.damageType !== '-' && (
                                <p className="mt-1 text-xs text-white/35">
                                  Jenis Kerusakan: {row.damageType}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-white/70">
                            {row.operator}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-white/70">
                            {formatDate(row.preferredAt)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-white/70">
                            {formatDate(row.date)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={isSubmitting || isRejecting}
                                onClick={() => openScheduleModal(row)}
                                className="inline-flex items-center gap-2 rounded-xl bg-djati-amber px-4 py-2.5 text-xs font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <CalendarCheck size={14} />
                                Buat Jadwal
                              </button>

                              <button
                                type="button"
                                disabled={isSubmitting || isRejecting}
                                onClick={() => openRejectDialog(row)}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <XCircle size={14} />
                                Tolak
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          <EmptyState
                            title="Belum ada permintaan jadwal"
                            description="Permintaan servis dari pengemudi akan tampil di sini."
                            icon={Truck}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
                <p>
                  Total {requestedRows.length} permintaan jadwal menunggu admin.
                </p>

                <p>
                  Geser tabel ke samping jika kolom tidak muat di layar kecil.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#171a23]/95 shadow-2xl shadow-black/20">
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-bold text-djati-amber">
                    Daftar Jadwal Perawatan
                  </h2>

                  <p className="text-xs leading-5 text-white/40">
                    Jadwal servis yang sudah disetujui admin dan akan tampil di
                    aplikasi teknisi. Tabel ini bersifat read-only.
                  </p>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1050px] table-auto text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#0f1117]/80 text-xs uppercase tracking-wide text-white/45">
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        ID Jadwal
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Unit / Equipment
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Pengemudi
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Teknisi
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Tanggal Jadwal
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Prioritas
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 text-left font-bold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoadingSchedules ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-5 py-10 text-center text-white/50"
                        >
                          Memuat jadwal perawatan...
                        </td>
                      </tr>
                    ) : schedules.length > 0 ? (
                      schedules.map((schedule) => (
                        <tr
                          key={schedule.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.04]"
                        >
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-white/60">
                            #{schedule.id}
                          </td>

                          <td className="px-5 py-4">
                            <div className="min-w-[220px]">
                              <div className="font-bold text-white">
                                {schedule.equip}
                              </div>

                              <div className="mt-1 text-xs text-white/35">
                                Nomor Polisi: {schedule.plateNumber || '-'}
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-white/70">
                            {schedule.driver}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-white/70">
                            <span className="inline-flex items-center gap-2">
                              <Wrench size={14} className="text-djati-amber" />
                              {schedule.mechanic}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-white/70">
                            {schedule.date}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <PriorityBadge priority={schedule.priority} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <ScheduleStatusBadge status={schedule.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">
                          <EmptyState
                            title="Belum ada jadwal perawatan aktif"
                            description="Jadwal yang sudah disetujui admin akan tampil di sini."
                            icon={CalendarCheck}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
                <p>
                  Menampilkan {schedules.length} jadwal perawatan.
                </p>

                <p>
                  Tampilan tabel mengikuti gaya VehiclePage dengan card gelap dan gradasi.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

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
    </div>
  );
}
