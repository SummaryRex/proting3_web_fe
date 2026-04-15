/**
 * Reusable data table component.
 *
 * @param {{ columns: string[], data: any[], renderRow: (item: any, index: number) => React.ReactNode, className?: string }} props
 */
export default function DataTable({ columns, data, renderRow, className = '' }) {
  return (
    <div className={`panel overflow-hidden ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                className={`bg-djati-panel2 px-4 py-3.5 text-left text-[0.7rem] font-bold tracking-wider text-djati-muted uppercase border-b border-djati-border ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
}
