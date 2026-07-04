import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { fetchDashboardRechargeTransactions } from '../../../services/dashboardApi';
import { istTodayKey, istYesterdayKey } from '../../../utils/istTime';

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
  historyDays?: number;
  note?: string;
};

const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numIn = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

const DayTransactions: React.FC<{ date: string; enabled: boolean }> = ({ date, enabled }) => {
  const q = useQuery({
    queryKey: ['dashboard', 'recharge-transactions', date],
    queryFn: () => fetchDashboardRechargeTransactions(date),
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;

  if (q.isLoading) {
    return <p className="py-2 text-xs text-zinc-500">Loading transactions…</p>;
  }

  if (q.isError) {
    return (
      <p className="py-2 text-xs text-red-300">
        Failed to load transactions.{' '}
        <button type="button" className="underline" onClick={() => void q.refetch()}>
          Retry
        </button>
      </p>
    );
  }

  const rows = q.data?.transactions ?? [];
  if (rows.length === 0) {
    return <p className="py-2 text-xs text-zinc-500">No successful recharges on this IST day.</p>;
  }

  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-wide text-zinc-600">
          <th className="py-1 pr-3 font-medium">Time (IST)</th>
          <th className="py-1 pr-3 font-medium">User</th>
          <th className="py-1 pr-3 text-right font-medium">INR</th>
          <th className="py-1 pr-3 text-right font-medium">Coins</th>
          <th className="py-1 text-right font-medium">Order ID</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((tx) => (
          <tr key={tx.id} className="border-t border-white/[0.04]">
            <td className="py-1.5 pr-3 tabular-nums text-zinc-400">{tx.completedAtIst}</td>
            <td className="py-1.5 pr-3 text-zinc-300">{tx.userLabel}</td>
            <td className="py-1.5 pr-3 text-right tabular-nums font-medium text-emerald-300/90">
              {inrFmt.format(tx.inr)}
            </td>
            <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-500">{numIn.format(tx.coins)}</td>
            <td className="py-1.5 text-right font-mono text-[10px] text-zinc-500">
              {tx.orderId ?? tx.transactionId}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const RevenueDailyBalanceModal: React.FC<RevenueDailyBalanceModalProps> = ({
  open,
  onClose,
  todayInr,
  yesterdayInr,
  points,
  historyDays = 90,
  note,
}) => {
  const [expandedDate, setExpandedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) setExpandedDate(null);
  }, [open]);

  if (!open) return null;

  const sorted = [...points].sort((a, b) => b.date.localeCompare(a.date));
  const yesterdayKey = istYesterdayKey();
  const todayKey = istTodayKey();

  const toggleDate = (date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  };

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
        className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 id="revenue-daily-balance-title" className="text-lg font-semibold text-white">
              Daily recharge collection
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Today&apos;s collection ({todayKey} IST):{' '}
              <span className="font-medium text-violet-300 tabular-nums">{inrFmt.format(todayInr)}</span>
            </p>
            {typeof yesterdayInr === 'number' ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                Yesterday ({yesterdayKey} IST):{' '}
                <span className="text-zinc-300 tabular-nums">{inrFmt.format(yesterdayInr)}</span>
              </p>
            ) : null}
            <p className="mt-0.5 text-xs text-zinc-500">Last {historyDays} days (IST)</p>
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
                  <th className="px-3 py-2.5 w-8" aria-hidden />
                  <th className="px-3 py-2.5">Date (IST)</th>
                  <th className="px-3 py-2.5 text-right">INR collected</th>
                  <th className="px-3 py-2.5 text-right">Coins credited</th>
                  <th className="px-3 py-2.5 text-right">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const isYesterday = row.date === yesterdayKey;
                  const isExpanded = expandedDate === row.date;
                  const hasTransactions = row.transactionCount > 0;
                  return (
                    <React.Fragment key={row.date}>
                      <tr
                        className={cn(
                          'border-t border-white/[0.04]',
                          hasTransactions && 'cursor-pointer hover:bg-white/[0.03]',
                          isYesterday && 'bg-violet-500/10'
                        )}
                        onClick={hasTransactions ? () => toggleDate(row.date) : undefined}
                      >
                        <td className="px-2 py-2.5 text-zinc-500">
                          {hasTransactions ? (
                            isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )
                          ) : null}
                        </td>
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
                      {isExpanded ? (
                        <tr className="border-t border-white/[0.03] bg-white/[0.02]">
                          <td colSpan={5} className="px-3 py-2 pl-10">
                            <DayTransactions date={row.date} enabled={isExpanded} />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-3 text-[10px] text-zinc-500">
          Successful wallet recharges only (payment_gateway credits). Amounts from priceInr or purchase description.
          Grouped by payment completion time (updatedAt) in Asia/Kolkata.
        </div>
      </div>
    </div>
  );
};

export default RevenueDailyBalanceModal;
