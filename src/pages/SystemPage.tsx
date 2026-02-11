import React, { useEffect, useState, useCallback } from 'react';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { adminService, type SystemHealth } from '../services/adminService';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const SystemPage: React.FC = () => {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const health = await adminService.getSystemHealth();
      setData(health);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  if (loading && !data) return <LoadingSpinner label="Checking system health…" />;
  if (error && !data)
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-4 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700">
          Retry
        </button>
      </div>
    );
  if (!data) return null;

  const allOk = Object.values(data.services).every((s) => s.status === 'ok');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">System Health</h1>
          <StatusBadge
            variant={allOk ? 'success' : 'danger'}
            label={allOk ? 'All Systems Operational' : 'Issues Detected'}
            dot
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-gray-800 border-gray-600 text-blue-500"
            />
            Auto-refresh (15s)
          </label>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* ── Services ────────────────────────── */}
      <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
        🔌 Service Connectivity
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(data.services).map(([name, svc]) => (
          <div
            key={name}
            className={`border rounded-lg p-4 ${
              svc.status === 'ok'
                ? 'border-emerald-800 bg-emerald-900/10'
                : 'border-red-800 bg-red-900/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white capitalize">{name}</span>
              <StatusBadge
                variant={svc.status === 'ok' ? 'success' : 'danger'}
                label={svc.status}
                dot
              />
            </div>
            {svc.latencyMs !== undefined && (
              <p className="text-xs text-gray-500">Latency: {svc.latencyMs}ms</p>
            )}
            {svc.details && (
              <p className="text-xs text-red-400 mt-1">{svc.details}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Platform Activity ────────────────── */}
      <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
        📊 Platform Activity
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard
          label="Online Creators"
          value={data.platform.onlineCreators}
          variant={data.platform.onlineCreators > 0 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Transactions (5m)"
          value={data.platform.recentTransactions5m}
          variant="info"
        />
        <MetricCard
          label="Calls (1h)"
          value={data.platform.recentCalls1h}
        />
        <MetricCard
          label="Failed Txns (1h)"
          value={data.platform.failedTransactions1h}
          variant={data.platform.failedTransactions1h > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Negative Balances"
          value={data.platform.negativeBalanceUsers}
          variant={data.platform.negativeBalanceUsers > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* ── Integrity ────────────────────────── */}
      <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
        🛡 Data Integrity
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className={`border rounded-lg p-4 ${
            data.platform.negativeBalanceUsers === 0
              ? 'border-emerald-800 bg-emerald-900/10'
              : 'border-red-800 bg-red-900/10'
          }`}
        >
          <p className="text-xs text-gray-400 mb-1">Negative Balance Users</p>
          <p
            className={`text-2xl font-bold ${
              data.platform.negativeBalanceUsers === 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {data.platform.negativeBalanceUsers}
          </p>
          <p className="text-xs text-gray-500 mt-1">Should always be 0</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Balance Discrepancies (Sampled)</p>
          <p className="text-2xl font-bold text-white">
            {data.platform.balanceDiscrepancies}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Checks credit − debit vs actual balance
          </p>
        </div>
      </div>

      {/* ── Server Info ──────────────────────── */}
      <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
        🖥 Server
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Uptime" value={formatUptime(data.uptime)} />
        <MetricCard label="Heap Used" value={formatBytes(data.memoryUsage.heapUsed)} />
        <MetricCard label="Heap Total" value={formatBytes(data.memoryUsage.heapTotal)} />
        <MetricCard label="RSS" value={formatBytes(data.memoryUsage.rss)} />
      </div>

      <p className="text-[10px] text-gray-600 text-right">
        Server time: {data.serverTime}
      </p>
    </div>
  );
};

export default SystemPage;
