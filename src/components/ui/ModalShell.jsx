import { X } from 'lucide-react';

/**
 * Universal modal shell with backdrop, header, body, and footer.
 *
 * @param {{ title: string, icon?: React.ReactNode, onClose: () => void, children: React.ReactNode, footer?: React.ReactNode, maxWidth?: string }} props
 */
export default function ModalShell({ title, icon, onClose, children, footer, maxWidth = 'max-w-[540px]' }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-djati-panel border border-djati-border-amber rounded-2xl w-[90%] ${maxWidth} flex flex-col shadow-modal`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-djati-border">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-djati-amber flex-shrink-0">{icon}</span>}
            <h2 className="text-lg font-extrabold text-white m-0">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon !w-[34px] !h-[34px] !border-djati-border-light text-white/60 hover:text-white text-xl leading-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 flex flex-col gap-4 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-5 border-t border-djati-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
