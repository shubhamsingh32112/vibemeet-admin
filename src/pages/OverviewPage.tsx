import React, { useEffect, useState } from 'react';
import MetricCard from '../components/ui/MetricCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { adminService, type OverviewData } from '../services/adminService';
import { useAdminRealtime } from '../contexts/AdminRealtimeContext';
import DateRangeFilter from '../components/filters/DateRangeFilter';
import { useAdminDateRange } from '../hooks/useAdminDateRange';
import { formatDateTime } from '../utils/dateTime';

/**
 * Admin overview: work queues + growth + live signals. Detail lives on dedicated pages.
 * (See admin routes: /withdrawals, /support, /coins, /calls.)
 */
const OverviewPage: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { refreshGeneration, connected, lastError } = useAdminRealtime();
  const { dateRange, setPreset, setCustom } = useAdminDateRange('today');

  useEffect(() => {
    let cancelled = false;
    const silent = refreshGeneration > 0;

    const run = async () => {
      try {
        if (!silent) {
          setLoading(true);
          setError('');
        }
        const overview = await adminService.getOverview({ from: dateRange.from, to: dateRange.to });
        if (!cancelled) setData(overview);
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } }; message?: string };
        if (!cancelled && !silent) {
          setError(ax.response?.data?.error || ax.message || 'Failed to load overview');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [refreshGeneration, dateRange.from, dateRange.to]);

  if (loading && !data) return <LoadingSpinner label="Loading overview…" />;
  if (error && !data)
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => {
            setError('');
            setLoading(true);
            adminService
              .getOverview({ from: dateRange.from, to: dateRange.to })
              .then(setData)
              .catch((err: unknown) => {
                const ax = err as { response?: { data?: { error?: string } }; message?: string };
                setError(ax.response?.data?.error || ax.message || 'Failed to load overview');
              })
              .finally(() => setLoading(false));
          }}
          className="px-4 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700"
        >
          Retry
        </button>
      </div>
    );
  if (!data) return null;

  const { users, coins, calls, withdrawals, support } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Operations overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Last updated: {formatDateTime(data.generatedAt)}
            {connected ? (
              <span className="ml-2 text-emerald-500">· Live sync on</span>
            ) : (
              <span className="ml-2 text-amber-600">· Live sync off</span>
            )}
            {lastError ? (
              <span className="ml-2 text-red-400" title={lastError}>
                ({lastError})
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            adminService
              .getOverview({ from: dateRange.from, to: dateRange.to })
              .then(setData)
              .catch((err: unknown) => {
                const ax = err as { response?: { data?: { error?: string } }; message?: string };
                setError(ax.response?.data?.error || ax.message || 'Failed to load overview');
              })
              .finally(() => setLoading(false));
          }}
          className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition"
        >
          ↻ Refresh
        </button>
      </div>

      <DateRangeFilter
        value={dateRange}
        onPresetChange={setPreset}
        onCustomChange={setCustom}
        className="mb-4"
      />

      <SectionHeader title="Queues" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {withdrawals && (
          <MetricCard
            label="Pending withdrawals"
            value={withdrawals.pendingCount}
            variant={withdrawals.pendingCount > 0 ? 'warning' : 'default'}
          />
        )}
        {support && (
          <>
            <MetricCard
              label="Open support tickets"
              value={support.openTickets}
              variant={support.openTickets > 0 ? 'info' : 'default'}
            />
            <MetricCard
              label="High-priority open"
              value={support.highPriorityTickets}
              variant={support.highPriorityTickets > 0 ? 'danger' : 'default'}
            />
          </>
        )}
        <MetricCard
          label="Creators online"
          value={users.onlineCreators}
          variant={users.onlineCreators > 0 ? 'success' : 'default'}
        />
      </div>

      <SectionHeader title="Growth" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total users" value={users.total} />
        <MetricCard
          label="Creators"
          value={users.creators}
          subtitle={`${users.onlineCreators} online now`}
        />
        <MetricCard
          label={data.selectedRange ? 'Signups (range)' : 'Signups (7d)'}
          value={data.selectedRange ? (data.rangeMetrics?.users.signups ?? 0) : users.recentSignups7d}
          variant="info"
        />
        <MetricCard
          label="Onboarded"
          value={users.onboarded}
          subtitle={`${users.total > 0 ? Math.round((users.onboarded / users.total) * 100) : 0}% of users`}
        />
      </div>

      <SectionHeader title="Coin economy (snapshot)" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="In circulation" value={coins.totalInCirculation} variant="warning" />
        <MetricCard
          label={data.selectedRange ? 'Net (range)' : 'Net today'}
          value={data.selectedRange ? (data.rangeMetrics?.coins.net ?? 0) : coins.today.net}
          variant={coins.today.net >= 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label="Net (30d)"
          value={coins.last30d.net}
          variant={coins.last30d.net >= 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label="Welcome bonus claimed"
          value={users.welcomeBonusClaimed}
          subtitle="users"
        />
      </div>

      <SectionHeader title="Calls (snapshot)" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label={data.selectedRange ? 'Calls (range)' : 'Calls today'}
          value={data.selectedRange ? (data.rangeMetrics?.calls.totalCalls ?? 0) : calls.today.totalCalls}
          subtitle={`${
            data.selectedRange ? (data.rangeMetrics?.calls.totalCoinsSpent ?? 0) : calls.today.totalCoinsSpent
          } coins`}
          variant="info"
        />
        <MetricCard label="Calls (30d)" value={calls.last30d.totalCalls} />
        <MetricCard
          label="Anomalies (30d)"
          value={
            calls.last30d.zeroDurationCalls + calls.last30d.shortCalls > 0
              ? `${calls.last30d.zeroDurationCalls} zero-duration · ${calls.last30d.shortCalls} very short`
              : 'None'
          }
          variant={
            calls.last30d.zeroDurationCalls + calls.last30d.shortCalls > 0 ? 'danger' : 'success'
          }
        />
      </div>

      {data.creatorsOnlineToday != null && data.creatorsOnlineToday.length > 0 && (
        <>
          <SectionHeader title="Creator availability (current period)" />
          {data.creatorsOnlineTodayNote ? (
            <p className="text-[11px] text-gray-500 mb-2">{data.creatorsOnlineTodayNote}</p>
          ) : null}
          <div className="overflow-x-auto border border-gray-800 rounded-lg mb-6">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-3 py-2">Creator</th>
                  <th className="px-3 py-2">Time online (available)</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {data.creatorsOnlineToday.map((row) => (
                  <tr key={row.firebaseUid} className="border-t border-gray-800">
                    <td className="px-3 py-2">{row.displayName}</td>
                    <td className="px-3 py-2 font-mono">{formatOnlineSeconds(row.onlineSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-[11px] text-gray-600 mt-4">
        Chat metrics, full coin breakdown, and call analytics are on the Coins and Calls pages.
      </p>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
    {title}
  </h2>
);

function formatOnlineSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

export default OverviewPage;
