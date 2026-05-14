import React, { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface BdRow {
  id: string;
  email: string;
  displayName: string | null;
  bdDisabled: boolean;
  agencyCount: number;
  createdAt: string;
}

const BdsManagePage: React.FC = () => {
  const [bds, setBds] = useState<BdRow[]>([]);
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
      const res = await api.get('/admin/bds');
      setBds(res.data.data.bds as BdRow[]);
    } catch {
      setErr('Failed to load BD accounts');
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
      const res = await api.post('/admin/bds', {
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

  const toggle = async (id: string, bdDisabled: boolean) => {
    try {
      await api.patch(`/admin/bds/${id}`, { bdDisabled: !bdDisabled });
      await load();
    } catch {
      alert('Update failed');
    }
  };

  if (loading && bds.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">BD accounts</h1>
        <p className="text-sm text-zinc-500 mt-1">Top-tier BD organizations (super admin).</p>
      </div>

      {generatedPassword && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-amber-200 text-sm">
          One-time password for new BD: <strong className="font-mono">{generatedPassword}</strong>
        </div>
      )}

      <form onSubmit={create} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm text-white disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create BD'}
        </button>
      </form>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Agencies</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {bds.map((b) => (
              <tr key={b.id} className="border-t border-zinc-800 text-zinc-200">
                <td className="px-4 py-3">{b.email}</td>
                <td className="px-4 py-3">{b.displayName || '—'}</td>
                <td className="px-4 py-3">{b.agencyCount}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(b.id, b.bdDisabled)}
                    className={`px-2 py-1 rounded text-xs ${
                      b.bdDisabled ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/40 text-emerald-300'
                    }`}
                  >
                    {b.bdDisabled ? 'Disabled' : 'Active'}
                  </button>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(b.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BdsManagePage;
