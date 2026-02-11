import React, { useEffect, useState } from 'react';
import MetricCard from '../components/ui/MetricCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { adminService, type OverviewData } from '../services/adminService';

const OverviewPage: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const overview = await adminService.getOverview();
      setData(overview);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading overview…" />;
  if (error)
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-4 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700">
          Retry
        </button>
      </div>
    );
  if (!data) return null;

  const { users, coins, calls, chat } = data;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Platform Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Last updated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Users Section ────────────────────────────────────────────── */}
      <SectionHeader title="👥 Users & Creators" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Total Users" value={users.total} />
        <MetricCard
          label="Creators"
          value={users.creators}
          subtitle={`${users.onlineCreators} online`}
          variant={users.onlineCreators > 0 ? 'success' : 'default'}
        />
        <MetricCard label="Admins" value={users.admins} />
        <MetricCard
          label="Signups (7d)"
          value={users.recentSignups7d}
          variant="info"
        />
        <MetricCard
          label="Onboarded"
          value={users.onboarded}
          subtitle={`${users.total > 0 ? Math.round((users.onboarded / users.total) * 100) : 0}% of users`}
        />
        <MetricCard
          label="Welcome Bonus"
          value={users.welcomeBonusClaimed}
          subtitle="claimed"
        />
      </div>

      {/* ── Coins Section ────────────────────────────────────────────── */}
      <SectionHeader title="💰 Coin Economy" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
        <MetricCard
          label="In Circulation"
          value={coins.totalInCirculation}
          variant="warning"
        />
        <MetricCard
          label="Minted Today"
          value={coins.today.credited}
          subtitle={`${coins.today.creditCount} txns`}
          variant="success"
        />
        <MetricCard
          label="Burned Today"
          value={coins.today.debited}
          subtitle={`${coins.today.debitCount} txns`}
          variant="danger"
        />
        <MetricCard
          label="Net Today"
          value={coins.today.net}
          variant={coins.today.net >= 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label="Net (30d)"
          value={coins.last30d.net}
          variant={coins.last30d.net >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Source breakdown */}
      {Object.keys(coins.bySource30d).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
            Coin Flow by Source (30d)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(coins.bySource30d).map(([source, flow]) => (
              <div key={source} className="text-sm">
                <p className="text-gray-400 text-xs font-medium capitalize">
                  {source.replace(/_/g, ' ')}
                </p>
                <p className="text-emerald-400 tabular-nums">
                  +{flow.credited.toLocaleString()}
                </p>
                <p className="text-red-400 tabular-nums">
                  −{flow.debited.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Calls Section ────────────────────────────────────────────── */}
      <SectionHeader title="📞 Calls" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard
          label="Total Calls"
          value={calls.totalAllTime}
        />
        <MetricCard
          label="Today"
          value={calls.today.totalCalls}
          subtitle={`${calls.today.totalCoinsSpent} coins spent`}
          variant="info"
        />
        <MetricCard
          label="Calls (30d)"
          value={calls.last30d.totalCalls}
        />
        <MetricCard
          label="Minutes (30d)"
          value={calls.last30d.totalDurationMin}
        />
        <MetricCard
          label="Avg Duration"
          value={`${Math.round(calls.last30d.avgDurationSec)}s`}
        />
        <MetricCard
          label="Rev/min"
          value={calls.last30d.revenuePerMinute}
          subtitle="coins per minute"
        />
      </div>

      {/* Anomaly badges */}
      {(calls.last30d.zeroDurationCalls > 0 || calls.last30d.shortCalls > 0) && (
        <div className="flex gap-3 mb-6">
          {calls.last30d.zeroDurationCalls > 0 && (
            <div className="px-3 py-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-300">
              ⚠ {calls.last30d.zeroDurationCalls} zero-duration calls (30d)
            </div>
          )}
          {calls.last30d.shortCalls > 0 && (
            <div className="px-3 py-2 bg-yellow-900/20 border border-yellow-800 rounded text-xs text-yellow-300">
              ⚠ {calls.last30d.shortCalls} very short calls {'<'}10s (30d)
            </div>
          )}
        </div>
      )}

      {/* ── Chat Section ────────────────────────────────────────────── */}
      <SectionHeader title="💬 Chat" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard label="Active Channels" value={chat.totalChannels} />
        <MetricCard
          label="Free Messages"
          value={chat.totalFreeMessages}
        />
        <MetricCard
          label="Paid Messages"
          value={chat.totalPaidMessages}
          variant={chat.totalPaidMessages > 0 ? 'success' : 'default'}
        />
        <MetricCard
          label="Exhausted Quotas"
          value={chat.exhaustedQuotas}
          subtitle="users who used all free msgs"
        />
        <MetricCard
          label="Free→Paid %"
          value={`${chat.freeToPayConversion}%`}
          variant="info"
        />
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
    {title}
  </h2>
);

export default OverviewPage;
