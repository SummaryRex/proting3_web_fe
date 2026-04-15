/**
 * Reusable stat card for dashboards.
 *
 * @param {{ label: string, value: string|React.ReactNode, icon?: React.ReactNode, prefix?: string, trend?: React.ReactNode, highlight?: boolean, className?: string }} props
 */
export default function StatCard({ label, value, icon, prefix, trend, highlight = true, className = '' }) {
  return (
    <article className={`${highlight ? 'panel-amber' : 'panel'} p-5 flex flex-col gap-2.5 ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-[0.68rem] font-bold tracking-wider text-[#ff9800] uppercase leading-snug whitespace-pre-line">
          {label}
        </span>
        {icon && <span className="flex-shrink-0">{icon}</span>}
      </div>
      <div>
        {prefix && <span className="text-sm font-semibold text-white/60">{prefix}</span>}
        <strong className="text-[2.2rem] font-extrabold text-white leading-none ml-0.5">{value}</strong>
      </div>
      {trend && <div className="flex items-center gap-1.5 mt-0.5">{trend}</div>}
    </article>
  );
}
