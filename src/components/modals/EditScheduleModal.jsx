import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import ModalShell from '../ui/ModalShell';

import {
  validateScheduleConflict,
} from '../../services/scheduleService';

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

function toDateTimeLocalValue(value) {
  if (!value || value === '-') return '';

  try {
    const raw = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
      return raw.slice(0, 16);
    }

    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)) {
      return raw.replace(' ', 'T').slice(0, 16);
    }

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch (_) {
    return '';
  }
}

function getBookingId(data) {
  if (!data) return null;

  if (data.bookingId) return data.bookingId;
  if (data.booking_id) return data.booking_id;
  if (data.raw?.id) return data.raw.id;
  if (data.raw?.booking_id) return data.raw.booking_id;

  const rawId = String(data.id || '');

  if (rawId.startsWith('MS-')) {
    const parsed = Number(rawId.replace('MS-', ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : null;
}

function getTechnicianId(data) {
  return (
    data?.technician_id ||
    data?.mechanic_id ||
    data?.raw?.technician_id ||
    data?.raw?.mechanic_id ||
    data?.raw?.technician?.id ||
    data?.raw?.mechanic?.id ||
    null
  );
}

function getTechnicianName(data) {
  return (
    data?.technician_name ||
    data?.mechanic ||
    data?.mechanic_name ||
    data?.raw?.technician?.username ||
    data?.raw?.technician?.name ||
    data?.raw?.mechanic?.username ||
    data?.raw?.mechanic?.name ||
    '-'
  );
}

function isFinishBeforeStart(startValue, finishValue) {
  if (!startValue || !finishValue) return false;

  const start = new Date(startValue);
  const finish = new Date(finishValue);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(finish.getTime())
  ) {
    return false;
  }

  return finish <= start;
}

function formatDisplayDate(value) {
  if (!value) return '-';

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (_) {
    return value;
  }
}

export default function EditScheduleModal({
  data,
  onClose,
  onSave,
}) {
  const [date, setDate] = useState('');
  const [estimatedFinishAt, setEstimatedFinishAt] = useState('');
  const [priority, setPriority] = useState('low');
  const [status, setStatus] = useState('scheduled');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;

    setDate(
      toDateTimeLocalValue(
        data.dateVal ||
          data.scheduled_at ||
          data.raw?.scheduled_at ||
          data.raw?.preferred_at ||
          ''
      )
    );

    setEstimatedFinishAt(
      toDateTimeLocalValue(
        data.estimatedFinishAt ||
          data.estimated_finish_at ||
          data.raw?.estimated_finish_at ||
          ''
      )
    );

    setPriority(data.priority || data.raw?.priority || 'low');

    const normalized = normalizeStatus(data.status || data.raw?.status);

    if (normalized === 'canceled') {
      setStatus('cancelled');
    } else {
      setStatus('scheduled');
    }
  }, [data]);

  if (!data) return null;

  const normalizedStatus = normalizeStatus(data.status || data.raw?.status);

  const isLockedStatus = [
    'in_progress',
    'completed',
    'canceled',
    'rejected',
  ].includes(normalizedStatus);

  const bookingId = getBookingId(data);
  const technicianId = getTechnicianId(data);
  const technicianName = getTechnicianName(data);

  const handleSave = async () => {
    try {
      setError('');

      if (isLockedStatus) {
        setError(
          'Schedule tidak dapat diubah karena sudah diproses teknisi, selesai, dibatalkan, atau ditolak.'
        );
        return;
      }

      if (!bookingId) {
        setError('Booking ID tidak ditemukan.');
        return;
      }

      if (!technicianId) {
        setError('Technician ID tidak ditemukan.');
        return;
      }

      if (status === 'cancelled') {
        onSave({
          ...data,
          bookingId,
          status: 'cancelled',
          noteAdmin:
            data.noteAdmin ||
            `Schedule untuk ${data.equip || 'unit'} dibatalkan admin.`,
        });

        return;
      }

      if (!date) {
        setError('Tanggal dan jam schedule wajib diisi.');
        return;
      }

      if (estimatedFinishAt && isFinishBeforeStart(date, estimatedFinishAt)) {
        setError('Estimasi selesai harus lebih besar dari jam mulai.');
        return;
      }

      const validation = await validateScheduleConflict({
        technician_id: technicianId,
        scheduled_at: date,
        estimated_finish_at: estimatedFinishAt || null,
        booking_id: bookingId,
      });

      if (validation?.conflict) {
        setError(
          validation?.message ||
            'Technician sudah memiliki jadwal pada tanggal dan jam tersebut.'
        );
        return;
      }

      onSave({
        ...data,

        bookingId,

        technician_id: technicianId,
        mechanic_id: technicianId,

        technician_name: technicianName,
        mechanic: technicianName,
        mechanic_name: technicianName,

        scheduled_at: date,
        dateVal: date,
        date: formatDisplayDate(date),

        estimated_finish_at: estimatedFinishAt || null,
        estimatedFinishAt: estimatedFinishAt || null,

        priority,
        status: 'scheduled',

        noteAdmin:
          data.noteAdmin ||
          `Mechanic: ${technicianName || '-'} | Priority: ${
            priority || 'medium'
          }`,
      });
    } catch (err) {
      console.error('SAVE SCHEDULE ERROR:', err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Terjadi kesalahan.'
      );
    }
  };

  return (
    <ModalShell
      title="Edit Schedule"
      icon={<Edit size={20} />}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="btn-ghost py-2.5 px-6 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isLockedStatus}
            className="btn-primary py-2.5 px-6 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="label-base">
          Schedule ID
        </label>

        <input
          type="text"
          readOnly
          value={`#${data.id || '-'}`}
          className="input-base opacity-65 cursor-default"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-base">
            Mechanic Name
          </label>

          <input
            type="text"
            readOnly
            value={technicianName}
            className="input-base opacity-65 cursor-default"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-base">
            Scheduled Date & Time
          </label>

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isLockedStatus || status === 'cancelled'}
            className="input-base"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-base">
          Estimated Finish
        </label>

        <input
          type="datetime-local"
          value={estimatedFinishAt}
          onChange={(e) => setEstimatedFinishAt(e.target.value)}
          disabled={isLockedStatus || status === 'cancelled'}
          className="input-base"
        />

        <div className="text-[0.7rem] text-white/35">
          Jika dikosongkan, sistem dapat memakai estimasi default dari backend.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-base">
            Priority
          </label>

          <div className="relative flex items-center">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isLockedStatus || status === 'cancelled'}
              className="input-base !pr-10 cursor-pointer appearance-none"
            >
              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>

              <option value="critical">
                Critical
              </option>
            </select>

            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-base">
            Status
          </label>

          <div className="relative flex items-center">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isLockedStatus}
              className="input-base !pr-10 cursor-pointer appearance-none"
            >
              <option value="scheduled">
                Scheduled
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-300">
        Mechanic tidak dapat diubah setelah schedule dibuat dari request booking.
        <br />
        <br />
        Status <b>In Progress</b> dan <b>Completed</b> hanya dapat diubah oleh teknisi saat menjalankan maintenance.
      </div>
    </ModalShell>
  );
}