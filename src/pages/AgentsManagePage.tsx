import React, { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface AgentRow {
  id: string;
  email: string;
  displayName: string | null;
  referralCode: string | null;
  agentDisabled: boolean;
  pendingApplications: number;
  activeCreators: number;
  pendingWithdrawals: number;
  createdAt: string;
}

const AgentsManagePage: React.FC = () => {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/admin/agents');
      setAgents(res.data.data.agents);
    } catch {
      setErr('Failed to load agents');
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
      await api.post('/admin/agents', { email, password, displayName: displayName || undefined });
      setEmail('');
      setPassword('');
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

  const toggle = async (id: string, agentDisabled: boolean) => {
    try {
      await api.patch(`/admin/agents/${id}`, { agentDisabled: !agentDisabled });
      await load();
    } catch {
      alert('Update failed');
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Agents</h1>
        <p className="text-sm text-zinc-500 mt-1">Create recruiter accounts with referral codes and dashboard access.</p>
      </div>

      <form
        onSubmit={create}
        className="rounded-xl border border-admin-border bg-admin-surface p-4 max-w-xl space-y-3"
      >
        <h2 className="text-lg font-semibold text-white">New agent</h2>
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
          type="password"
          placeholder="Password (min 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          required
          minLength={8}
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
          {creating ? 'Creating…' : 'Create agent'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-admin-elevated text-zinc-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3" title="Referred users not yet creators">
                Await promote
              </th>
              <th className="px-4 py-3">Creators</th>
              <th className="px-4 py-3">WD pend.</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t border-admin-border">
                <td className="px-4 py-3 text-zinc-200">{a.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-emerald-400">{a.referralCode}</td>
                <td className="px-4 py-3">{a.pendingApplications}</td>
                <td className="px-4 py-3">{a.activeCreators}</td>
                <td className="px-4 py-3">{a.pendingWithdrawals}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(a.id, a.agentDisabled)}
                    className={`text-xs px-2 py-1 rounded ${
                      a.agentDisabled ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/40 text-emerald-300'
                    }`}
                  >
                    {a.agentDisabled ? 'Disabled' : 'Active'}
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

export default AgentsManagePage;
