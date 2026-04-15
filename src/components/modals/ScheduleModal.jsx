import { useState } from 'react';
import { Calendar } from 'lucide-react';
import ModalShell from '../ui/ModalShell';

export default function ScheduleModal({ equipName, onClose, onConfirm }) {
  const [mechanic, setMechanic] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState('critical');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!mechanic.trim() || !date) return;
    onConfirm({ mechanic, date, priority, notes });
  };

  return (
    <ModalShell
      title="Schedule Maintenance"
      icon={<Calendar size={20} />}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost py-2.5 px-6 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn-primary py-2.5 px-6 text-sm">
            Confirm Schedule
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="label-base">Equipment</label>
        <input type="text" readOnly value={equipName} className="input-base opacity-65 cursor-default" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Mechanic Name</label>
          <input type="text" placeholder="Enter mechanic name" value={mechanic} onChange={(e) => setMechanic(e.target.value)} className="input-base" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Scheduled Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-base" />
        </div>
      </div>

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
        <label className="label-base">Notes</label>
        <textarea placeholder="Add maintenance notes..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input-base resize-y min-h-[80px]" />
      </div>
    </ModalShell>
  );
}
