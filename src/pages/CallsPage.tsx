import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { type Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { adminService, type AdminCall, type RefundPreview } from '../services/adminService';

const CallsPage: React.FC = () => {
  const [calls, setCalls] = useState<AdminCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  // Refund modal
  const [refundTarget, setRefundTarget] = useState<AdminCall | null>(null);
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getCalls({
        page,
        limit: 50,
        anomaly: anomalyOnly || undefined,
      });
      setCalls(data.calls);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, anomalyOnly]);

  useEffect(() => {
    load();
  }, [load]);

  // Load refund preview when target changes
  const openRefundModal = async (call: AdminCall) => {
    setRefundTarget(call);
    setRefundReason('');
    setRefundPreview(null);
    setLoadingPreview(true);
    try {
      const preview = await adminService.getRefundPreview(call.callId);
      setRefundPreview(preview);
    } catch (err: any) {
      setRefundPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    if (!refundReason || refundReason.trim().length < 5) {
      alert('Reason must be at least 5 characters');
      return;
    }
    try {
      const result = await adminService.refundCall(refundTarget.callId, refundReason);
      const parts = [`Refunded ${result.refundedAmount} coins`];
      parts.push(`User balance: ${result.userBalanceBefore} → ${result.userBalanceAfter}`);
      if (result.creatorClawback) {
        parts.push(`Creator clawback: ${result.creatorClawback.balanceBefore} → ${result.creatorClawback.balanceAfter}`);
      }
      alert(parts.join('\n'));
      setRefundTarget(null);
      setRefundReason('');
      setRefundPreview(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to refund');
    }
  };

  const columns: Column<AdminCall>[] = [
    {
      key: 'callId',
      header: 'Call ID',
      width: '160px',
      render: (row) => (
        <span className="font-mono text-xs text-gray-400 truncate block max-w-[150px]">
          {row.callId}
        </span>
      ),
    },
    {
      key: 'ownerUsername',
      header: 'User',
      render: (row) => (
        <span className="text-sm text-white">{row.ownerUsername}</span>
      ),
    },
    {
      key: 'otherName',
      header: 'Creator',
      render: (row) => (
        <span className="text-sm text-gray-300">{row.otherName}</span>
      ),
    },
    {
      key: 'durationFormatted',
      header: 'Duration',
      sortable: true,
      getValue: (row) => row.durationSeconds,
      render: (row) => {
        let color = 'text-gray-300';
        if (row.isZeroDuration) color = 'text-red-400 font-medium';
        else if (row.isVeryShort) color = 'text-yellow-400';
        return <span className={`tabular-nums ${color}`}>{row.durationFormatted}</span>;
      },
    },
    {
      key: 'coinsDeducted',
      header: 'Coins Spent',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-red-400">
          {row.coinsDeducted > 0 ? `−${row.coinsDeducted}` : '—'}
        </span>
      ),
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (row) => (
        <div className="flex gap-1">
          {row.isRefunded && (
            <StatusBadge variant="info" label="Refunded" />
          )}
          {row.isSuspicious && (
            <StatusBadge variant="danger" label="Suspicious" />
          )}
          {row.isZeroDuration && !row.isSuspicious && (
            <StatusBadge variant="warning" label="0 dur" />
          )}
          {row.isVeryShort && !row.isZeroDuration && (
            <StatusBadge variant="neutral" label="Short" />
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (row) =>
        row.coinsDeducted > 0 && !row.isRefunded ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openRefundModal(row);
            }}
            className="px-2 py-1 text-xs bg-yellow-900/30 border border-yellow-800 rounded text-yellow-400 hover:text-yellow-200 transition"
          >
            Refund
          </button>
        ) : row.isRefunded ? (
          <span className="text-xs text-gray-600">Refunded</span>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Calls & Billing</h1>
        <button
          onClick={load}
          className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={anomalyOnly}
            onChange={(e) => {
              setAnomalyOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded bg-gray-800 border-gray-600 text-blue-500"
          />
          Anomalies only
        </label>
        <span className="text-xs text-gray-500 ml-auto">
          {total} calls total · Page {page}/{totalPages}
        </span>
      </div>

      {/* Summary badges */}
      {calls.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded text-xs text-gray-400">
            Showing: {calls.length} calls
          </div>
          {calls.filter((c) => c.isSuspicious).length > 0 && (
            <div className="px-3 py-1.5 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
              ⚠ {calls.filter((c) => c.isSuspicious).length} suspicious
            </div>
          )}
          {calls.filter((c) => c.isZeroDuration).length > 0 && (
            <div className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-800 rounded text-xs text-yellow-400">
              {calls.filter((c) => c.isZeroDuration).length} zero-duration
            </div>
          )}
          {calls.filter((c) => c.isRefunded).length > 0 && (
            <div className="px-3 py-1.5 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-400">
              {calls.filter((c) => c.isRefunded).length} refunded
            </div>
          )}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="py-8 text-center text-red-400">{error}</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={calls}
            keyField="callId"
            compact
            maxHeight="calc(100vh - 320px)"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Refund Confirm with Preview ──────────────────── */}
      <ConfirmDialog
        open={!!refundTarget}
        title="Refund Call"
        message=""
        confirmLabel={refundPreview?.canRefund === false ? 'Cannot Refund' : 'Confirm Refund'}
        confirmVariant="danger"
        confirmDisabled={loadingPreview || (!!refundPreview && !refundPreview.canRefund)}
        onConfirm={handleRefund}
        onCancel={() => {
          setRefundTarget(null);
          setRefundReason('');
          setRefundPreview(null);
        }}
      >
        <div className="space-y-3">
          {loadingPreview ? (
            <div className="text-sm text-gray-400 text-center py-4">Loading preview...</div>
          ) : refundPreview ? (
            <>
              {/* Block reason */}
              {!refundPreview.canRefund && refundPreview.blockReason && (
                <div className="p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-400">
                  ⛔ {refundPreview.blockReason}
                </div>
              )}

              {/* Call info */}
              <div className="p-2 bg-gray-800 rounded text-xs text-gray-300 space-y-1">
                <div>Call ID: <span className="font-mono">{refundPreview.callId}</span></div>
                <div>Duration: {refundPreview.call.durationSeconds}s · Coins: {refundPreview.call.coinsDeducted}</div>
                <div>Age: {refundPreview.call.ageDays}d</div>
              </div>

              {/* User impact */}
              {refundPreview.userImpact && (
                <div className="p-2 bg-green-900/20 border border-green-900 rounded text-xs">
                  <div className="text-green-400 font-medium mb-1">User: {refundPreview.userImpact.username}</div>
                  <div className="text-gray-300">
                    Balance: <span className="text-gray-400">{refundPreview.userImpact.currentBalance}</span>
                    {' → '}
                    <span className="text-green-400 font-medium">{refundPreview.userImpact.afterRefund}</span>
                    <span className="text-green-600 ml-1">(+{refundPreview.call.coinsDeducted})</span>
                  </div>
                </div>
              )}

              {/* Creator impact */}
              {refundPreview.creatorImpact && (
                <div className="p-2 bg-red-900/20 border border-red-900 rounded text-xs">
                  <div className="text-red-400 font-medium mb-1">Creator: {refundPreview.creatorImpact.username}</div>
                  <div className="text-gray-300">
                    Balance: <span className="text-gray-400">{refundPreview.creatorImpact.currentBalance}</span>
                    {' → '}
                    <span className="text-red-400 font-medium">{refundPreview.creatorImpact.afterClawback}</span>
                    <span className="text-red-600 ml-1">(-{refundPreview.creatorImpact.clawbackAmount})</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400">
              Refund {refundTarget?.coinsDeducted ?? 0} coins for call {refundTarget?.callId ?? ''}.
              User: {refundTarget?.ownerUsername}.
            </div>
          )}

          {/* Reason */}
          {(!refundPreview || refundPreview.canRefund) && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Reason (required, min 5 chars)
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. User reported audio issues"
                className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default CallsPage;
