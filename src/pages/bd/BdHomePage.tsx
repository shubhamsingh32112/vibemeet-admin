import React, { useCallback, useEffect, useRef, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RefreshButton from '../../components/dashboard/RefreshButton';
import GlobalStaleBanner from '../../components/dashboard/GlobalStaleBanner';
import StaleSectionBadge from '../../components/dashboard/StaleSectionBadge';
import { useStaffRealtime } from '../../contexts/StaffRealtimeContext';
import { anySectionStale } from '../../types/dashboardStale';
import {
  HOST_COUNT_SORT_OPTIONS,
  agencyRowLabel,
  sortByHostCount,
  type HostCountSortOption,
} from '../../lib/bdAgencySort';
import {
  bdPortalService,
  type BdDashboardData,
} from '../../services/bdPortalService';

const BdHomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [d, setD] = useState<BdDashboardData | null>(null);
  const [agencySort, setAgencySort] = useState<HostCountSortOption>('hosts_desc');
  const { stale, pendingHint, markFresh } = useStaffRealtime();
  const agencyTableRef = useRef<HTMLDivElement>(null);

  const handleAgencySortChange = (value: HostCountSortOption) => {
    setAgencySort(value);
    requestAnimationFrame(() => {
      agencyTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

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

  const sortedAgencyRows = sortByHostCount(
    d.agencyAnalytics,
    agencySort,
    (row) => agencyRowLabel(row.displayName, row.email)
  );

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
        <Metric
          label="Hosts (all agencies)"
          value={d.totalHosts}
          accent="text-emerald-400"
          subtitle={`${d.agencyTotal} agenc${d.agencyTotal === 1 ? 'y' : 'ies'}`}
        />
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

      <div ref={agencyTableRef} className="scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Agencies & hosts</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {d.totalHosts.toLocaleString()} hosts across {d.agencyAnalytics.length} agencies · 7d
              metrics below
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="whitespace-nowrap">Sort</span>
            <select
              value={agencySort}
              onChange={(e) => handleAgencySortChange(e.target.value as HostCountSortOption)}
              className="rounded-lg border border-admin-border bg-admin-base px-3 py-2 text-sm text-white min-w-[200px]"
            >
              {HOST_COUNT_SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="overflow-x-auto rounded-xl border border-admin-border">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead className="bg-admin-elevated text-zinc-400">
              <tr>
                <th className="px-3 py-2">Agency name</th>
                <th className="px-3 py-2">Email</th>
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
              {sortedAgencyRows.map((row) => (
                <tr key={row.id} className="border-t border-admin-border">
                  <td className="px-3 py-2 text-zinc-100 font-medium max-w-[160px] truncate">
                    {row.displayName?.trim() || '—'}
                  </td>
                  <td className="px-3 py-2 text-zinc-400 text-xs max-w-[180px] truncate">
                    {row.email}
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
              {sortedAgencyRows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-zinc-500 text-center" colSpan={9}>
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
  subtitle,
}: {
  label: string;
  value: number;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value.toLocaleString()}</p>
      {subtitle ? <p className="text-[10px] text-zinc-500 mt-1">{subtitle}</p> : null}
    </div>
  );
}

export default BdHomePage;
