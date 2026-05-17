import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  agencyPortalService,
  type AgencyReferredUserRow,
} from '../../services/agencyPortalService';

type HostOnboardingStatus = NonNullable<AgencyReferredUserRow['hostOnboardingStatus']>;

function isPendingHostApproval(st: HostOnboardingStatus | undefined): boolean {
  return st === 'pending_agency_approval' || st === 'pending_bd_approval';
}

function canAgencyApprove(row: AgencyReferredUserRow): boolean {
  if (row.hasCreator) return false;
  const st = row.hostOnboardingStatus ?? 'none';
  return st === 'pending_agency_approval' || st === 'pending_bd_approval';
}

function hostStatusLabel(r: AgencyReferredUserRow): { text: string; className: string } {
  if (r.hasCreator) return { text: 'Host (creator)', className: 'text-emerald-400' };
  const st = r.hostOnboardingStatus ?? 'none';
  if (isPendingHostApproval(st)) return { text: 'Pending approval', className: 'text-amber-400' };
  if (st === 'approved') return { text: 'Approved — awaiting profile in app', className: 'text-sky-400' };
  if (st === 'rejected') return { text: 'Rejected', className: 'text-red-400' };
  if (st === 'none') return { text: 'Referred', className: 'text-zinc-400' };
  return { text: st, className: 'text-zinc-400' };
}

const AgencyReferredUsersPage: React.FC = () => {
  const [rows, setRows] = useState<AgencyReferredUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectErr, setRejectErr] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<AgencyReferredUserRow | null>(null);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveErr, setApproveErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agencyPortalService.getReferredUsers({ page, limit: 30 });
      setRows(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setErr('Failed to load referred users');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (row: AgencyReferredUserRow) => {
    if (!canAgencyApprove(row)) return;
    setApprovingId(row.id);
    setApproveErr('');
    try {
      await agencyPortalService.approveReferredUser(row.id);
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Approve failed');
      setApproveErr(msg);
    } finally {
      setApprovingId(null);
    }
  };

  const openReject = (row: AgencyReferredUserRow) => {
    if (!canAgencyApprove(row)) return;
    setRejectTarget(row);
    setRejectErr('');
    setRejectReason('');
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    setRejectErr('');
    try {
      await agencyPortalService.rejectReferredUser(
        rejectTarget.id,
        rejectReason.trim() ? rejectReason.trim() : undefined,
      );
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Reject failed');
      setRejectErr(msg);
    } finally {
      setRejecting(false);
    }
  };

  const renderReferredActions = (r: AgencyReferredUserRow) => {
    if (r.hasCreator && r.creatorId) {
      return (
        <Link
          to={`/agency/creators/${r.creatorId}`}
          className="text-sm text-emerald-400 border border-admin-border rounded-lg px-3 py-1.5 inline-block"
        >
          View creator
        </Link>
      );
    }

    if (canAgencyApprove(r)) {
      return (
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            disabled={approvingId === r.id}
            onClick={() => handleApprove(r)}
            className="text-sm text-sky-300 border border-sky-900/50 rounded-lg px-3 py-1.5 disabled:opacity-50"
          >
            {approvingId === r.id ? 'Approving…' : 'Approve'}
          </button>
          <button
            type="button"
            onClick={() => openReject(r)}
            className="text-sm text-red-300 border border-red-900/50 rounded-lg px-3 py-1.5"
          >
            Reject
          </button>
        </div>
      );
    }

    if ((r.hostOnboardingStatus ?? 'none') === 'rejected') {
      return <span className="text-xs text-zinc-500">No actions</span>;
    }

    return null;
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
      <div>
        <h1 className="text-2xl font-bold text-white">Referred users</h1>
        <p className="text-sm text-zinc-500 mt-1">
          People who signed up with your referral code. Approve or reject — approved users complete
          their own host profile in the app.
        </p>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}
      {approveErr && <p className="text-red-400 text-sm">{approveErr}</p>}

      <div className="hidden md:block overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm">
          <thead className="bg-admin-elevated text-zinc-400 text-left">
            <tr>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Code used</th>
              <th className="px-3 py-3">Joined</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-admin-border hover:bg-admin-elevated/40">
                <td className="px-3 py-3">
                  <p className="text-white font-medium">{r.username || r.email || r.phone || r.id}</p>
                  <p className="text-xs text-zinc-500">{r.email || r.phone || '—'}</p>
                </td>
                <td className="px-3 py-3 font-mono text-emerald-400/90">{r.referralCodeUsed || '—'}</td>
                <td className="px-3 py-3 text-zinc-400">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <span className={hostStatusLabel(r).className}>{hostStatusLabel(r).text}</span>
                </td>
                <td className="px-3 py-3">{renderReferredActions(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-2"
          >
            <p className="text-white font-medium">{r.username || r.email || r.id}</p>
            <p className="text-xs text-zinc-500 font-mono">Code: {r.referralCodeUsed || '—'}</p>
            <p className="text-xs text-zinc-400">{new Date(r.createdAt).toLocaleString()}</p>
            <p className={`text-xs ${hostStatusLabel(r).className}`}>{hostStatusLabel(r).text}</p>
            {renderReferredActions(r)}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={rejectOpen && !!rejectTarget}
        title="Reject referred user?"
        message="This will remove this user from your referred list and unlink your referral. They will remain a normal user and can apply again with your code later."
        confirmLabel={rejecting ? 'Rejecting…' : 'Reject'}
        confirmVariant="danger"
        confirmDisabled={rejecting}
        onCancel={() => {
          if (rejecting) return;
          setRejectOpen(false);
          setRejectTarget(null);
          setRejectErr('');
          setRejectReason('');
        }}
        onConfirm={submitReject}
      >
        {rejectErr ? <p className="text-red-400 text-sm">{rejectErr}</p> : null}
        <div className="mt-3">
          <label className="text-xs text-gray-400">Reason (optional)</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
            placeholder="Why are you rejecting this referral?"
          />
        </div>
      </ConfirmDialog>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
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

export default AgencyReferredUsersPage;
