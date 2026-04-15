import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import ModalShell from '../ui/ModalShell';

export default function EditScheduleModal({ data, onClose, onSave }) {
  const [mechanic, setMechanic] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState('low');
  const [status, setStatus] = useState('scheduled');

  useEffect(() => {
    if (data) {
      setMechanic(data.mechanic);
      setDate(data.dateVal);
      setPriority(data.priority);
      setStatus(data.status);
    }
  }, [data]);

  if (!data) return null;

  const handleSave = () => {
    onSave({
      ...data,
      mechanic,
      dateVal: date,
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      priority,
      status,
    });
  };

  return (
    <ModalShell
      title="Edit Schedule"
      icon={<Edit size={20} />}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost py-2.5 px-6 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary py-2.5 px-6 text-sm">
            Save Changes
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="label-base">Schedule ID</label>
        <input type="text" readOnly value={`#${data.id}`} className="input-base opacity-65 cursor-default" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Mechanic Name</label>
          <input type="text" value={mechanic} onChange={(e) => setMechanic(e.target.value)} className="input-base" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Scheduled Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-base" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Priority</label>
          <div className="relative flex items-center">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-base !pr-10 cursor-pointer appearance-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Status</label>
          <div className="relative flex items-center">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-base !pr-10 cursor-pointer appearance-none">
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
