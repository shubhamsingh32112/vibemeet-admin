import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { agencyPortalService } from '../../services/agencyPortalService';

const AgencyBdsPage: React.FC = () => {
  const [rows, setRows] = useState<
    Array<{
      id: string;
      email: string;
      displayName: string | null;
      referralCode: string | null;
      agentDisabled: boolean;
      hostCount: number;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [creating, setCreating] = useState(false);
  /** Shown once after successful create (same pattern as super admin → new agency). */
  const [createdSnapshot, setCreatedSnapshot] = useState<{
    email: string;
    generatedPassword: string;
    referralCode: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const list = await agencyPortalService.listBds();
      setRows(list);
    } catch {
      setErr('Failed to load BD accounts');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErr('');
    setCreatedSnapshot(null);
    try {
      const data = await agencyPortalService.createBd(email, displayName || undefined);
      setEmail('');
      setDisplayName('');
      setCreatedSnapshot({
        email: data.email,
        generatedPassword: data.generatedPassword,
        referralCode: data.referralCode ?? null,
      });
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

  if (loading && rows.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">BD accounts</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Add BD logins. Password is shown once — store it securely.
        </p>
      </div>

      <form
        onSubmit={create}
        className="rounded-xl border border-admin-border bg-admin-surface p-4 max-w-xl space-y-3"
      >
        <h2 className="text-lg font-semibold text-white">New BD</h2>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        {createdSnapshot ? (
          <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200 space-y-2">
            <p className="font-semibold text-emerald-100">Login details (copy now — shown once)</p>
            <p className="text-xs">
              <span className="text-zinc-400">Email</span>{' '}
              <span className="font-mono break-all text-emerald-100">{createdSnapshot.email}</span>
            </p>
            <p className="text-xs">
              <span className="block text-zinc-400 mb-0.5">One-time password</span>
              <span className="font-mono break-all">{createdSnapshot.generatedPassword}</span>
            </p>
            <p className="text-xs">
              <span className="text-zinc-400">Referral code</span>{' '}
              <span className="font-mono text-emerald-100">{createdSnapshot.referralCode ?? '—'}</span>
            </p>
          </div>
        ) : null}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          {creating ? 'Creating…' : 'Create BD'}
        </button>
      </form>

      <div className="rounded-xl border border-admin-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-admin-elevated text-left text-xs text-zinc-400 uppercase">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Referral</th>
              <th className="px-3 py-2">Hosts</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-admin-border">
                <td className="px-3 py-3 text-white">{r.email}</td>
                <td className="px-3 py-3 font-mono text-emerald-400">{r.referralCode || '—'}</td>
                <td className="px-3 py-3">{r.hostCount}</td>
                <td className="px-3 py-3">{r.agentDisabled ? 'Disabled' : 'Active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgencyBdsPage;
