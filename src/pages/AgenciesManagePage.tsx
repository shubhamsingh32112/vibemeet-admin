import React, { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface AgencyRow {
  id: string;
  email: string;
  phone: string | null;
  agencyPlace: string | null;
  displayName: string | null;
  agencyDisabled: boolean;
  bdCount: number;
  createdAt: string;
}

const REMOVE_CONFIRM_PHRASE = 'REMOVE';

const AgenciesManagePage: React.FC = () => {
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [creating, setCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<AgencyRow | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState('');
  const [removeErr, setRemoveErr] = useState('');
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/admin/agencies');
      setAgencies(res.data.data.agencies);
    } catch {
      setErr('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openRemove = (row: AgencyRow) => {
    setRemoveTarget(row);
    setRemoveConfirm('');
    setRemoveErr('');
  };

  const closeRemove = () => {
    if (removing) return;
    setRemoveTarget(null);
    setRemoveConfirm('');
    setRemoveErr('');
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    if (removeConfirm.trim() !== REMOVE_CONFIRM_PHRASE) {
      setRemoveErr(`Type ${REMOVE_CONFIRM_PHRASE} to confirm.`);
      return;
    }
    setRemoving(true);
    setRemoveErr('');
    try {
      await api.delete(`/admin/agencies/${removeTarget.id}`);
      setRemoveTarget(null);
      setRemoveConfirm('');
      await load();
    } catch (ex: unknown) {
      const msg =
        ex && typeof ex === 'object' && 'response' in ex
          ? (ex as { response?: { data?: { error?: string }; status?: number } }).response?.data?.error
          : null;
      setRemoveErr(msg || 'Remove failed');
    } finally {
      setRemoving(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErr('');
    setGeneratedPassword(null);
    try {
      const res = await api.post('/admin/agencies', {
        email,
        displayName: displayName.trim() ? displayName.trim() : undefined,
        phone: phone.trim(),
        place: place.trim(),
      });
      const pwd = res.data?.data?.generatedPassword as string | undefined;
      if (pwd) setGeneratedPassword(pwd);
      setEmail('');
      setDisplayName('');
      setPhone('');
      setPlace('');
      await load();
    } catch (ex: unknown) {
      const msg =
        ex && typeof ex === 'object' && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setErr(msg || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (id: string, agencyDisabled: boolean) => {
    try {
      await api.patch(`/admin/agencies/${id}`, { agencyDisabled: !agencyDisabled });
      await load();
    } catch {
      alert('Update failed');
    }
  };

  if (loading && agencies.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Agencies</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Create agency portal accounts. BD staff are hired under each agency from the agency dashboard.
        </p>
      </div>

      <form
        onSubmit={create}
        className="rounded-xl border border-admin-border bg-admin-surface p-4 max-w-xl space-y-3"
      >
        <h2 className="text-lg font-semibold text-white">New agency</h2>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        {generatedPassword && (
          <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
            <p className="font-semibold text-emerald-100">One-time password (copy now)</p>
            <p className="font-mono text-xs mt-1 break-all">{generatedPassword}</p>
          </div>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          required
        />
        <input
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          required
        />
        <input
          placeholder="Place (city / region)"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          className="w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          required
        />
        <input
          placeholder="Display name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
        />
        <p className="text-[11px] text-zinc-500">
          A random secure password is generated on create and shown once above.
        </p>
        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-admin-accent text-admin-base font-semibold px-4 py-2 text-sm disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create agency'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-admin-elevated text-zinc-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Place</th>
              <th className="px-4 py-3">BD accounts</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => (
              <tr key={a.id} className="border-t border-admin-border">
                <td className="px-4 py-3 text-zinc-200">
                  <span className="block">{a.email}</span>
                  {a.displayName ? (
                    <span className="text-xs text-zinc-500">{a.displayName}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-zinc-300">{a.phone ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-300">{a.agencyPlace ?? '—'}</td>
                <td className="px-4 py-3">{a.bdCount}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(a.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(a.id, a.agencyDisabled)}
                    className={`text-xs px-2 py-1 rounded ${
                      a.agencyDisabled ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/40 text-emerald-300'
                    }`}
                  >
                    {a.agencyDisabled ? 'Disabled' : 'Active'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openRemove(a)}
                    className="text-xs px-2 py-1 rounded bg-red-950/60 text-red-200 hover:bg-red-900/50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {removeTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-agency-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRemove();
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-admin-border bg-admin-surface p-5 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="remove-agency-title" className="text-lg font-semibold text-white">
              Remove agency
            </h2>
            <p className="text-sm text-zinc-400">
              This permanently deletes the agency account <span className="text-zinc-200">{removeTarget.email}</span>{' '}
              and blocks the same email or phone from being registered again. The agency user id is removed from the
              system.
            </p>
            <ul className="text-xs text-zinc-500 list-disc pl-4 space-y-1">
              <li>Removal is allowed only when BD count is zero, staff wallet balance is zero, and there are no pending
                staff payouts for this agency.</li>
              <li>If the API returns an error, resolve the condition (for example remove BD accounts first) and try
                again.</li>
            </ul>
            {removeErr ? <p className="text-red-400 text-sm">{removeErr}</p> : null}
            <label className="block text-xs text-zinc-500">
              Type <span className="font-mono text-amber-200/90">{REMOVE_CONFIRM_PHRASE}</span> to confirm
              <input
                value={removeConfirm}
                onChange={(e) => setRemoveConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
                autoComplete="off"
                placeholder={REMOVE_CONFIRM_PHRASE}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeRemove}
                disabled={removing}
                className="rounded-lg border border-admin-border px-3 py-2 text-sm text-zinc-300 hover:bg-admin-elevated disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmRemove()}
                disabled={removing}
                className="rounded-lg bg-red-900/80 text-white px-3 py-2 text-sm font-medium hover:bg-red-800 disabled:opacity-50"
              >
                {removing ? 'Removing…' : 'Remove permanently'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AgenciesManagePage;
