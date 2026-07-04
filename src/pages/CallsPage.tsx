import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable, { type Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { SectionHeading } from '../components/admin/help/SectionHeading';
import { adminService, type AdminCall, type RefundPreview, type SettlementRetryPreview } from '../services/adminService';
import { useAdminDateRange } from '../hooks/useAdminDateRange';
import { formatDateTime } from '../utils/dateTime';

function settlementIssueLabel(
  issue: AdminCall['settlementIssue']
): string {
  switch (issue) {
    case 'zero_duration_with_billing':
      return '0dur+billing';
    case 'unsettled_ledger':
      return 'unsettled ledger';
    case 'failed_recovery':
      return 'failed recovery';
    case 'stuck_settling':
      return 'stuck settling';
    default:
      return '';
  }
}

const CallsPage: React.FC = () => {
  const [calls, setCalls] = useState<AdminCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useAdminDateRange('today');
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const anomalyOnly = searchParams.get('anomaly') === '1';

  const updateListQuery = useCallback(
    (updates: { page?: number; anomalyOnly?: boolean }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (typeof updates.page === 'number' && Number.isFinite(updates.page)) {
            next.set('page', String(Math.max(1, Math.trunc(updates.page))));
          }
          if (typeof updates.anomalyOnly === 'boolean') {
            if (updates.anomalyOnly) next.set('anomaly', '1');
            else next.delete('anomaly');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Refund modal
  const [refundTarget, setRefundTarget] = useState<AdminCall | null>(null);
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [integrity, setIntegrity] = useState<Awaited<
    ReturnType<typeof adminService.getIntegrityChecks>
  > | null>(null);

  const [resettleTarget, setResettleTarget] = useState<AdminCall | null>(null);
  const [resettlePreview, setResettlePreview] = useState<SettlementRetryPreview | null>(null);
  const [loadingResettlePreview, setLoadingResettlePreview] = useState(false);
  const [resettleForce, setResettleForce] = useState(false);
  const [bulkResettleOpen, setBulkResettleOpen] = useState(false);
  const [bulkResettleResults, setBulkResettleResults] = useState<
    Array<{ callId: string; status: string; message: string }> | null
  >(null);
  const [bulkResettleLoading, setBulkResettleLoading] = useState(false);

  const retryableOnPage = calls.filter((c) => c.canRetrySettlement);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getCalls({
        page,
        limit: 50,
        anomaly: anomalyOnly || undefined,
        from: dateRange.from,
        to: dateRange.to,
      });
      if (page > data.pagination.totalPages && data.pagination.totalPages > 0) {
        updateListQuery({ page: data.pagination.totalPages });
        return;
      }
      setCalls(data.calls);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, anomalyOnly, dateRange.from, dateRange.to, updateListQuery]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void adminService.getIntegrityChecks().then(setIntegrity).catch(() => setIntegrity(null));
  }, []);

  const refreshIntegrity = () => {
    void adminService.getIntegrityChecks().then(setIntegrity).catch(() => setIntegrity(null));
  };

  const openResettleModal = async (call: AdminCall) => {
    setResettleTarget(call);
    setResettlePreview(null);
    setResettleForce(false);
    setLoadingResettlePreview(true);
    try {
      const preview = await adminService.getSettlementRetryPreview(call.callId);
      setResettlePreview(preview);
    } catch {
      setResettlePreview(null);
    } finally {
      setLoadingResettlePreview(false);
    }
  };

  const handleResettle = async () => {
    if (!resettleTarget) return;
    try {
      const result = await adminService.retryCallSettlement(resettleTarget.callId, {
        force: resettleForce,
      });
      alert(`${result.status}: ${result.message}`);
      setResettleTarget(null);
      setResettlePreview(null);
      setResettleForce(false);
      load();
      refreshIntegrity();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to re-settle');
    }
  };

  const handleBulkResettle = async () => {
    const callIds = retryableOnPage.map((c) => c.callId);
    if (callIds.length === 0) return;
    setBulkResettleLoading(true);
    setBulkResettleResults(null);
    try {
      const results = await adminService.retryCallSettlementBulk(callIds);
      setBulkResettleResults(results);
      load();
      refreshIntegrity();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Bulk re-settle failed');
      setBulkResettleOpen(false);
    } finally {
      setBulkResettleLoading(false);
    }
  };

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
      key: 'callStartedAt',
      header: 'Started',
      render: (row) => (
        <span className="text-xs text-zinc-400">
          {row.callStartedAt ? formatDateTime(row.callStartedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'callEndedAt',
      header: 'Ended',
      render: (row) => (
        <span className="text-xs text-zinc-400">
          {row.callEndedAt ? formatDateTime(row.callEndedAt) : '—'}
        </span>
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
      header: 'User Spent',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-red-400">
          {row.coinsDeducted > 0 ? `−${row.coinsDeducted}` : '—'}
        </span>
      ),
    },
    {
      key: 'authoritativeCoinsDeducted',
      header: 'Auth. coins',
      render: (row) => {
        const auth = row.authoritativeCoinsDeducted;
        if (auth == null) return <span className="text-gray-600">—</span>;
        const differs = auth !== row.coinsDeducted;
        const show = differs || (row.coinsDeducted === 0 && auth > 0);
        if (!show) return <span className="text-gray-600">—</span>;
        return (
          <span className="tabular-nums text-amber-400" title="Authoritative settlement total">
            {auth > 0 ? `−${auth}` : '0'}
          </span>
        );
      },
    },
    {
      key: 'creatorCoinsEarned',
      header: 'Creator Earned',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-emerald-400">
          {row.creatorCoinsEarned > 0 ? `+${row.creatorCoinsEarned}` : '—'}
        </span>
      ),
    },
    {
      key: 'billingStatus',
      header: 'Billing',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">{row.billingStatus ?? '—'}</span>
          {row.settlementIssue && (
            <StatusBadge variant="warning" label={settlementIssueLabel(row.settlementIssue)} />
          )}
        </div>
      ),
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.canRetrySettlement && (
            <StatusBadge variant="warning" label="Re-settle" />
          )}
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
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      render: (row) => (
        <div className="flex flex-col gap-1">
          {row.canRetrySettlement && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openResettleModal(row);
              }}
              className="px-2 py-1 text-xs bg-orange-900/30 border border-orange-800 rounded text-orange-400 hover:text-orange-200 transition"
            >
              Re-settle
            </button>
          )}
          {row.coinsDeducted > 0 && !row.isRefunded ? (
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
          ) : null}
        </div>
      ),
    },
  ];

  const columnHelp: Record<string, string> = {
    durationFormatted: 'calls.table.duration',
    coinsDeducted: 'calls.table.coins_deducted',
    creatorCoinsEarned: 'calls.table.coins_earned',
    createdAt: 'calls.table.created',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionHeading title="Calls & Billing" helpKey="calls.page" level={1} />
        <button
          onClick={load}
          className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={anomalyOnly}
            onChange={(e) => {
              updateListQuery({ anomalyOnly: e.target.checked, page: 1 });
            }}
            className="rounded bg-gray-800 border-gray-600 text-blue-500"
          />
          Anomalies only
        </label>
        {integrity && (
          <div
            className={`text-xs px-3 py-1.5 rounded border ${
              integrity.overallHealthy
                ? 'border-emerald-800 bg-emerald-900/20 text-emerald-300'
                : 'border-amber-800 bg-amber-900/20 text-amber-300'
            }`}
            title="30-day billing integrity sample"
          >
            Integrity: {integrity.checks.videoCalls.unsettledCount} unsettled calls ·{' '}
            {integrity.checks.balanceIntegrity.mismatchCount} balance mismatches
          </div>
        )}
        {retryableOnPage.length > 0 && (
          <button
            onClick={() => {
              setBulkResettleResults(null);
              setBulkResettleOpen(true);
            }}
            className="px-3 py-1.5 text-xs bg-orange-900/30 border border-orange-800 rounded text-orange-300 hover:text-orange-100 transition"
          >
            Re-settle retryable on page ({retryableOnPage.length})
          </button>
        )}
        <span className="text-xs text-gray-500 ml-auto">
          {total} calls total · Page {page}/{totalPages}
        </span>
      </div>

      {/* Summary badges */}
      {calls.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded text-xs text-gray-400">
            Current page: {calls.length} calls
          </div>
          {calls.filter((c) => c.isSuspicious).length > 0 && (
            <div className="px-3 py-1.5 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
              ⚠ {calls.filter((c) => c.isSuspicious).length} suspicious on page
            </div>
          )}
          {calls.filter((c) => c.isZeroDuration).length > 0 && (
            <div className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-800 rounded text-xs text-yellow-400">
              {calls.filter((c) => c.isZeroDuration).length} zero-duration on page
            </div>
          )}
          {calls.filter((c) => c.isRefunded).length > 0 && (
            <div className="px-3 py-1.5 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-400">
              {calls.filter((c) => c.isRefunded).length} refunded on page
            </div>
          )}
          {retryableOnPage.length > 0 && (
            <div className="px-3 py-1.5 bg-orange-900/20 border border-orange-800 rounded text-xs text-orange-400">
              {retryableOnPage.length} retryable on page
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
            columnHelp={columnHelp}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => updateListQuery({ page: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => updateListQuery({ page: Math.min(totalPages, page + 1) })}
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

      {/* ── Re-settle Confirm with Preview ───────────────── */}
      <ConfirmDialog
        open={!!resettleTarget}
        title="Re-settle Call"
        message=""
        confirmLabel={
          resettlePreview?.eligible === false && !resettleForce
            ? 'Not eligible'
            : 'Confirm Re-settle'
        }
        confirmVariant="danger"
        confirmDisabled={
          loadingResettlePreview ||
          (!!resettlePreview && !resettlePreview.eligible && !resettleForce)
        }
        onConfirm={handleResettle}
        onCancel={() => {
          setResettleTarget(null);
          setResettlePreview(null);
          setResettleForce(false);
        }}
      >
        <div className="space-y-3">
          {loadingResettlePreview ? (
            <div className="text-sm text-gray-400 text-center py-4">Loading preview...</div>
          ) : resettlePreview ? (
            <>
              {!resettlePreview.eligible && resettlePreview.skipReason && (
                <div className="p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-400">
                  {resettlePreview.skipReason}
                </div>
              )}
              <div className="p-2 bg-gray-800 rounded text-xs text-gray-300 space-y-1">
                <div>
                  Issue:{' '}
                  <span className="text-amber-400">
                    {settlementIssueLabel(resettlePreview.settlementIssue) || 'none'}
                  </span>
                </div>
                <div>Billing status: {resettlePreview.billingStatus}</div>
                <div>
                  Current: {resettlePreview.callHistory?.durationSeconds ?? 0}s ·{' '}
                  {resettlePreview.callHistory?.coinsDeducted ?? 0} coins deducted
                </div>
                <div>
                  Proposed: {resettlePreview.proposedDurationSeconds}s ·{' '}
                  {resettlePreview.proposedCoinsDeducted} coins (source:{' '}
                  {resettlePreview.authoritativeTotals.source})
                </div>
                {resettlePreview.deadLetterPresent && (
                  <div className="text-red-400">Dead letter present — will be cleared on retry</div>
                )}
                {!resettlePreview.hasVideoCallDebitTxn &&
                  (resettlePreview.callHistory?.walletCoinsDeducted == null
                    ? !resettlePreview.hasCreatorCreditTxn
                    : (resettlePreview.callHistory?.walletCoinsDeducted ?? 0) > 0) && (
                  <div className="text-amber-400">No video_call debit txn in ledger</div>
                )}
                {!resettlePreview.hasVideoCallDebitTxn &&
                  resettlePreview.hasCreatorCreditTxn &&
                  (resettlePreview.callHistory?.walletCoinsDeducted ?? 0) === 0 && (
                  <div className="text-gray-400">Intro/welcome promo call — wallet debit txn not expected</div>
                )}
              </div>
              {!resettlePreview.eligible && (
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={resettleForce}
                    onChange={(e) => setResettleForce(e.target.checked)}
                    className="rounded bg-gray-800 border-gray-600 text-orange-500"
                  />
                  Force retry anyway
                </label>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400">
              Re-settle call {resettleTarget?.callId ?? ''} for user {resettleTarget?.ownerUsername}.
            </div>
          )}
        </div>
      </ConfirmDialog>

      {/* ── Bulk Re-settle ───────────────────────────────── */}
      <ConfirmDialog
        open={bulkResettleOpen}
        title="Bulk Re-settle"
        message=""
        confirmLabel={bulkResettleResults ? 'Close' : bulkResettleLoading ? 'Working…' : 'Confirm Bulk Re-settle'}
        confirmVariant="danger"
        confirmDisabled={bulkResettleLoading}
        onConfirm={() => {
          if (bulkResettleResults) {
            setBulkResettleOpen(false);
            setBulkResettleResults(null);
          } else {
            void handleBulkResettle();
          }
        }}
        onCancel={() => {
          if (!bulkResettleLoading) {
            setBulkResettleOpen(false);
            setBulkResettleResults(null);
          }
        }}
      >
        <div className="space-y-3">
          {!bulkResettleResults ? (
            <>
              <p className="text-sm text-gray-300">
                Re-settle {retryableOnPage.length} retryable call(s) on this page (max 20 per request).
              </p>
              <ul className="max-h-40 overflow-y-auto text-xs font-mono text-gray-400 space-y-1">
                {retryableOnPage.map((c) => (
                  <li key={c.callId}>{c.callId}</li>
                ))}
              </ul>
            </>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="py-1 pr-2">Call ID</th>
                    <th className="py-1 pr-2">Status</th>
                    <th className="py-1">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkResettleResults.map((r) => (
                    <tr key={r.callId} className="border-b border-gray-800">
                      <td className="py-1 pr-2 font-mono text-gray-400 truncate max-w-[120px]">
                        {r.callId}
                      </td>
                      <td className="py-1 pr-2 text-gray-300">{r.status}</td>
                      <td className="py-1 text-gray-500">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default CallsPage;
