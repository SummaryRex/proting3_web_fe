import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div
      className="modal-overlay !z-[2000]"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-djati-panel border border-djati-border-amber rounded-2xl w-full max-w-[400px] shadow-modal overflow-hidden">
        {/* Icon + Message */}
        <div className="px-8 pt-8 pb-5 text-center">
          <div className="w-14 h-14 rounded-full bg-status-critical-bg border border-status-critical-border flex items-center justify-center mx-auto mb-5">
            <LogOut size={28} className="text-status-critical" />
          </div>
          <h2 className="text-lg font-extrabold text-white mb-2">Konfirmasi Logout</h2>
          <p className="text-sm text-white/[0.55] leading-relaxed">
            Apakah Anda yakin ingin logout?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-8 pb-6 justify-center">
          <button onClick={onCancel} className="btn-ghost flex-1 py-3 px-5 text-sm font-semibold">
            Batal
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1 py-3 px-5 text-sm">
            Ya, Logout
          </button>
        </div>
      </div>
    </div>
  );
}
