import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { bdPortalService } from '../../services/bdPortalService';

const INITIAL_PASSWORDS_KEY = 'bd-agency-initial-passwords';

function loadStoredPasswords(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(INITIAL_PASSWORDS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistPasswords(map: Record<string, string>) {
  sessionStorage.setItem(INITIAL_PASSWORDS_KEY, JSON.stringify(map));
}

const BdAgenciesPage: React.FC = () => {
  const [rows, setRows] = useState<
    Array<{
      id: string;
      email: string;
      displayName: string | null;
      referralCode: string | null;
      agencyDisabled: boolean;
      staffMustChangePassword: boolean;
      hostCount: number;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [creating, setCreating] = useState(false);
  const [initialPasswords, setInitialPasswords] = useState<Record<string, string>>(loadStoredPasswords);
  const [latestPassword, setLatestPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const list = await bdPortalService.listAgencies();
      setRows(list);
    } catch {
      setErr('Failed to load agency accounts');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyPassword = async (pwd: string) => {
    try {
      await navigator.clipboard.writeText(pwd);
    } catch {
      /* ignore */
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErr('');
    setLatestPassword(null);
    try {
      const data = await bdPortalService.createAgency(email, displayName || undefined);
      setEmail('');
      setDisplayName('');
      setInitialPasswords((prev) => {
        const next = { ...prev, [data.id]: data.generatedPassword };
        persistPasswords(next);
        return next;
      });
      setLatestPassword(data.generatedPassword);
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

  const statusLabel = (r: (typeof rows)[number]) => {
    if (r.agencyDisabled) return 'Disabled';
    if (r.staffMustChangePassword) return 'Pending first login';
    return 'Active';
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
        <h1 className="text-2xl font-bold text-white">Agency accounts</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Add agency logins. Password is shown once — store it securely.
        </p>
      </div>

      <form
        onSubmit={create}
        className="rounded-xl border border-admin-border bg-admin-surface p-4 max-w-xl space-y-3"
      >
        <h2 className="text-lg font-semibold text-white">New agency</h2>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        {latestPassword && (
          <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
            <p className="font-semibold text-emerald-100">One-time password (copy now)</p>
            <p className="font-mono text-xs mt-1 break-all">{latestPassword}</p>
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
          A random secure password is generated on create and shown in the table below.
        </p>
        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-admin-accent text-admin-base font-semibold px-4 py-2 text-sm disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create agency'}
        </button>
      </form>

      <div className="rounded-xl border border-admin-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-admin-elevated text-left text-xs text-zinc-400 uppercase">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Initial password</th>
              <th className="px-3 py-2">Referral</th>
              <th className="px-3 py-2">Hosts</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pwd = initialPasswords[r.id];
              return (
                <tr key={r.id} className="border-t border-admin-border">
                  <td className="px-3 py-3 text-white">{r.email}</td>
                  <td className="px-3 py-3">
                    {pwd ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono text-xs text-emerald-300 break-all">{pwd}</span>
                        <button
                          type="button"
                          onClick={() => copyPassword(pwd)}
                          className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400 hover:text-white"
                        >
                          Copy
                        </button>
                      </span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-emerald-400">{r.referralCode || '—'}</td>
                  <td className="px-3 py-3">{r.hostCount}</td>
                  <td className="px-3 py-3">{statusLabel(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BdAgenciesPage;
