import * as React from 'react';
import { X } from 'lucide-react';
import { formatDashboardMoneyFromCoins } from '../../../utils/dashboardInr';
import { cn } from '../../../lib/utils';

export type WalletFlowDay = {
  date: string;
  creditCoins: number;
  debitCoins: number;
  netCoins: number;
};

type RevenueDailyBalanceModalProps = {
  open: boolean;
  onClose: () => void;
  todayBalance: number;
  points: WalletFlowDay[];
  rangeLabel?: string;
  note?: string;
};

const numIn = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatSignedCoins(n: number) {
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${numIn.format(n)}`;
}

export const RevenueDailyBalanceModal: React.FC<RevenueDailyBalanceModalProps> = ({
  open,
  onClose,
  todayBalance,
  points,
  rangeLabel,
  note,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sorted = [...points].sort((a, b) => b.date.localeCompare(a.date));
  const todayFmt = formatDashboardMoneyFromCoins(todayBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close revenue history"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="revenue-daily-balance-title"
        className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 id="revenue-daily-balance-title" className="text-lg font-semibold text-white">
              Revenue daily balance
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Today&apos;s balance:{' '}
              <span className="font-medium text-violet-300 tabular-nums">{todayFmt.text}</span>
            </p>
            {rangeLabel ? (
              <p className="mt-0.5 text-xs text-zinc-500">History for {rangeLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {note ? (
          <p className="border-b border-white/5 px-5 py-2.5 text-[11px] leading-snug text-zinc-500">{note}</p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
          {sorted.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-500">No wallet activity in this period.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur">
                <tr className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2.5">Date (UTC)</th>
                  <th className="px-3 py-2.5 text-right">Credits</th>
                  <th className="px-3 py-2.5 text-right">Debits</th>
                  <th className="px-3 py-2.5 text-right">Daily balance</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const netFmt = formatDashboardMoneyFromCoins(row.netCoins);
                  return (
                    <tr
                      key={row.date}
                      className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2.5 font-medium text-zinc-200">{row.date}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-emerald-400/90">
                        {numIn.format(row.creditCoins)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-rose-400/90">
                        {numIn.format(row.debitCoins)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5 text-right tabular-nums font-medium',
                          row.netCoins > 0
                            ? 'text-emerald-300'
                            : row.netCoins < 0
                              ? 'text-rose-300'
                              : 'text-zinc-400'
                        )}
                      >
                        {formatSignedCoins(row.netCoins)}
                        {netFmt.format === 'inr' ? (
                          <span className="block text-[10px] font-normal text-zinc-500">{netFmt.text}</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-3 text-[10px] text-zinc-500">
          Daily balance = completed wallet credits minus debits for that UTC day. This is not total coin supply.
        </div>
      </div>
    </div>
  );
};

export default RevenueDailyBalanceModal;
