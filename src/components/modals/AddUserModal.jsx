import { useState } from 'react';
import { UserPlus, Copy, RefreshCw } from 'lucide-react';
import ModalShell from '../ui/ModalShell';

export default function AddUserModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Mechanic');
  const [accessKey, setAccessKey] = useState(() => generateKey('Mechanic', ''));
  const [copied, setCopied] = useState(false);

  function generateKey(r, n) {
    const clean = (n || 'User').replace(/\s+/g, '');
    const rand = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return r + rand + clean;
  }

  const copyKey = () => {
    navigator.clipboard.writeText(accessKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const handleCreate = () => {
    if (!name.trim() || !username.trim()) return;
    onCreate({ name: name.trim(), role, status: 'Active' });
  };

  return (
    <ModalShell
      title="Add New User"
      icon={<UserPlus size={24} className="text-[#ff9800]" />}
      onClose={onClose}
      maxWidth="max-w-[520px]"
      footer={
        <div className="flex justify-center gap-3 w-full">
          <button onClick={onClose} className="btn-ghost py-3 px-7 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={handleCreate} className="btn-primary py-3 px-7 text-sm">
            Create User
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="label-base">Name</label>
        <input
          type="text"
          placeholder="Ex : Yi Sang"
          value={name}
          onChange={(e) => { setName(e.target.value); setAccessKey(generateKey(role, e.target.value)); }}
          className="input-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-base">Username</label>
        <input type="text" placeholder="Yisang01" value={username} onChange={(e) => setUsername(e.target.value)} className="input-base" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-base">Access Key</label>
        <div className="flex items-center gap-1.5">
          <input type="text" readOnly value={accessKey} className="input-base flex-1" />
          <button
            onClick={copyKey}
            title="Copy"
            className={`w-[38px] h-[38px] rounded-lg border flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 p-0 ${
              copied
                ? 'border-[rgba(76,175,80,0.4)] bg-[rgba(76,175,80,0.15)] text-status-resolved'
                : 'border-djati-border-light bg-white/[0.04] text-white/50 hover:text-white/80'
            }`}
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => setAccessKey(generateKey(role, name))}
            title="Generate"
            className="w-[38px] h-[38px] rounded-lg border border-[rgba(255,152,0,0.3)] bg-white/[0.04] text-[#ff9800] cursor-pointer flex items-center justify-center flex-shrink-0 transition-all duration-200 p-0 hover:bg-[rgba(255,152,0,0.15)]"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-base">Role</label>
        <div className="relative inline-flex items-center">
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setAccessKey(generateKey(e.target.value, name)); }}
            className="input-base !pr-10 cursor-pointer appearance-none !bg-djati-panel2"
          >
            <option value="Mechanic">Mechanic</option>
            <option value="Admin">Admin</option>
            <option value="Operator">Operator</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>
    </ModalShell>
  );
}
