import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

import ModalShell from '../ui/ModalShell';

import {
  getTechnicians,
} from '../../services/scheduleService';

export default function ScheduleModal({
  equipName,
  onClose,
  onConfirm,
  existingSchedules = [],
}) {
  const [technicianId, setTechnicianId] = useState('');
  const [date, setDate] = useState('');
  const [estimatedFinishAt, setEstimatedFinishAt] = useState('');
  const [priority, setPriority] = useState('critical');
  const [notes, setNotes] = useState('');
  const [mechanics, setMechanics] = useState([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);

  useEffect(() => {
    loadMechanics();
  }, []);

  const normalizeStatus = (value) => {
    if (!value) return '';

    const status = String(value)
      .toLowerCase()
      .trim()
      .replaceAll(' ', '_')
      .replaceAll('-', '_');

    if (status === 'scheduled') {
      return 'approved';
    }

    if (status === 'finished' || status === 'selesai') {
      return 'completed';
    }

    if (status === 'cancelled' || status === 'dibatalkan') {
      return 'canceled';
    }

    if (status === 'pending') {
      return 'requested';
    }

    return status;
  };

  const isClosedStatus = (status) => {
    const normalized = normalizeStatus(status);

    return ['completed', 'canceled', 'rejected'].includes(normalized);
  };

  const getMechanicId = (item) => {
    return (
      item?.id ||
      item?.user_id ||
      item?.technician_id ||
      item?.mechanic_id ||
      item?.user?.id ||
      ''
    );
  };

  const getMechanicName = (item) => {
    return (
      item?.name ||
      item?.username ||
      item?.full_name ||
      item?.label ||
      item?.user?.name ||
      item?.user?.username ||
      '-'
    );
  };

  const toDateObject = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

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

    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const indonesianDate = raw.match(
      /^(\d{2})[/-](\d{2})[/-](\d{4})(?:\s+(\d{2}):(\d{2}))?/
    );

    if (indonesianDate) {
      const [, day, month, year, hour = '00', minute = '00'] = indonesianDate;

      const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);

      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(raw);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const addDefaultDuration = (start) => {
    if (!start) return null;

    return new Date(start.getTime() + 60 * 60 * 1000);
  };

  const getScheduleRange = ({ startValue, finishValue }) => {
    const start = toDateObject(startValue);

    if (!start) {
      return {
        start: null,
        end: null,
      };
    }

    let end = toDateObject(finishValue);

    if (!end || end <= start) {
      end = addDefaultDuration(start);
    }

    return {
      start,
      end,
    };
  };

  const isRangeOverlap = (firstStart, firstEnd, secondStart, secondEnd) => {
    if (!firstStart || !firstEnd || !secondStart || !secondEnd) {
      return false;
    }

    return firstStart < secondEnd && firstEnd > secondStart;
  };

  const loadMechanics = async () => {
    try {
      setLoadingMechanics(true);

      const data = await getTechnicians();

      console.log('MECHANICS FROM API:', data);

      const normalizedMechanics = (data || [])
        .map((item) => {
          const id = getMechanicId(item);
          const name = getMechanicName(item);

          return {
            ...item,
            id,
            name,
          };
        })
        .filter((item) => {
          return item.id !== undefined && item.id !== null && item.id !== '';
        });

      console.log('NORMALIZED MECHANICS:', normalizedMechanics);

      setMechanics(normalizedMechanics);
    } catch (error) {
      console.error('LOAD MECHANICS ERROR:', error);
      setMechanics([]);
    } finally {
      setLoadingMechanics(false);
    }
  };

  const selectedMechanic = mechanics.find(
    (item) => Number(item.id) === Number(technicianId)
  );

  const checkScheduleConflict = () => {
    const currentRange = getScheduleRange({
      startValue: date,
      finishValue: estimatedFinishAt,
    });

    if (!currentRange.start || !currentRange.end) {
      return false;
    }

    return existingSchedules.some((item) => {
      const status = normalizeStatus(item?.status || item?.raw?.status);

      if (isClosedStatus(status)) {
        return false;
      }

      const existingTechnicianId =
        item?.technician_id ||
        item?.mechanic_id ||
        item?.technician?.id ||
        item?.mechanic?.id ||
        item?.user_id ||
        item?.raw?.technician_id ||
        item?.raw?.mechanic_id ||
        item?.raw?.technician?.id ||
        item?.raw?.mechanic?.id;

      const existingMechanicName = String(
        item?.technician_name ||
          item?.mechanic_name ||
          item?.mechanic ||
          item?.technician?.name ||
          item?.mechanic?.name ||
          item?.raw?.technician?.name ||
          item?.raw?.technician?.username ||
          item?.raw?.mechanic?.name ||
          ''
      )
        .toLowerCase()
        .trim();

      const selectedMechanicName = String(selectedMechanic?.name || '')
        .toLowerCase()
        .trim();

      const sameTechnicianById =
        existingTechnicianId &&
        Number(existingTechnicianId) === Number(technicianId);

      const sameTechnicianByName =
        !existingTechnicianId &&
        existingMechanicName &&
        selectedMechanicName &&
        existingMechanicName === selectedMechanicName;

      if (!sameTechnicianById && !sameTechnicianByName) {
        return false;
      }

      const existingRange = getScheduleRange({
        startValue:
          item?.dateVal ||
          item?.scheduled_at ||
          item?.raw?.scheduled_at ||
          item?.date,

        finishValue:
          item?.estimatedFinishAt ||
          item?.estimated_finish_at ||
          item?.raw?.estimated_finish_at ||
          item?.finishAt,
      });

      return isRangeOverlap(
        existingRange.start,
        existingRange.end,
        currentRange.start,
        currentRange.end
      );
    });
  };

  const handleConfirm = () => {
    const finalTechnicianId = Number(technicianId);

    console.log('TECHNICIAN ID BEFORE CONFIRM:', technicianId);
    console.log('FINAL TECHNICIAN ID:', finalTechnicianId);
    console.log('SELECTED MECHANIC:', selectedMechanic);

    if (!technicianId || !Number.isFinite(finalTechnicianId)) {
      alert('Technician wajib dipilih.');
      return;
    }

    if (!date) {
      alert('Tanggal dan jam schedule wajib diisi.');
      return;
    }

    const currentRange = getScheduleRange({
      startValue: date,
      finishValue: estimatedFinishAt,
    });

    if (!currentRange.start || !currentRange.end) {
      alert('Format tanggal atau jam schedule tidak valid.');
      return;
    }

    if (estimatedFinishAt && currentRange.end <= currentRange.start) {
      alert('Estimasi selesai harus lebih besar dari jam mulai.');
      return;
    }

    const isConflict = checkScheduleConflict();

    if (isConflict) {
      alert('Mechanic sudah memiliki jadwal pada jam tersebut. Silakan pilih jam lain.');
      return;
    }

    onConfirm({
      technician_id: finalTechnicianId,
      mechanic_id: finalTechnicianId,

      technician_name: selectedMechanic?.name || '-',
      mechanic: selectedMechanic?.name || '-',

      technician: selectedMechanic || null,

      date,
      scheduled_at: date,

      estimated_finish_at: estimatedFinishAt || null,
      estimatedFinishAt: estimatedFinishAt || null,

      priority,
      notes,
    });
  };

  return (
    <ModalShell
      title="Schedule Maintenance"
      icon={<Calendar size={20} />}
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
            onClick={handleConfirm}
            className="btn-primary py-2.5 px-6 text-sm"
          >
            Confirm Schedule
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="label-base">
          Equipment
        </label>

        <input
          type="text"
          readOnly
          value={equipName}
          className="input-base opacity-65 cursor-default"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-base">
            Mechanic Name
          </label>

          <div className="relative flex items-center">
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="input-base !pr-10 cursor-pointer appearance-none"
            >
              <option value="">
                {loadingMechanics ? 'Loading mechanics...' : 'Select mechanic'}
              </option>

              {mechanics.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
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

          {!loadingMechanics && mechanics.length === 0 && (
            <div className="text-xs text-red-300">
              Tidak ada data mekanik. Cek response API /admin/technicians atau role user.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-base">
            Scheduled Date & Time
          </label>

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
          className="input-base"
        />

        <div className="text-[0.7rem] text-white/35">
          Jika dikosongkan, sistem otomatis menghitung durasi 1 jam dari jam mulai.
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-base">
          Priority
        </label>

        <div className="relative flex items-center">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
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
          Notes
        </label>

        <textarea
          placeholder="Add maintenance notes..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-base resize-y min-h-[80px]"
        />
      </div>
    </ModalShell>
  );
}