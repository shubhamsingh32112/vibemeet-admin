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
    try {
      const data = await agencyPortalService.createBd(email, displayName || undefined);
      setEmail('');
      setDisplayName('');
      alert(
        `BD created.\nEmail: ${data.email}\nPassword (save now): ${data.generatedPassword}\nReferral: ${data.referralCode ?? '—'}`
      );
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
