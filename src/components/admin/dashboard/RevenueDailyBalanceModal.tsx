import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type RechargeDay = {
  date: string;
  rechargeInr: number;
  rechargeCoins: number;
  transactionCount: number;
};

type RevenueDailyBalanceModalProps = {
  open: boolean;
  onClose: () => void;
  todayInr: number;
  yesterdayInr?: number;
  points: RechargeDay[];
  rangeLabel?: string;
  note?: string;
};

const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numIn = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function yesterdayUtcDateKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const RevenueDailyBalanceModal: React.FC<RevenueDailyBalanceModalProps> = ({
  open,
  onClose,
  todayInr,
  yesterdayInr,
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
  const yesterdayKey = yesterdayUtcDateKey();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close recharge history"
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
              Daily recharge collection
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Today&apos;s collection:{' '}
              <span className="font-medium text-violet-300 tabular-nums">{inrFmt.format(todayInr)}</span>
            </p>
            {typeof yesterdayInr === 'number' ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                Yesterday: <span className="text-zinc-300 tabular-nums">{inrFmt.format(yesterdayInr)}</span>
              </p>
            ) : null}
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
            <p className="px-3 py-10 text-center text-sm text-zinc-500">No successful recharges in this period.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur">
                <tr className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2.5">Date (UTC)</th>
                  <th className="px-3 py-2.5 text-right">INR collected</th>
                  <th className="px-3 py-2.5 text-right">Coins credited</th>
                  <th className="px-3 py-2.5 text-right">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const isYesterday = row.date === yesterdayKey;
                  return (
                    <tr
                      key={row.date}
                      className={cn(
                        'border-t border-white/[0.04] hover:bg-white/[0.02]',
                        isYesterday && 'bg-violet-500/10'
                      )}
                    >
                      <td className="px-3 py-2.5 font-medium text-zinc-200">
                        {row.date}
                        {isYesterday ? (
                          <span className="ml-2 text-[10px] font-normal text-violet-300">Yesterday</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium text-emerald-300">
                        {inrFmt.format(row.rechargeInr)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-400">
                        {numIn.format(row.rechargeCoins)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-500">
                        {row.transactionCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-3 text-[10px] text-zinc-500">
          Successful wallet recharges only (payment_gateway credits). Amounts in INR from checkout or purchase description.
        </div>
      </div>
    </div>
  );
};

export default RevenueDailyBalanceModal;
