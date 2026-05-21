import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MetricCard from '../components/ui/MetricCard';
import {
  adminService,
  type BlockedHostRow,
  type BlockedHostsResponse,
} from '../services/adminService';
import { formatDateTime } from '../utils/dateTime';

type SortOption = 'blocks_desc' | 'blocks_asc' | 'reports_desc' | 'name_asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'blocks_desc', label: 'Most blocks → fewest' },
  { value: 'reports_desc', label: 'Most reports → fewest' },
  { value: 'blocks_asc', label: 'Fewest blocks → most' },
  { value: 'name_asc', label: 'Host name (A–Z)' },
];

const BlockedHostsPage: React.FC = () => {
  const [data, setData] = useState<BlockedHostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>('blocks_desc');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await adminService.getBlockedHosts({ page, limit: 50, sort });
      setData(res);
    } catch {
      setErr('Failed to load blocked hosts');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setPage(1);
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner label="Loading blocked hosts…" />
      </div>
    );
  }

  const summary = data?.summary;
  const rows = data?.rows ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Blocked hosts</h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
          Hosts blocked by app users (chat / feed) and hosts reported via in-app creator reports.
          Reports also appear under{' '}
          <Link to="/support" className="text-indigo-400 hover:underline">
            Support
          </Link>
          .
        </p>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Hosts flagged" value={summary.totalHosts} />
          <MetricCard label="Total user blocks" value={summary.totalBlocks} variant="warning" />
          <MetricCard label="Total reports" value={summary.totalReports} variant="info" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-admin-border bg-admin-base px-3 py-2 text-sm text-white min-w-[200px]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-admin-elevated text-zinc-400">
            <tr>
              <th className="px-4 py-3">Host</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3 text-right">Blocks</th>
              <th className="px-4 py-3 text-right">Reports</th>
              <th className="px-4 py-3">Last report</th>
              <th className="px-4 py-3">Blocked by (sample)</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  No blocked or reported hosts yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <BlockedHostTableRow key={row.creatorId} row={row} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function BlockedHostTableRow({ row }: { row: BlockedHostRow }) {
  return (
    <tr className="border-t border-admin-border text-zinc-200">
      <td className="px-4 py-3 font-medium">
        <Link to={`/creators`} className="text-indigo-400 hover:underline">
          {row.hostName}
        </Link>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-400">
        {row.email || row.phone || row.username || '—'}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {row.blockCount > 0 ? (
          <span className="text-amber-300">{row.blockCount}</span>
        ) : (
          '0'
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {row.reportCount > 0 ? (
          <span className="text-red-300">{row.reportCount}</span>
        ) : (
          '0'
        )}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {row.lastReportedAt ? formatDateTime(row.lastReportedAt) : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[200px]">
        {row.blockedBySample.length === 0
          ? '—'
          : row.blockedBySample.map((b) => b.label).join(', ')}
      </td>
      <td className="px-4 py-3">
        <Link
          to="/support"
          className="text-xs text-indigo-400 hover:underline"
          title="View creator reports in Support"
        >
          Support →
        </Link>
      </td>
    </tr>
  );
}

export default BlockedHostsPage;
