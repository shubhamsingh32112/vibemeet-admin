import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  HOST_COUNT_SORT_OPTIONS,
  agencyRowLabel,
  sortByHostCount,
  type HostCountSortOption,
} from '../lib/bdAgencySort';

interface BdAgencyRow {
  id: string;
  email: string;
  displayName: string | null;
  referralCode: string | null;
  agencyDisabled: boolean;
  hostCount: number;
  createdAt: string;
}

interface BdDetail {
  id: string;
  email: string;
  phone: string | null;
  agencyPlace: string | null;
  displayName: string | null;
  bdDisabled: boolean;
  agencyCount?: number;
  totalHostCount?: number;
  createdAt: string;
  updatedAt?: string;
}

const BdDetailPage: React.FC = () => {
  const { bdId } = useParams<{ bdId: string }>();
  const [bd, setBd] = useState<BdDetail | null>(null);
  const [agencies, setAgencies] = useState<BdAgencyRow[]>([]);
  const [agencySort, setAgencySort] = useState<HostCountSortOption>('hosts_desc');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  const handleSortChange = (value: HostCountSortOption) => {
    setAgencySort(value);
    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const load = useCallback(async () => {
    if (!bdId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await api.get(`/admin/bds/${bdId}`);
      const data = res.data.data;
      setBd(data.agency as BdDetail);
      setAgencies((data.bds ?? []) as BdAgencyRow[]);
    } catch {
      setErr('Failed to load BD details');
      setBd(null);
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  }, [bdId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    if (!bd) return;
    try {
      await api.patch(`/admin/bds/${bd.id}`, { bdDisabled: !bd.bdDisabled });
      await load();
    } catch {
      alert('Update failed');
    }
  };

  const sortedAgencies = sortByHostCount(agencies, agencySort, (a) =>
    agencyRowLabel(a.displayName, a.email)
  );

  const totalHosts =
    bd?.totalHostCount ??
    agencies.reduce((s, a) => s + a.hostCount, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!bd) {
    return (
      <div className="space-y-4">
        <Link to="/bds" className="text-sm text-indigo-400 hover:underline">
          ← Back to BDs
        </Link>
        <p className="text-red-400 text-sm">{err || 'BD not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/bds" className="text-sm text-indigo-400 hover:underline">
        ← Back to BDs
      </Link>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
        <h1 className="text-2xl font-bold text-white">
          {bd.displayName?.trim() || bd.email}
        </h1>
        {bd.displayName?.trim() ? (
          <p className="text-sm text-zinc-300">
            BD name: <span className="text-white font-medium">{bd.displayName}</span>
          </p>
        ) : null}
        <p className="text-sm text-zinc-400">{bd.email}</p>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
          <span>Phone: {bd.phone || '—'}</span>
          <span>Place: {bd.agencyPlace || '—'}</span>
          <span>Agencies: {bd.agencyCount ?? agencies.length}</span>
          <span className="text-emerald-300/90 font-medium">
            Hosts (all agencies): {totalHosts.toLocaleString()}
          </span>
        </div>
        <button
          type="button"
          onClick={toggle}
          className={`px-3 py-1 rounded text-xs ${
            bd.bdDisabled ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/40 text-emerald-300'
          }`}
        >
          {bd.bdDisabled ? 'Disabled' : 'Active'}
        </button>
      </div>

      <section ref={tableRef} className="scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-white">Agencies under this BD</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="whitespace-nowrap">Sort</span>
            <select
              value={agencySort}
              onChange={(e) => handleSortChange(e.target.value as HostCountSortOption)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white min-w-[200px]"
            >
              {HOST_COUNT_SORT_OPTIONS.map((o) => (
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
                <th className="px-4 py-3 text-left">Agency name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Hosts</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedAgencies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-zinc-500 text-center">
                    No agencies assigned to this BD.
                  </td>
                </tr>
              ) : (
                sortedAgencies.map((a) => (
                  <tr key={a.id} className="border-t border-zinc-800 text-zinc-200">
                    <td className="px-4 py-3 font-medium">
                      <Link to={`/agencies/${a.id}`} className="text-indigo-400 hover:underline">
                        {a.displayName?.trim() || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/agencies/${a.id}`}
                        className="text-indigo-400/90 hover:underline text-xs"
                      >
                        {a.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400">
                      {a.referralCode || '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{a.hostCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          a.agencyDisabled
                            ? 'bg-red-900/40 text-red-300'
                            : 'bg-emerald-900/40 text-emerald-300'
                        }`}
                      >
                        {a.agencyDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default BdDetailPage;
