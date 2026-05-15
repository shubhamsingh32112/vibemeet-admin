import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  agencyPortalService,
  type AgencyReferredUserRow,
  type AgencySearchUserRow,
} from '../../services/agencyPortalService';
import { uploadCreatorProfileImage } from '../../utils/firebaseStorage';
import { compressImage } from '../../utils/imageCompression';

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function rowToSearchUser(row: AgencyReferredUserRow): AgencySearchUserRow {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone,
    role: row.role,
    avatar: row.avatar,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date(row.createdAt).toISOString(),
    isCreator: row.hasCreator,
  };
}

type HostOnboardingStatus = NonNullable<AgencyReferredUserRow['hostOnboardingStatus']>;

function isPendingHostApproval(st: HostOnboardingStatus | undefined): boolean {
  return st === 'pending_agency_approval' || st === 'pending_bd_approval';
}

function canAgencyApprove(row: AgencyReferredUserRow): boolean {
  return !row.hasCreator && isPendingHostApproval(row.hostOnboardingStatus);
}

function canAgencyPromote(row: AgencyReferredUserRow): boolean {
  return !row.hasCreator && row.hostOnboardingStatus === 'approved';
}

function canAgencyReject(row: AgencyReferredUserRow): boolean {
  if (row.hasCreator) return false;
  const st = row.hostOnboardingStatus ?? 'none';
  return isPendingHostApproval(st) || st === 'approved' || st === 'none';
}

function hostStatusLabel(r: AgencyReferredUserRow): { text: string; className: string } {
  if (r.hasCreator) return { text: 'Host (creator)', className: 'text-emerald-400' };
  const st = r.hostOnboardingStatus ?? 'none';
  if (isPendingHostApproval(st)) return { text: 'Pending agency approval', className: 'text-amber-400' };
  if (st === 'approved') return { text: 'Approved — ready to promote', className: 'text-sky-400' };
  if (st === 'rejected') return { text: 'Rejected', className: 'text-red-400' };
  if (st === 'none') return { text: 'Awaiting approval', className: 'text-zinc-400' };
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

  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AgencySearchUserRow | null>(null);
  const [formName, setFormName] = useState('');
  const [formAbout, setFormAbout] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formCats, setFormCats] = useState('');
  const [formAge, setFormAge] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

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

  const submitApprove = async (row: AgencyReferredUserRow) => {
    setApprovingId(row.id);
    setErr('');
    try {
      await agencyPortalService.approveReferredUser(row.id);
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Approve failed');
      setErr(msg);
    } finally {
      setApprovingId(null);
    }
  };

  const openPromote = (row: AgencyReferredUserRow) => {
    if (!canAgencyPromote(row)) return;
    const u = rowToSearchUser(row);
    setSelectedUser(u);
    setFormName(row.username || row.email?.split('@')[0] || 'Creator');
    setFormAbout('');
    setFormPhoto('');
    setFormCats('');
    setFormAge('');
    setCreateErr('');
    setAddOpen(true);
  };

  const openReject = (row: AgencyReferredUserRow) => {
    if (row.hasCreator) return;
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

  const handleMainPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedUser) return;
    try {
      const b64 = await compressImage(file, 1024, 1024, 0.82, 350);
      const blob = await dataUrlToBlob(b64);
      const jpeg = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const tempId = `temp-add-${selectedUser.id}`;
      const url = await uploadCreatorProfileImage(jpeg, tempId);
      setFormPhoto(url);
    } catch (ex: unknown) {
      const m = ex instanceof Error ? ex.message : 'Upload failed';
      setCreateErr(m);
    }
  };

  const submitCreate = async () => {
    if (!selectedUser) return;
    if (!formName.trim() || formName.trim().length < 2) {
      setCreateErr('Name at least 2 characters');
      return;
    }
    if (formAbout.trim().length < 10) {
      setCreateErr('About at least 10 characters');
      return;
    }
    if (!formPhoto.trim()) {
      setCreateErr('Upload a main photo');
      return;
    }
    const cats = formCats
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 4);

    setCreating(true);
    setCreateErr('');
    try {
      await agencyPortalService.createAgencyCreator({
        userId: selectedUser.id,
        name: formName.trim(),
        about: formAbout.trim(),
        photo: formPhoto.trim(),
        categories: cats.length ? cats : undefined,
        ...(formAge !== '' ? { age: Number(formAge) } : {}),
      });
      setAddOpen(false);
      setSelectedUser(null);
      load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Create failed');
      setCreateErr(msg);
    } finally {
      setCreating(false);
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

    return (
      <div className="flex flex-wrap gap-2 items-center">
        {canAgencyApprove(r) && (
          <>
            <button
              type="button"
              onClick={() => submitApprove(r)}
              disabled={approvingId === r.id}
              className="text-sm bg-sky-600/90 text-white font-semibold rounded-lg px-3 py-1.5 disabled:opacity-50"
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
          </>
        )}
        {canAgencyPromote(r) && (
          <>
            <button
              type="button"
              onClick={() => openPromote(r)}
              className="text-sm bg-admin-accent/90 text-admin-base font-semibold rounded-lg px-3 py-1.5"
            >
              Promote to creator
            </button>
            <button
              type="button"
              onClick={() => openReject(r)}
              className="text-sm text-red-300 border border-red-900/50 rounded-lg px-3 py-1.5"
            >
              Reject
            </button>
          </>
        )}
        {!canAgencyApprove(r) && !canAgencyPromote(r) && canAgencyReject(r) && (
          <button
            type="button"
            onClick={() => openReject(r)}
            className="text-sm text-red-300 border border-red-900/50 rounded-lg px-3 py-1.5"
          >
            Reject
          </button>
        )}
        {(r.hostOnboardingStatus ?? 'none') === 'rejected' && (
          <span className="text-xs text-zinc-500">No actions</span>
        )}
        {(r.hostOnboardingStatus ?? 'none') === 'none' && !canAgencyApprove(r) && !canAgencyPromote(r) && (
          <span className="text-xs text-zinc-500">Approve required before promotion</span>
        )}
      </div>
    );
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
          People who signed up with your referral code. Approve each referral first, then promote to creator
          (platform default pricing applies).
        </p>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

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
        message="This will remove this user from your referred list and unlink your referral. They will remain a normal user and can’t be promoted by you unless they use your referral again."
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

      {addOpen && selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="bg-admin-surface border border-admin-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center px-4 py-3 border-b border-admin-border">
              <h2 className="text-lg font-semibold text-white">Promote to creator</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="text-zinc-400 hover:text-white min-h-10 min-w-10"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              {createErr && <p className="text-red-400 text-sm">{createErr}</p>}
              <p className="text-xs text-zinc-500">
                User: {selectedUser.username || selectedUser.email || selectedUser.id}
              </p>
              <div>
                <label className="text-xs text-zinc-500">Display name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">About (min 10 chars)</label>
                <textarea
                  value={formAbout}
                  onChange={(e) => setFormAbout(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
                />
              </div>
              <p className="text-[11px] text-zinc-500 rounded-lg border border-admin-border border-dashed px-3 py-2">
                Pricing uses the platform default for new hosts — Super Admin can change it later.
              </p>
              <div>
                <label className="text-xs text-zinc-500">Age (18–100)</label>
                <input
                  type="number"
                  value={formAge}
                  onChange={(e) =>
                    setFormAge(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Categories (comma, max 4)</label>
                <input
                  value={formCats}
                  onChange={(e) => setFormCats(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Main photo</label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-emerald-300 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleMainPhotoFile}
                    />
                    <span className="px-3 py-2 rounded-xl border border-admin-border">Upload</span>
                  </label>
                  {formPhoto ? (
                    <img
                      src={formPhoto}
                      alt=""
                      className="h-14 w-14 rounded-xl object-cover border border-admin-border"
                    />
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-admin-border">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-admin-border text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={submitCreate}
                className="px-4 py-2 rounded-xl bg-admin-accent text-admin-base font-semibold disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyReferredUsersPage;
