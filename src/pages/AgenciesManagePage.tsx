import React, { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface AgencyRow {
  id: string;
  email: string;
  displayName: string | null;
  agencyDisabled: boolean;
  bdCount: number;
  createdAt: string;
}

const AgenciesManagePage: React.FC = () => {
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [creating, setCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

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

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErr('');
    setGeneratedPassword(null);
    try {
      const res = await api.post('/admin/agencies', {
        email,
        displayName: displayName.trim() ? displayName.trim() : undefined,
      });
      const pwd = res.data?.data?.generatedPassword as string | undefined;
      if (pwd) setGeneratedPassword(pwd);
      setEmail('');
      setDisplayName('');
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
              <th className="px-4 py-3">BD accounts</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgenciesManagePage;
