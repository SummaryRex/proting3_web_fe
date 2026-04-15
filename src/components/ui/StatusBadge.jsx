const variantMap = {
  pending:    { bg: 'bg-status-pending-bg',  text: 'text-status-pending',  border: 'border-status-pending-border' },
  approved:   { bg: 'bg-status-resolved-bg', text: 'text-status-resolved', border: 'border-status-resolved-border' },
  active:     { bg: 'bg-status-resolved-bg', text: 'text-status-resolved', border: 'border-status-resolved-border' },
  resolved:   { bg: 'bg-status-resolved-bg', text: 'text-status-resolved', border: 'border-status-resolved-border' },
  completed:  { bg: 'bg-status-resolved-bg', text: 'text-status-resolved', border: 'border-status-resolved-border' },
  progress:   { bg: 'bg-status-progress-bg', text: 'text-status-progress', border: 'border-status-progress-border' },
  in_progress:{ bg: 'bg-status-progress-bg', text: 'text-status-progress', border: 'border-status-progress-border' },
  scheduled:  { bg: 'bg-status-progress-bg', text: 'text-status-progress', border: 'border-status-progress-border' },
  critical:   { bg: 'bg-status-critical-bg', text: 'text-status-critical', border: 'border-status-critical-border' },
  rejected:   { bg: 'bg-status-critical-bg', text: 'text-status-critical', border: 'border-status-critical-border' },
  high:       { bg: 'bg-[rgba(245,124,0,0.18)]', text: 'text-[#ffa726]', border: 'border-[rgba(245,124,0,0.35)]' },
  medium:     { bg: 'bg-status-pending-bg',  text: 'text-status-pending',  border: 'border-status-pending-border' },
  low:        { bg: 'bg-status-resolved-bg', text: 'text-status-resolved', border: 'border-status-resolved-border' },
  inactive:   { bg: 'bg-status-inactive-bg', text: 'text-status-inactive', border: 'border-status-inactive-border' },
  admin:      { bg: 'bg-[rgba(255,152,0,0.18)]', text: 'text-[#ff9800]', border: 'border-[rgba(255,152,0,0.35)]' },
  mechanic:   { bg: 'bg-status-progress-bg', text: 'text-status-progress', border: 'border-status-progress-border' },
  operator:   { bg: 'bg-status-resolved-bg', text: 'text-status-resolved', border: 'border-status-resolved-border' },
};

/**
 * Universal status/role badge component.
 *
 * @param {{ variant: string, children: React.ReactNode, pill?: boolean, dot?: boolean, className?: string }} props
 */
export default function StatusBadge({ variant = 'pending', children, pill = true, dot = false, className = '' }) {
  const key = variant.toLowerCase().replace(/\s+/g, '_');
  const v = variantMap[key] || variantMap.pending;
  const shape = pill ? 'rounded-full' : 'rounded-md';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${shape} text-[0.72rem] font-semibold border ${v.bg} ${v.text} ${v.border} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${v.text} bg-current`} />}
      {children}
    </span>
  );
}
