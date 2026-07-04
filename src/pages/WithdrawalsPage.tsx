import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable, { type Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import MetricCard from '../components/ui/MetricCard';
import { SectionHeading } from '../components/admin/help/SectionHeading';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  adminService,
  type AdminWithdrawal,
  type WithdrawalSummary,
} from '../services/adminService';
import { useStaffRealtime } from '../contexts/StaffRealtimeContext';
import { useAdminDateRange } from '../hooks/useAdminDateRange';
import { formatDateTime } from '../utils/dateTime';

const statusVariant = (s: string) => {
  switch (s) {
    case 'pending': return 'warning' as const;
    case 'approved': return 'info' as const;
    case 'rejected': return 'danger' as const;
    case 'paid': return 'success' as const;
    default: return 'neutral' as const;
  }
};

type WithdrawalsVariant = 'creator' | 'bd' | 'agency';

type WithdrawalsPageProps = {
  embedded?: boolean;
  /** creator = host payouts (default); bd/agency = staff wallet withdrawals */
  variant?: WithdrawalsVariant;
};

const VARIANT_CONFIG: Record<
  WithdrawalsVariant,
  {
    title: string;
    subtitle: string;
    partyLabel: string;
    type: 'staff' | 'creator';
    staffRole?: 'bd' | 'agency';
  }
> = {
  creator: {
    title: 'Host withdrawals',
    subtitle: 'Approve, reject, and mark paid for creator payout requests',
    partyLabel: 'Creator',
    type: 'creator',
  },
  bd: {
    title: 'BD withdrawals',
    subtitle: 'Approve, reject, and mark paid for BD staff wallet payout requests',
    partyLabel: 'BD',
    type: 'staff',
    staffRole: 'bd',
  },
  agency: {
    title: 'Agency withdrawals',
    subtitle: 'Approve, reject, and mark paid for agency staff wallet payout requests',
    partyLabel: 'Agency',
    type: 'staff',
    staffRole: 'agency',
  },
};

function partyName(row: AdminWithdrawal, variant: WithdrawalsVariant): string {
  if (variant === 'creator') return row.creatorName;
  return row.staffDisplayName || row.staffEmail || row.creatorName || 'Staff';
}

function partyContact(row: AdminWithdrawal, variant: WithdrawalsVariant): string {
  if (variant !== 'creator') {
    return row.staffEmail || '—';
  }
  return row.creatorEmail || row.creatorPhone || '—';
}

function partyBalance(row: AdminWithdrawal, variant: WithdrawalsVariant): number {
  if (variant !== 'creator' && row.staffCurrentBalance != null) {
    return row.staffCurrentBalance;
  }
  return row.creatorCurrentBalance;
}

const WithdrawalsPage: React.FC<WithdrawalsPageProps> = ({ embedded = false, variant = 'creator' }) => {
  const config = VARIANT_CONFIG[variant];
  const { markFresh } = useStaffRealtime();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useAdminDateRange('today');
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const statusFilter = searchParams.get('status') ?? '';

  const updateListQuery = useCallback(
    (updates: { page?: number; status?: string }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (typeof updates.page === 'number' && Number.isFinite(updates.page)) {
            next.set('page', String(Math.max(1, Math.trunc(updates.page))));
          }
          if (typeof updates.status === 'string') {
            if (updates.status.trim()) next.set('status', updates.status);
            else next.delete('status');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Action modal
  const [actionTarget, setActionTarget] = useState<AdminWithdrawal | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'mark-paid' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getWithdrawals({
        status: statusFilter || undefined,
        page,
        limit: 50,
        type: config.type,
        staffRole: config.staffRole,
        from: dateRange.from,
        to: dateRange.to,
      });
      if (page > data.pagination.totalPages && data.pagination.totalPages > 0) {
        updateListQuery({ page: data.pagination.totalPages });
        return;
      }
      setWithdrawals(data.withdrawals);
      setSummary(data.summary);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      markFresh(['withdrawals']);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateRange.from, dateRange.to, markFresh, updateListQuery, config.type, config.staffRole]);

  useEffect(() => {
    load();
  }, [load]);

  const openAction = (withdrawal: AdminWithdrawal, type: 'approve' | 'reject' | 'mark-paid') => {
    setActionTarget(withdrawal);
    setActionType(type);
    setActionNotes('');
  };

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    if (actionType === 'reject' && (!actionNotes || actionNotes.trim().length < 3)) {
      alert('Rejection reason must be at least 3 characters');
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await adminService.approveWithdrawal(actionTarget.id, actionNotes || undefined);
        alert('Withdrawal approved. Coins will be deducted when marked as paid.');
      } else if (actionType === 'reject') {
        await adminService.rejectWithdrawal(actionTarget.id, actionNotes);
        alert('Withdrawal rejected.');
      } else if (actionType === 'mark-paid') {
        await adminService.markWithdrawalPaid(actionTarget.id, actionNotes || undefined);
        alert(`Withdrawal marked as paid. ${actionTarget.amount.toLocaleString()} coins deducted from ${config.partyLabel.toLowerCase()}.`);
      }
      setActionTarget(null);
      setActionType(null);
      setActionNotes('');
      load();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<AdminWithdrawal>[] = [
    {
      key: 'creatorName',
      header: config.partyLabel,
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-white font-medium text-sm">{partyName(row, variant)}</p>
          <p className="text-gray-500 text-xs">{partyContact(row, variant)}</p>
          {variant !== 'creator' && row.staffRole ? (
            <p className="text-gray-600 text-[10px] uppercase tracking-wide">{row.staffRole}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => (
        <span className="text-yellow-300 font-semibold tabular-nums">{row.amount.toLocaleString()} coins</span>
      ),
    },
    {
      key: 'creatorCurrentBalance',
      header: 'Balance',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums">{partyBalance(row, variant).toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <StatusBadge variant={statusVariant(row.status)} label={row.status.toUpperCase()} dot />
      ),
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      sortable: true,
      render: (row) => (
        <span className="text-xs tabular-nums">{formatDateTime(row.requestedAt)}</span>
      ),
    },
    {
      key: 'processedAt',
      header: 'Processed',
      render: (row) => row.processedAt ? (
        <span className="text-xs tabular-nums">{formatDateTime(row.processedAt)}</span>
      ) : (
        <span className="text-gray-600">—</span>
      ),
    },
    {
      key: 'withdrawalDetails',
      header: 'Withdrawal Details',
      render: (row) => (
        <div className="text-xs space-y-1">
          {row.name && (
            <p className="text-white"><span className="text-gray-500">Name:</span> {row.name}</p>
          )}
          {row.number && (
            <p className="text-white"><span className="text-gray-500">Phone:</span> {row.number}</p>
          )}
          {row.upi && (
            <p className="text-white"><span className="text-gray-500">UPI:</span> {row.upi}</p>
          )}
          {row.accountNumber && (
            <p className="text-white"><span className="text-gray-500">Account:</span> {row.accountNumber}</p>
          )}
          {row.ifsc && (
            <p className="text-white"><span className="text-gray-500">IFSC:</span> {row.ifsc}</p>
          )}
          {!row.name && !row.number && !row.upi && !row.accountNumber && !row.ifsc && (
            <span className="text-gray-600">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) => row.notes ? (
        <span className="text-xs text-gray-400 max-w-[200px] truncate block" title={row.notes}>{row.notes}</span>
      ) : (
        <span className="text-gray-600">—</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1.5">
          {row.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); openAction(row, 'approve'); }}
                className="px-2 py-0.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded transition"
              >
                Approve
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openAction(row, 'reject'); }}
                className="px-2 py-0.5 text-xs bg-red-700 hover:bg-red-600 text-white rounded transition"
              >
                Reject
              </button>
            </>
          )}
          {row.status === 'approved' && (
            <button
              onClick={(e) => { e.stopPropagation(); openAction(row, 'mark-paid'); }}
              className="px-2 py-0.5 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded transition"
            >
              Mark Paid
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading && withdrawals.length === 0) return <LoadingSpinner label="Loading withdrawals…" />;
  if (error)
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-4 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700">
          Retry
        </button>
      </div>
    );

  return (
    <div>
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <SectionHeading title={config.title} helpKey="finance.payouts" level={1} />
            <p className="text-xs text-gray-500 mt-0.5">{config.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard
            label="Pending"
            value={summary.pendingCount}
            variant={summary.pendingCount > 0 ? 'warning' : 'default'}
            helpKey="finance.payouts"
          />
          <MetricCard
            label="Withdrawn (30d)"
            value={summary.totalWithdrawn30d.toLocaleString()}
            subtitle="coins"
            variant="info"
            helpKey="finance.payouts"
          />
          <MetricCard
            label="Total Shown"
            value={total}
            helpKey="finance.payouts"
          />
          <MetricCard
            label="Top (30d)"
            value={summary.topWithdrawingCreators[0]?.totalWithdrawn?.toLocaleString() || '0'}
            subtitle={summary.topWithdrawingCreators[0]?.name || '—'}
            helpKey="finance.payouts"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="text-xs text-gray-400">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            updateListQuery({ status: e.target.value, page: 1 });
          }}
          className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={withdrawals}
        keyField="id"
        emptyMessage="No withdrawals found"
        searchPlaceholder="Search current page by name, email…"
        searchFields={
          variant === 'creator'
            ? ['creatorName', 'creatorEmail', 'creatorPhone']
            : ['staffDisplayName', 'staffEmail', 'creatorName', 'creatorEmail']
        }
        compact
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">{total} total withdrawals</p>
          <div className="flex gap-2">
            <button
              onClick={() => updateListQuery({ page: Math.max(1, page - 1) })}
              disabled={page === 1}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-400 self-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => updateListQuery({ page: Math.min(totalPages, page + 1) })}
              disabled={page === totalPages}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Top Withdrawing Creators */}
      {variant === 'creator' && summary && summary.topWithdrawingCreators.length > 0 && (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
            Top Withdrawing Creators (30d)
          </h4>
          <div className="space-y-2">
            {summary.topWithdrawingCreators.map((c, i) => (
              <div key={c.creatorUserId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs w-5">{i + 1}.</span>
                  <span className="text-white">{c.name}</span>
                  <span className="text-gray-500 text-xs">{c.email || ''}</span>
                </div>
                <div className="text-right">
                  <span className="text-yellow-300 font-medium tabular-nums">
                    {c.totalWithdrawn.toLocaleString()} coins
                  </span>
                  <span className="text-gray-500 text-xs ml-2">({c.withdrawalCount} requests)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Dialog */}
      <ConfirmDialog
        open={!!actionTarget && !!actionType}
        title={
          actionType === 'approve'
            ? 'Approve Withdrawal'
            : actionType === 'reject'
            ? 'Reject Withdrawal'
            : 'Mark as Paid'
        }
        message={
          actionTarget
            ? actionType === 'approve'
              ? `Approve withdrawal of ${actionTarget.amount.toLocaleString()} coins for ${partyName(actionTarget, variant)}? Coins are not deducted until you mark it as paid.`
              : actionType === 'reject'
              ? `Reject withdrawal of ${actionTarget.amount.toLocaleString()} coins for ${partyName(actionTarget, variant)}? No coins will be deducted.`
              : `Mark withdrawal of ${actionTarget.amount.toLocaleString()} coins for ${partyName(actionTarget, variant)} as paid? This will deduct ${actionTarget.amount.toLocaleString()} coins and confirms external payment was completed.`
            : ''
        }
        confirmLabel={
          actionType === 'approve'
            ? 'Approve'
            : actionType === 'reject'
            ? 'Reject'
            : 'Mark Paid & Deduct'
        }
        confirmVariant={actionType === 'reject' ? 'danger' : 'primary'}
        confirmDisabled={actionLoading || (actionType === 'reject' && actionNotes.trim().length < 3)}
        onConfirm={handleAction}
        onCancel={() => { setActionTarget(null); setActionType(null); setActionNotes(''); }}
      >
        <div className="space-y-3">
          {actionTarget && (
            <div className="text-xs space-y-1">
              <p className="text-gray-400">{config.partyLabel}: <span className="text-white">{partyName(actionTarget, variant)}</span></p>
              <p className="text-gray-400">Current Balance: <span className="text-white">{partyBalance(actionTarget, variant).toLocaleString()} coins</span></p>
              <p className="text-gray-400">Withdrawal Amount: <span className="text-yellow-300">{actionTarget.amount.toLocaleString()} coins</span></p>
              {actionType === 'mark-paid' && (
                <p className="text-gray-400">After Mark Paid: <span className="text-emerald-300">{(partyBalance(actionTarget, variant) - actionTarget.amount).toLocaleString()} coins</span></p>
              )}
              <div className="pt-2 mt-2 border-t border-gray-700">
                <p className="text-gray-500 font-semibold mb-1">Withdrawal Details:</p>
                {actionTarget.name && (
                  <p className="text-gray-400">Name: <span className="text-white">{actionTarget.name}</span></p>
                )}
                {actionTarget.number && (
                  <p className="text-gray-400">Phone: <span className="text-white">{actionTarget.number}</span></p>
                )}
                {actionTarget.upi && (
                  <p className="text-gray-400">UPI: <span className="text-white">{actionTarget.upi}</span></p>
                )}
                {actionTarget.accountNumber && (
                  <p className="text-gray-400">Account: <span className="text-white">{actionTarget.accountNumber}</span></p>
                )}
                {actionTarget.ifsc && (
                  <p className="text-gray-400">IFSC: <span className="text-white">{actionTarget.ifsc}</span></p>
                )}
              </div>
            </div>
          )}
          <textarea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder={actionType === 'reject' ? 'Rejection reason (required, min 3 chars)…' : 'Notes (optional)…'}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default WithdrawalsPage;
