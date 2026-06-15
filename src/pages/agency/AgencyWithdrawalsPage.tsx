import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { agencyPortalService, type AgencyWithdrawalRow } from '../../services/agencyPortalService';
import { formatDateTime } from '../../utils/dateTime';

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

const payoutDetails = (w: AgencyWithdrawalRow): string => {
  if (w.upi) return `UPI: ${w.upi}`;
  if (w.accountNumber && w.ifsc) return `A/C: ${w.accountNumber} | IFSC: ${w.ifsc}`;
  return 'Payout details missing';
};

const AgencyWithdrawalsPage: React.FC = () => {
  const [rows, setRows] = useState<AgencyWithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agencyPortalService.getWithdrawals({
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
      <p className="text-sm text-zinc-500">
        View-only list for creators assigned to your agency. Approve, reject, and payout actions are handled by super
        admin.
      </p>
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
            <p className="text-xs text-zinc-500">Requested: {formatDateTime(w.requestedAt)}</p>
            {w.processedAt ? (
              <p className="text-xs text-zinc-500">Processed: {formatDateTime(w.processedAt)}</p>
            ) : null}
            {w.notes ? <p className="text-xs text-zinc-500">Notes: {w.notes}</p> : null}
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
              <th className="px-4 py-3">Processed</th>
              <th className="px-4 py-3">Payout details</th>
              <th className="px-4 py-3">Notes</th>
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
                <td className="px-4 py-3 text-zinc-500 text-xs">{formatDateTime(w.requestedAt)}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {w.processedAt ? formatDateTime(w.processedAt) : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  <div>{payoutDetails(w)}</div>
                  <div>Name: {w.name ?? 'N/A'}</div>
                  <div>Phone: {w.number ?? 'N/A'}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{w.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && !loading ? (
        <p className="text-sm text-zinc-500 text-center py-8">No withdrawal requests for your creators.</p>
      ) : null}

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
    </div>
  );
};

export default AgencyWithdrawalsPage;
