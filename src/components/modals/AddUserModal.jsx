import { useState, useEffect } from 'react';
import { UserPlus, Copy, RefreshCw } from 'lucide-react';
import ModalShell from '../ui/ModalShell';

export default function AddUserModal({ onClose, onCreate, user }) {
  const isEdit = !!user;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Mechanic');
  const [accessKey, setAccessKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setRole(user.role || 'Mechanic');
      setAccessKey('');
    } else {
      setAccessKey(generateKey(role, name));
    }
  }, [user]);

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

    onCreate({
      name: name.trim(),
      username: username.trim(),
      role,
      accessKey: accessKey || undefined,
    });
  };

  return (
    <ModalShell
      title={isEdit ? 'Edit User' : 'Add New User'}
      icon={<UserPlus size={24} className="text-[#ff9800]" />}
      onClose={onClose}
      maxWidth="max-w-[520px]"
      footer={
        <div className="flex justify-center gap-3 w-full">
          <button onClick={onClose} className="btn-ghost py-3 px-7 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={handleCreate} className="btn-primary py-3 px-7 text-sm">
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      }
    >
      {/* NAME */}
      <div className="flex flex-col gap-1.5">
        <label className="label-base">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!isEdit) {
              setAccessKey(generateKey(role, e.target.value));
            }
          }}
          className="input-base"
        />
      </div>

      {/* USERNAME */}
      <div className="flex flex-col gap-1.5">
        <label className="label-base">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-base"
        />
      </div>

      {/* ACCESS KEY */}
      <div className="flex flex-col gap-1.5">
        <label className="label-base">
          {isEdit ? 'New Password (optional)' : 'Access Key'}
        </label>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={accessKey}
            readOnly={!isEdit}
            onChange={(e) => setAccessKey(e.target.value)}
            className="input-base flex-1"
          />

          {!isEdit && (
            <>
              <button onClick={copyKey} className="btn-icon">
                <Copy size={16} />
              </button>

              <button
                onClick={() => setAccessKey(generateKey(role, name))}
                className="btn-icon"
              >
                <RefreshCw size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ROLE */}
      <div className="flex flex-col gap-1.5">
        <label className="label-base">Role</label>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            if (!isEdit) {
              setAccessKey(generateKey(e.target.value, name));
            }
          }}
          className="input-base"
        >
          <option value="Mechanic">Mechanic</option>
          <option value="Admin">Admin</option>
          <option value="Operator">Operator</option>
        </select>
      </div>
    </ModalShell>
  );
}