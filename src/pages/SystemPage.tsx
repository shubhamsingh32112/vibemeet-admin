import React, { useEffect, useState, useCallback } from 'react';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  adminService,
  type GlobalAppUpdate,
  type SystemHealth,
} from '../services/adminService';

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
  const [currentUpdate, setCurrentUpdate] = useState<GlobalAppUpdate | null>(null);
  const [updateLoading, setUpdateLoading] = useState(true);
  const [updateError, setUpdateError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [title, setTitle] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [points, setPoints] = useState<string[]>(['']);

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

  const loadCurrentUpdate = useCallback(async () => {
    try {
      setUpdateLoading(true);
      setUpdateError('');
      const payload = await adminService.getCurrentAppUpdate();
      setCurrentUpdate(payload);
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || err.message || 'Failed to load app update');
    } finally {
      setUpdateLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUpdate();
  }, [loadCurrentUpdate]);

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
  const normalizedPoints = points.map((p) => p.trim()).filter(Boolean);
  const canPublish =
    title.trim().length > 0 &&
    updateUrl.trim().startsWith('https://') &&
    normalizedPoints.length > 0 &&
    !isPublishing;

  const handlePointChange = (index: number, value: string) => {
    setPoints((prev) => prev.map((point, i) => (i === index ? value : point)));
  };

  const addPoint = () => {
    setPoints((prev) => [...prev, '']);
  };

  const removePoint = (index: number) => {
    setPoints((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handlePublishConfirmed = async () => {
    if (!canPublish) return;
    try {
      setIsPublishing(true);
      setPublishError('');
      setPublishSuccess('');
      const published = await adminService.publishAppUpdate({
        title: title.trim(),
        points: normalizedPoints,
        updateUrl: updateUrl.trim(),
      });
      setCurrentUpdate(published);
      setPublishSuccess('Update published successfully. Users and creators will receive the popup.');
      setTitle('');
      setUpdateUrl('');
      setPoints(['']);
      setShowPublishConfirm(false);
    } catch (err: any) {
      setPublishError(
        err.response?.data?.error || err.message || 'Failed to publish app update'
      );
    } finally {
      setIsPublishing(false);
    }
  };

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

      <div className="mt-10 border border-gray-800 bg-gray-900/40 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Global App Update Popup</h2>
          <StatusBadge
            variant={currentUpdate ? 'info' : 'warning'}
            label={currentUpdate ? 'Active update published' : 'No active update'}
            dot
          />
        </div>

        {publishSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-700 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
            {publishSuccess}
          </div>
        )}
        {(publishError || updateError) && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {publishError || updateError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Publish New Update</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Heading</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={160}
                  placeholder="New version available"
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Bullet Points</label>
                <div className="space-y-2">
                  {points.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={point}
                        onChange={(e) => handlePointChange(idx, e.target.value)}
                        maxLength={240}
                        placeholder={`Point ${idx + 1}`}
                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => removePoint(idx)}
                        disabled={points.length <= 1}
                        className="px-2 py-2 text-xs rounded border border-gray-700 text-gray-300 hover:text-white disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPoint}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  + Add another point
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Update Link (HTTPS)</label>
                <input
                  value={updateUrl}
                  onChange={(e) => setUpdateUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPublishConfirm(true)}
                disabled={!canPublish}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
              >
                {isPublishing ? 'Publishing...' : 'Publish Global Update'}
              </button>
            </div>
          </div>

          <div className="border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Current Active Update</h3>
            {updateLoading ? (
              <div className="text-sm text-gray-500">Loading active update...</div>
            ) : !currentUpdate ? (
              <div className="text-sm text-gray-500">No active update has been published yet.</div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Version: {currentUpdate.version} · Published:{' '}
                  {new Date(currentUpdate.publishedAt).toLocaleString()}
                </p>
                <h4 className="text-base font-semibold text-white">{currentUpdate.title}</h4>
                <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                  {currentUpdate.points.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
                <a
                  href={currentUpdate.updateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm text-blue-400 hover:text-blue-300"
                >
                  {currentUpdate.updateUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showPublishConfirm}
        title="Publish app update?"
        message="This will trigger an update popup for all users and creators."
        confirmLabel={isPublishing ? 'Publishing...' : 'Publish'}
        confirmVariant="primary"
        confirmDisabled={!canPublish}
        onCancel={() => setShowPublishConfirm(false)}
        onConfirm={handlePublishConfirmed}
      />
    </div>
  );
};

export default SystemPage;
