import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  agentPortalService,
  type AgentReferredUserRow,
  type AgentSearchUserRow,
} from '../../services/agentPortalService';
import { uploadCreatorProfileImage } from '../../utils/firebaseStorage';
import { compressImage } from '../../utils/imageCompression';
import { CREATOR_PRICE_TIERS } from '../../constants/creatorPriceTiers';

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function rowToSearchUser(row: AgentReferredUserRow): AgentSearchUserRow {
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

const AgentReferredUsersPage: React.FC = () => {
  const [rows, setRows] = useState<AgentReferredUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AgentSearchUserRow | null>(null);
  const [formName, setFormName] = useState('');
  const [formAbout, setFormAbout] = useState('');
  const [formPrice, setFormPrice] = useState(60);
  const [formPhoto, setFormPhoto] = useState('');
  const [formCats, setFormCats] = useState('');
  const [formAge, setFormAge] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agentPortalService.getReferredUsers({ page, limit: 30 });
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

  const openPromote = (row: AgentReferredUserRow) => {
    if (row.hasCreator) return;
    const u = rowToSearchUser(row);
    setSelectedUser(u);
    setFormName(row.username || row.email?.split('@')[0] || 'Creator');
    setFormAbout('');
    setFormPrice(60);
    setFormPhoto('');
    setFormCats('');
    setFormAge('');
    setCreateErr('');
    setAddOpen(true);
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
      await agentPortalService.createAgentCreator({
        userId: selectedUser.id,
        name: formName.trim(),
        about: formAbout.trim(),
        photo: formPhoto.trim(),
        price: Number(formPrice),
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
          People who signed up with your referral code. Promote them to creator when ready.
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
                  {r.hasCreator ? (
                    <span className="text-emerald-400">Creator</span>
                  ) : (
                    <span className="text-amber-400">User — not promoted</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {r.hasCreator && r.creatorId ? (
                    <Link
                      to={`/agent/creators/${r.creatorId}`}
                      className="text-sm text-emerald-400 border border-admin-border rounded-lg px-3 py-1.5 inline-block"
                    >
                      View creator
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openPromote(r)}
                      className="text-sm text-white bg-admin-accent/90 text-admin-base font-semibold rounded-lg px-3 py-1.5"
                    >
                      Promote to creator
                    </button>
                  )}
                </td>
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
            {r.hasCreator && r.creatorId ? (
              <Link
                to={`/agent/creators/${r.creatorId}`}
                className="inline-block text-sm text-emerald-400 border border-admin-border rounded-lg px-3 py-1.5"
              >
                View creator
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openPromote(r)}
                className="text-sm text-white bg-admin-accent/90 text-admin-base font-semibold rounded-lg px-3 py-1.5"
              >
                Promote to creator
              </button>
            )}
          </div>
        ))}
      </div>

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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500">Price (coins/min)</label>
                  <select
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
                  >
                    {CREATOR_PRICE_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t} coins/min
                      </option>
                    ))}
                  </select>
                </div>
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

export default AgentReferredUsersPage;
