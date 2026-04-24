import React, { useCallback, useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { agentPortalService, type AgentWithdrawalRow } from '../../services/agentPortalService';

const statusVariant = (s: string) => {
  switch (s) {
    case 'pending':
      return 'warning' as const;
    case 'approved':
      return 'info' as const;
    case 'rejected':
      return 'danger' as const;
    case 'paid':
      return 'success' as const;
    default:
      return 'neutral' as const;
  }
};

const payoutDetails = (w: AgentWithdrawalRow): string => {
  if (w.upi) return `UPI: ${w.upi}`;
  if (w.accountNumber && w.ifsc) return `A/C: ${w.accountNumber} | IFSC: ${w.ifsc}`;
  return 'Payout details missing';
};

const AgentWithdrawalsPage: React.FC = () => {
  const [rows, setRows] = useState<AgentWithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [action, setAction] = useState<{
    w: AgentWithdrawalRow;
    type: 'approve' | 'reject' | 'mark-paid';
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agentPortalService.getWithdrawals({
        status: statusFilter || undefined,
        page,
        limit: 50,
      });
      setRows(data.withdrawals);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setErr('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async () => {
    if (!action) return;
    if (action.type === 'reject' && notes.trim().length < 3) {
      alert('Reason min 3 characters');
      return;
    }
    setBusy(true);
    try {
      if (action.type === 'approve') {
        await agentPortalService.approveWithdrawal(action.w.id, notes || undefined);
      } else if (action.type === 'reject') {
        await agentPortalService.rejectWithdrawal(action.w.id, notes.trim());
      } else {
        await agentPortalService.markWithdrawalPaid(action.w.id, notes || undefined);
      }
      setAction(null);
      setNotes('');
      await load();
    } catch {
      alert('Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && rows.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
      <p className="text-sm text-zinc-500">Only payouts for creators assigned to you.</p>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        className="rounded-lg bg-admin-surface border border-admin-border text-sm text-white px-3 py-2"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="paid">Paid</option>
      </select>

      <div className="space-y-3 md:hidden">
        {rows.map((w) => (
          <div key={w.id} className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-2">
            <div className="flex justify-between items-start">
              <p className="text-white font-medium">{w.creatorName}</p>
              <StatusBadge label={w.status.toUpperCase()} variant={statusVariant(w.status)} />
            </div>
            <p className="text-sm text-zinc-400">{w.amount} coins</p>
            <p className="text-xs text-zinc-500">{payoutDetails(w)}</p>
            <p className="text-xs text-zinc-500">Name: {w.name ?? 'N/A'} | Phone: {w.number ?? 'N/A'}</p>
            {w.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAction({ w, type: 'approve' })}
                  className="flex-1 rounded-lg bg-emerald-600/90 text-white text-sm py-2"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setAction({ w, type: 'reject' })}
                  className="flex-1 rounded-lg border border-red-500/50 text-red-400 text-sm py-2"
                >
                  Reject
                </button>
              </div>
            )}
            {w.status === 'approved' && (
              <button
                type="button"
                onClick={() => setAction({ w, type: 'mark-paid' })}
                className="w-full rounded-lg bg-blue-600/90 text-white text-sm py-2"
              >
                Mark paid
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-admin-elevated text-zinc-400">
            <tr>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Payout Details</th>
              <th className="px-4 py-3 w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="border-t border-admin-border">
                <td className="px-4 py-3 text-zinc-200">{w.creatorName}</td>
                <td className="px-4 py-3">{w.amount}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={w.status.toUpperCase()} variant={statusVariant(w.status)} />
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(w.requestedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  <div>{payoutDetails(w)}</div>
                  <div>Name: {w.name ?? 'N/A'}</div>
                  <div>Phone: {w.number ?? 'N/A'}</div>
                </td>
                <td className="px-4 py-3">
                  {w.status === 'pending' && (
                    <div className="flex gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setAction({ w, type: 'approve' })}
                        className="rounded bg-emerald-600/90 text-white text-xs px-2 py-1"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setAction({ w, type: 'reject' })}
                        className="rounded border border-red-500/50 text-red-400 text-xs px-2 py-1"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {w.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => setAction({ w, type: 'mark-paid' })}
                      className="rounded bg-blue-600/90 text-white text-xs px-2 py-1"
                    >
                      Mark paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-admin-border px-3 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-zinc-500 py-1">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-admin-border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!action}
        title={
          action?.type === 'approve'
            ? 'Approve withdrawal?'
            : action?.type === 'reject'
              ? 'Reject withdrawal?'
              : 'Mark as paid?'
        }
        message={
          action?.type === 'approve'
            ? 'Coins will be debited from the creator.'
            : action?.type === 'reject'
              ? 'Provide a reason (min 3 characters).'
              : 'Record external payout completed.'
        }
        confirmLabel={action?.type === 'approve' ? 'Approve' : action?.type === 'reject' ? 'Reject' : 'Confirm'}
        confirmVariant={action?.type === 'reject' ? 'danger' : 'primary'}
        confirmDisabled={busy}
        onCancel={() => {
          setAction(null);
          setNotes('');
        }}
        onConfirm={runAction}
      >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (required for reject)"
          className="w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          rows={3}
        />
      </ConfirmDialog>
    </div>
  );
};

export default AgentWithdrawalsPage;
