import { cn } from '../../../lib/utils';

export type PerfColumn<T> = { key: keyof T | string; header: string; className?: string };

type PerformanceTableProps<T extends Record<string, unknown>> = {
  title: string;
  columns: PerfColumn<T>[];
  rows: T[];
  loading?: boolean;
  className?: string;
};

export function PerformanceTable<T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  loading,
  className,
}: PerformanceTableProps<T>) {
  return (
    <div className={cn('glass-panel rounded-2xl p-4 overflow-hidden', className)}>
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-zinc-500">
              {columns.map((c) => (
                <th key={String(c.key)} className={cn('px-2 py-2 font-medium', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-2 py-6 text-zinc-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-2 py-6 text-zinc-500">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  {columns.map((c) => (
                    <td key={String(c.key)} className={cn('px-2 py-2 text-zinc-200 tabular-nums', c.className)}>
                      {String(row[c.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PerformanceTable;
