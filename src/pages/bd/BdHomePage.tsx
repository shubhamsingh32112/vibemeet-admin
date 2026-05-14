import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RefreshButton from '../../components/dashboard/RefreshButton';
import GlobalStaleBanner from '../../components/dashboard/GlobalStaleBanner';
import StaleSectionBadge from '../../components/dashboard/StaleSectionBadge';
import { useStaffRealtime } from '../../contexts/StaffRealtimeContext';
import { anySectionStale } from '../../types/dashboardStale';
import {
  bdPortalService,
  type BdDashboardData,
} from '../../services/bdPortalService';

const BdHomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [d, setD] = useState<BdDashboardData | null>(null);
  const { stale, pendingHint, markFresh } = useStaffRealtime();

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await bdPortalService.getDashboard();
      setD(data);
      markFresh(['revenue', 'creators', 'bds', 'withdrawals', 'overview']);
    } catch {
      setErr('Failed to load dashboard');
      setD(null);
    } finally {
      setLoading(false);
    }
  }, [markFresh]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!d) {
    return (
      <div className="space-y-4">
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    );
  }

  const pageStale = anySectionStale(stale, ['revenue', 'creators', 'bds', 'withdrawals', 'overview']);

  return (
    <div className="space-y-8">
      {pendingHint && pageStale && (
        <GlobalStaleBanner message={pendingHint} onRefreshAll={load} loading={loading} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            BD dashboard
            <StaleSectionBadge stale={pageStale} />
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Revenue from immutable ledger (call settlements). Balances update as calls settle.
          </p>
        </div>
        <RefreshButton onRefresh={load} stale={pageStale} loading={loading} />
      </div>
      {err && <p className="text-red-400 text-sm">{err}</p>}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Metric label="Agency total" value={d.agencyTotal} />
        <Metric label="Agency active" value={d.agencyActive} accent="text-emerald-400" />
        <Metric label="Agency inactive" value={d.agencyInactive} accent="text-amber-400" />
        <Metric label="Wallet balance (coins)" value={d.staffCoinsBalance} accent="text-sky-400" />
        <Metric label="Hosts" value={d.totalHosts} />
        <Metric label="Hosts online" value={d.onlineHosts} />
        <Metric label="Pending withdrawals" value={d.withdrawals.pendingCount} />
        <Metric label="Completed withdrawals" value={d.withdrawals.completedCount} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">BD revenue (coins)</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
            <p className="text-xs text-zinc-500">Today (UTC)</p>
            <p className="text-2xl font-bold text-white mt-1">{d.revenueCoins.today.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
            <p className="text-xs text-zinc-500">Last 7 days</p>
            <p className="text-2xl font-bold text-white mt-1">{d.revenueCoins.last7d.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
            <p className="text-xs text-zinc-500">Last 30 days</p>
            <p className="text-2xl font-bold text-white mt-1">{d.revenueCoins.last30d.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Agency analytics (last 7 days)</h2>
        <div className="overflow-x-auto rounded-xl border border-admin-border">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead className="bg-admin-elevated text-zinc-400">
              <tr>
                <th className="px-3 py-2">Agency</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Hosts</th>
                <th className="px-3 py-2 text-right">Online</th>
                <th className="px-3 py-2 text-right">Calls 7d</th>
                <th className="px-3 py-2 text-right">Agency earn 7d</th>
                <th className="px-3 py-2 text-right">BD share 7d</th>
              </tr>
            </thead>
            <tbody>
              {d.agencyAnalytics.map((row) => (
                <tr key={row.id} className="border-t border-admin-border">
                  <td className="px-3 py-2 text-zinc-200">
                    <span className="block truncate max-w-[180px]">{row.email}</span>
                    {row.displayName ? (
                      <span className="text-xs text-zinc-500">{row.displayName}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-emerald-400/90">
                    {row.referralCode || '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        row.agencyDisabled ? 'text-red-400 text-xs' : 'text-emerald-400 text-xs'
                      }
                    >
                      {row.agencyDisabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.hostCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.onlineHostCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.callsLast7d}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-200">
                    {row.agencyEarningsCoinsLast7d.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-sky-300">
                    {row.bdRevenueFromAgencyLast7d.toLocaleString()}
                  </td>
                </tr>
              ))}
              {d.agencyAnalytics.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-zinc-500 text-center" colSpan={8}>
                    No agency accounts yet — create one under Agency accounts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Withdrawal history (BD)</h2>
        <div className="overflow-x-auto rounded-xl border border-admin-border">
          <table className="w-full text-sm">
            <thead className="bg-admin-elevated text-zinc-400 text-left">
              <tr>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2">Processed</th>
              </tr>
            </thead>
            <tbody>
              {d.withdrawals.recent.map((w) => (
                <tr key={w.id} className="border-t border-admin-border">
                  <td className="px-3 py-2 text-white tabular-nums">{w.amount.toLocaleString()} coins</td>
                  <td className="px-3 py-2 text-xs uppercase text-zinc-400">{w.status}</td>
                  <td className="px-3 py-2 text-zinc-500 text-xs">
                    {new Date(w.requestedAt || w.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-zinc-500 text-xs">
                    {w.processedAt ? new Date(w.processedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {d.withdrawals.recent.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-zinc-500 text-center" colSpan={4}>
                    No withdrawal requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function Metric({
  label,
  value,
  accent = 'text-white',
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default BdHomePage;
