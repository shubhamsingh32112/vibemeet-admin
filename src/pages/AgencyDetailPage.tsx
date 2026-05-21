import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface AgencyInfo {
  id: string;
  email: string;
  displayName: string | null;
  referralCode: string | null;
  agencyDisabled: boolean;
  bdId: string | null;
  createdAt: string;
}

interface PendingApp {
  id: string;
  applicant?: { email?: string; phone?: string; username?: string };
  referralCodeUsed?: string;
  createdAt: string;
}

interface CreatorRow {
  id: string;
  userId: string;
  name: string;
  earningsCoins: number;
  createdAt: string;
}

type CreatorSortOption = 'earnings_desc' | 'earnings_asc' | 'name_asc' | 'newest';

const CREATOR_SORT_OPTIONS: { value: CreatorSortOption; label: string }[] = [
  { value: 'earnings_desc', label: 'Highest earning hosts first' },
  { value: 'earnings_asc', label: 'Lowest earning hosts first' },
  { value: 'name_asc', label: 'Host name (A–Z)' },
  { value: 'newest', label: 'Recently added' },
];

function sortCreators(rows: CreatorRow[], sort: CreatorSortOption): CreatorRow[] {
  const copy = [...rows];
  switch (sort) {
    case 'earnings_desc':
      return copy.sort((a, b) => b.earningsCoins - a.earningsCoins || a.name.localeCompare(b.name));
    case 'earnings_asc':
      return copy.sort((a, b) => a.earningsCoins - b.earningsCoins || a.name.localeCompare(b.name));
    case 'name_asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    case 'newest':
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    default:
      return copy;
  }
}

const AgencyDetailPage: React.FC = () => {
  const { agencyId } = useParams<{ agencyId: string }>();
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [pending, setPending] = useState<PendingApp[]>([]);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [creatorSort, setCreatorSort] = useState<CreatorSortOption>('earnings_desc');
  const [pendingWd, setPendingWd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await api.get(`/admin/agencies/${agencyId}`);
      const data = res.data.data;
      setAgency(data.agent as AgencyInfo);
      setPending((data.pendingApplications ?? []) as PendingApp[]);
      setCreators((data.creators ?? []) as CreatorRow[]);
      setPendingWd(data.pendingWithdrawalsCount ?? 0);
    } catch {
      setErr('Failed to load agency details');
      setAgency(null);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    load();
  }, [load]);

  const creatorsTableRef = React.useRef<HTMLDivElement>(null);

  const handleCreatorSortChange = (value: CreatorSortOption) => {
    setCreatorSort(value);
    requestAnimationFrame(() => {
      creatorsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const toggle = async () => {
    if (!agency) return;
    try {
      await api.patch(`/admin/agencies/${agency.id}`, { agencyDisabled: !agency.agencyDisabled });
      await load();
    } catch {
      alert('Update failed');
    }
  };

  const sortedCreators = sortCreators(creators, creatorSort);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="space-y-4">
        <Link to="/agencies" className="text-sm text-indigo-400 hover:underline">
          ← Back to agencies
        </Link>
        <p className="text-red-400 text-sm">{err || 'Agency not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/agencies" className="text-sm text-indigo-400 hover:underline">
        ← Back to agencies
      </Link>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
        <h1 className="text-2xl font-bold text-white">
          {agency.displayName?.trim() || agency.email}
        </h1>
        {agency.displayName?.trim() ? (
          <p className="text-sm text-zinc-300">
            Agency name: <span className="text-white font-medium">{agency.displayName}</span>
          </p>
        ) : null}
        <p className="text-sm text-zinc-400">{agency.email}</p>
        <p className="text-sm font-mono text-emerald-400">Referral: {agency.referralCode || '—'}</p>
        {agency.bdId && (
          <p className="text-sm text-zinc-400">
            Parent BD:{' '}
            <Link to={`/bds/${agency.bdId}`} className="text-indigo-400 hover:underline">
              View BD
            </Link>
          </p>
        )}
        <p className="text-sm text-zinc-400">Pending withdrawals: {pendingWd}</p>
        <button
          type="button"
          onClick={toggle}
          className={`px-3 py-1 rounded text-xs ${
            agency.agencyDisabled
              ? 'bg-red-900/40 text-red-300'
              : 'bg-emerald-900/40 text-emerald-300'
          }`}
        >
          {agency.agencyDisabled ? 'Disabled' : 'Active'}
        </button>
      </div>

      <section ref={creatorsTableRef} className="scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-white">Hosts / creators ({creators.length})</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="whitespace-nowrap">Sort</span>
            <select
              value={creatorSort}
              onChange={(e) => handleCreatorSortChange(e.target.value as CreatorSortOption)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white min-w-[220px]"
            >
              {CREATOR_SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Earnings (coins)</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {creators.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-zinc-500 text-center">
                    No creators assigned.
                  </td>
                </tr>
              ) : (
                sortedCreators.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-800 text-zinc-200">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3 tabular-nums">{c.earningsCoins.toLocaleString()}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Full host editing is available on the{' '}
          <Link to="/creators" className="text-indigo-400 hover:underline">
            Hosts
          </Link>{' '}
          page.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">
          Pending applications ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">No pending referrals.</p>
        ) : (
          <ul className="space-y-2 text-sm text-zinc-300">
            {pending.slice(0, 20).map((p) => (
              <li key={p.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                {p.applicant?.email || p.applicant?.username || p.applicant?.phone || p.id}
                <span className="text-zinc-500 text-xs ml-2">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AgencyDetailPage;
