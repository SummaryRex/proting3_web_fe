const variantMap = {
  /*
  |--------------------------------------------------------------------------
  | DILAPORKAN / WAITING / REQUESTED
  |--------------------------------------------------------------------------
  */
  pending: {
    bg: 'bg-status-pending-bg',
    text: 'text-status-pending',
    border: 'border-status-pending-border',
  },
  reported: {
    bg: 'bg-status-pending-bg',
    text: 'text-status-pending',
    border: 'border-status-pending-border',
  },
  dilaporkan: {
    bg: 'bg-status-pending-bg',
    text: 'text-status-pending',
    border: 'border-status-pending-border',
  },
  menunggu: {
    bg: 'bg-status-pending-bg',
    text: 'text-status-pending',
    border: 'border-status-pending-border',
  },
  requested: {
    bg: 'bg-status-pending-bg',
    text: 'text-status-pending',
    border: 'border-status-pending-border',
  },
  waiting: {
    bg: 'bg-status-pending-bg',
    text: 'text-status-pending',
    border: 'border-status-pending-border',
  },

  /*
  |--------------------------------------------------------------------------
  | APPROVED / ACTIVE / COMPLETED / RESOLVED
  |--------------------------------------------------------------------------
  */
  approved: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },
  active: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },
  resolved: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },
  completed: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },
  complete: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },
  finished: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },
  selesai: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },
  done: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },

  /*
  |--------------------------------------------------------------------------
  | DALAM PROSES / START JOB TEKNISI
  |--------------------------------------------------------------------------
  */
  progress: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  in_progress: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  proses: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  diproses: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  dalam_proses: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  ongoing: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  started: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  job_started: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  repair_started: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  technician_started: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  scheduled: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
  rescheduled: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },

  /*
  |--------------------------------------------------------------------------
  | MENUNGGU SPAREPART / FOLLOW UP
  |--------------------------------------------------------------------------
  */
  waiting_parts: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
  },
  waiting_part: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
  },
  butuh_followup_admin: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
  },
  butuh_followup: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
  },
  menunggu_sparepart: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
  },
  on_hold: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
  },

  /*
  |--------------------------------------------------------------------------
  | CRITICAL / REJECTED / CANCELED / FATAL
  |--------------------------------------------------------------------------
  */
  critical: {
    bg: 'bg-status-critical-bg',
    text: 'text-status-critical',
    border: 'border-status-critical-border',
  },
  rejected: {
    bg: 'bg-status-critical-bg',
    text: 'text-status-critical',
    border: 'border-status-critical-border',
  },
  reject: {
    bg: 'bg-status-critical-bg',
    text: 'text-status-critical',
    border: 'border-status-critical-border',
  },
  ditolak: {
    bg: 'bg-status-critical-bg',
    text: 'text-status-critical',
    border: 'border-status-critical-border',
  },
  canceled: {
    bg: 'bg-status-critical-bg',
    text: 'text-status-critical',
    border: 'border-status-critical-border',
  },
  cancelled: {
    bg: 'bg-status-critical-bg',
    text: 'text-status-critical',
    border: 'border-status-critical-border',
  },
  dibatalkan: {
    bg: 'bg-status-critical-bg',
    text: 'text-status-critical',
    border: 'border-status-critical-border',
  },
  fatal: {
    bg: 'bg-status-critical-bg',
    text: 'text-status-critical',
    border: 'border-status-critical-border',
  },

  /*
  |--------------------------------------------------------------------------
  | PRIORITY
  |--------------------------------------------------------------------------
  */
  high: {
    bg: 'bg-[rgba(245,124,0,0.18)]',
    text: 'text-[#ffa726]',
    border: 'border-[rgba(245,124,0,0.35)]',
  },
  medium: {
    bg: 'bg-status-pending-bg',
    text: 'text-status-pending',
    border: 'border-status-pending-border',
  },
  low: {
    bg: 'bg-status-resolved-bg',
    text: 'text-status-resolved',
    border: 'border-status-resolved-border',
  },

  inactive: {
    bg: 'bg-status-inactive-bg',
    text: 'text-status-inactive',
    border: 'border-status-inactive-border',
  },

  /*
  |--------------------------------------------------------------------------
  | ROLE
  |--------------------------------------------------------------------------
  */
  admin: {
    bg: 'bg-[rgba(255,152,0,0.18)]',
    text: 'text-[#ff9800]',
    border: 'border-[rgba(255,152,0,0.35)]',
  },
  driver: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
  },
  teknisi: {
    bg: 'bg-status-progress-bg',
    text: 'text-status-progress',
    border: 'border-status-progress-border',
  },
};

function normalizeVariant(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

/**
 * Universal status/role badge component.
 *
 * @param {{ variant: string, children: React.ReactNode, pill?: boolean, dot?: boolean, className?: string }} props
 */
export default function StatusBadge({
  variant = 'pending',
  children,
  pill = true,
  dot = false,
  className = '',
}) {
  const key = normalizeVariant(variant || children);
  const v = variantMap[key] || variantMap.pending;
  const shape = pill ? 'rounded-full' : 'rounded-md';

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-3
        py-1
        ${shape}
        text-[0.72rem]
        font-semibold
        border
        ${v.bg}
        ${v.text}
        ${v.border}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${v.text} bg-current`} />
      )}
      {children}
    </span>
  );
}