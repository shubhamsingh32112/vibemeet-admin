import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  agencyPortalService,
  type AgencyCreatorRow,
  type AgencyCreatorsPeriod,
} from '../../services/agencyPortalService';

const PERIODS: { value: AgencyCreatorsPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const SORTS: { value: string; label: string }[] = [
  { value: 'talkMinutesPeriod', label: 'Talk time (period)' },
  { value: 'earningsPeriod', label: 'Earnings (period)' },
  { value: 'callsPeriod', label: 'Calls (period)' },
  { value: 'name', label: 'Name' },
  { value: 'username', label: 'Username' },
  { value: 'coins', label: 'Coins' },
  { value: 'earningsCoins', label: 'Lifetime earnings' },
  { value: 'allTimeTalkMinutes', label: 'All-time talk' },
  { value: 'online', label: 'Online first' },
  { value: 'updatedAt', label: 'Updated' },
];

function periodColumnLabel(p: AgencyCreatorsPeriod): string {
  switch (p) {
    case 'today':
      return 'Today';
    case '7d':
      return '7d';
    case '30d':
      return '30d';
    default:
      return 'All';
  }
}

const AgencyCreatorsPage: React.FC = () => {
  const [rows, setRows] = useState<AgencyCreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [period, setPeriod] = useState<AgencyCreatorsPeriod>('today');
  const [sort, setSort] = useState('talkMinutesPeriod');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AgencyCreatorRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agencyPortalService.getCreators({
        page,
        limit: 30,
        period,
        sort,
        dir,
      });
      setRows(data.creators);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setErr('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, period, sort, dir]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (c: AgencyCreatorRow) => {
    setDeleteTarget(c);
    setDeleteErr('');
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteErr('');
    try {
      await agencyPortalService.deleteCreator(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Delete failed';
      setDeleteErr(msg);
    } finally {
      setDeleting(false);
    }
  };

  const pl = periodColumnLabel(period);

  if (loading && rows.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Creators</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs text-zinc-500 flex items-center gap-2">
          Period
          <select
            value={period}
            onChange={(e) => {
              setPage(1);
              setPeriod(e.target.value as AgencyCreatorsPeriod);
            }}
            className="rounded-lg bg-admin-base border border-admin-border text-white text-sm px-2 py-1.5"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-500 flex items-center gap-2">
          Sort by
          <select
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value);
            }}
            className="rounded-lg bg-admin-base border border-admin-border text-white text-sm px-2 py-1.5"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-500 flex items-center gap-2">
          Direction
          <select
            value={dir}
            onChange={(e) => {
              setPage(1);
              setDir(e.target.value as 'asc' | 'desc');
            }}
            className="rounded-lg bg-admin-base border border-admin-border text-white text-sm px-2 py-1.5"
          >
            <option value="desc">High â†’ low</option>
            <option value="asc">Low â†’ high</option>
          </select>
        </label>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      <div className="space-y-2 md:hidden">
        {rows.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              {c.avatarUrl || c.photo ? (
                <img
                  src={c.avatarUrl || c.photo || ''}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm text-zinc-400">
                  {c.name.charAt(0)}
                </div>
              )}
              <p className="text-white font-medium">{c.name}</p>
            </div>
            <p className="text-xs text-zinc-500">
              @{c.username || 'â€”'} Â· {c.availability === 'online' ? 'ðŸŸ¢ online' : 'âš« busy'} Â· coins{' '}
              {c.coins ?? 'â€”'}
            </p>
            <p className="text-xs text-zinc-400">
              Talk ({pl}): {c.periodTalkMinutes}m Â· Earned: {c.periodCoinsEarned} Â· Calls:{' '}
              {c.periodCallCount}
            </p>
            {c.pendingWithdrawal && (
              <p className="text-xs text-amber-400">Withdrawal pending: {c.pendingWithdrawal.amount}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/agency/creators/${c.id}`}
                className="text-sm text-emerald-400 border border-admin-border rounded-lg px-3 py-1.5"
              >
                View
              </Link>
              <Link
                to={`/agency/creators/${c.id}/edit`}
                className="text-sm text-white border border-admin-border rounded-lg px-3 py-1.5"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(c)}
                className="text-sm text-red-400 border border-red-900/50 rounded-lg px-3 py-1.5"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm">
          <thead className="bg-admin-elevated text-zinc-400 text-left">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Coins</th>
              <th className="px-3 py-3">Talk ({pl})</th>
              <th className="px-3 py-3">Earned ({pl})</th>
              <th className="px-3 py-3">Calls ({pl})</th>
              <th className="px-3 py-3">All-time talk</th>
              <th className="px-3 py-3">WD</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-admin-border hover:bg-admin-elevated/40">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {c.avatarUrl || c.photo ? (
                      <img
                        src={c.avatarUrl || c.photo || ''}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-white font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-zinc-400">{c.username || 'â€”'}</td>
                <td className="px-3 py-3">
                  <span className={c.availability === 'online' ? 'text-emerald-400' : 'text-zinc-500'}>
                    {c.availability === 'online' ? 'Online' : 'Busy'}
                  </span>
                </td>
                <td className="px-3 py-3">{c.coins ?? 'â€”'}</td>
                <td className="px-3 py-3">{c.periodTalkMinutes}m</td>
                <td className="px-3 py-3">{c.periodCoinsEarned}</td>
                <td className="px-3 py-3">{c.periodCallCount}</td>
                <td className="px-3 py-3">{c.allTimeTalkMinutes}m</td>
                <td className="px-3 py-3">
                  {c.pendingWithdrawal ? (
                    <span className="text-amber-400" title={c.pendingWithdrawal.requestedAt}>
                      {c.pendingWithdrawal.amount}
                    </span>
                  ) : (
                    'â€”'
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Link
                      to={`/agency/creators/${c.id}`}
                      className="text-emerald-400 hover:underline whitespace-nowrap"
                    >
                      View
                    </Link>
                    <span className="text-zinc-600">Â·</span>
                    <Link
                      to={`/agency/creators/${c.id}/edit`}
                      className="text-zinc-300 hover:underline whitespace-nowrap"
                    >
                      Edit
                    </Link>
                    <span className="text-zinc-600">Â·</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="text-red-400 hover:underline whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-admin-border px-3 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-zinc-500 py-1">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-admin-border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen && !!deleteTarget}
        title="Remove creator profile?"
        message={
          deleteTarget
            ? `This will permanently remove the creator profile for "${deleteTarget.name}". The account will be downgraded back to a regular user.`
            : 'This will permanently remove the creator profile. The account will be downgraded back to a regular user.'
        }
        confirmLabel={deleting ? 'Removingâ€¦' : 'Remove'}
        confirmVariant="danger"
        confirmDisabled={deleting}
        onCancel={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
          setDeleteErr('');
        }}
        onConfirm={submitDelete}
      >
        {deleteErr ? <p className="text-red-400 text-sm">{deleteErr}</p> : null}
      </ConfirmDialog>
    </div>
  );
};

export default AgencyCreatorsPage;
