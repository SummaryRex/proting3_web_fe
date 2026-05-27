import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import ModalShell from '../ui/ModalShell';

export default function AddUserModal({ onClose, onCreate, user }) {
  const isEdit = !!user;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teknisi');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setRole(user.role || 'teknisi');
      setPassword('');
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setRole('teknisi');
    }
  }, [user]);

  const handleCreate = () => {
    if (!username.trim()) {
      alert('Username wajib diisi');
      return;
    }

    if (!isEdit && password.trim().length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    if (isEdit && password.trim() && password.trim().length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    const payload = {
      name: name.trim(),
      username: username.trim(),
      role,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    onCreate(payload);
  };

  return (
    <ModalShell
      title={isEdit ? 'Edit User' : 'Add New User'}
      icon={<UserPlus size={24} className="text-[#ff9800]" />}
      onClose={onClose}
      maxWidth="max-w-[520px]"
      footer={
        <div className="flex justify-center gap-3 w-full">
          <button
            onClick={onClose}
            className="btn-ghost py-3 px-7 text-sm font-semibold"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="btn-primary py-3 px-7 text-sm"
            type="button"
          >
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="label-base">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-base">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-base">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-base"
          placeholder={
            isEdit
              ? 'Kosongkan jika tidak ingin mengubah password'
              : 'Minimal 6 karakter'
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label-base">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input-base"
        >
          <option value="teknisi">Teknisi</option>
          <option value="admin">Admin</option>
          <option value="driver">Driver</option>
        </select>
      </div>
    </ModalShell>
  );
}