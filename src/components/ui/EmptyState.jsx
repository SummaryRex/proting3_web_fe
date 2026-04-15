import { Inbox } from 'lucide-react';

/**
 * Empty state display when there are no items.
 *
 * @param {{ title?: string, message?: string, icon?: React.ReactNode, action?: React.ReactNode, className?: string }} props
 */
export default function EmptyState({
  title = 'No data found',
  message = 'There are no items to display.',
  icon,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-djati-border flex items-center justify-center mb-1">
        {icon || <Inbox size={32} className="text-white/25" />}
      </div>
      <p className="text-sm font-semibold text-white/60">{title}</p>
      <p className="text-[0.78rem] text-white/35 max-w-[320px] text-center">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
