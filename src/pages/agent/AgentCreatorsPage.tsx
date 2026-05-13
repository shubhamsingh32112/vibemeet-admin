import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  agentPortalService,
  type AgentCreatorRow,
  type AgentCreatorsPeriod,
  type AgentSearchUserRow,
} from '../../services/agentPortalService';

const PERIODS: { value: AgentCreatorsPeriod; label: string }[] = [
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

function periodColumnLabel(p: AgentCreatorsPeriod): string {
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

const AgentCreatorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AgentCreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [period, setPeriod] = useState<AgentCreatorsPeriod>('today');
  const [sort, setSort] = useState('talkMinutesPeriod');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const [addOpen, setAddOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<AgentSearchUserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AgentSearchUserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AgentCreatorRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agentPortalService.getCreators({
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

  const runSearch = async () => {
    setSearching(true);
    setCreateErr('');
    try {
      const users = await agentPortalService.searchUsersForAgent(searchQ.trim(), 30);
      setSearchResults(users);
    } catch {
      setCreateErr('Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const openAdd = () => {
    setAddOpen(true);
    setSelectedUser(null);
    setSearchQ('');
    setSearchResults([]);
    setCreateErr('');
  };

  const submitCreate = async () => {
    if (!selectedUser) {
      setCreateErr('Select a user');
      return;
    }

    setCreating(true);
    setCreateErr('');
    try {
      const { creator } = await agentPortalService.createAgentCreator({
        userId: selectedUser.id,
      });
      setAddOpen(false);
      navigate(`/agent/creators/${creator.id}/edit`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Promote failed');
      setCreateErr(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (c: AgentCreatorRow) => {
    setDeleteTarget(c);
    setDeleteErr('');
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteErr('');
    try {
      await agentPortalService.deleteCreator(deleteTarget.id);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Creators</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-admin-accent text-admin-base font-semibold px-4 py-2.5 text-sm w-fit"
        >
          + Promote to host
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs text-zinc-500 flex items-center gap-2">
          Period
          <select
            value={period}
            onChange={(e) => {
              setPage(1);
              setPeriod(e.target.value as AgentCreatorsPeriod);
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
            <option value="desc">High → low</option>
            <option value="asc">Low → high</option>
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
            <p className="text-white font-medium">{c.name}</p>
            <p className="text-xs text-zinc-500">
              @{c.username || '—'} · {c.availability === 'online' ? '🟢 online' : '⚫ busy'} · coins{' '}
              {c.coins ?? '—'}
            </p>
            <p className="text-xs text-zinc-400">
              Talk ({pl}): {c.periodTalkMinutes}m · Earned: {c.periodCoinsEarned} · Calls:{' '}
              {c.periodCallCount}
            </p>
            {c.pendingWithdrawal && (
              <p className="text-xs text-amber-400">Withdrawal pending: {c.pendingWithdrawal.amount}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/agent/creators/${c.id}`}
                className="text-sm text-emerald-400 border border-admin-border rounded-lg px-3 py-1.5"
              >
                View
              </Link>
              <Link
                to={`/agent/creators/${c.id}/edit`}
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
                <td className="px-3 py-3 text-white font-medium">{c.name}</td>
                <td className="px-3 py-3 text-zinc-400">{c.username || '—'}</td>
                <td className="px-3 py-3">
                  <span className={c.availability === 'online' ? 'text-emerald-400' : 'text-zinc-500'}>
                    {c.availability === 'online' ? 'Online' : 'Busy'}
                  </span>
                </td>
                <td className="px-3 py-3">{c.coins ?? '—'}</td>
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
                    '—'
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Link
                      to={`/agent/creators/${c.id}`}
                      className="text-emerald-400 hover:underline whitespace-nowrap"
                    >
                      View
                    </Link>
                    <span className="text-zinc-600">·</span>
                    <Link
                      to={`/agent/creators/${c.id}/edit`}
                      className="text-zinc-300 hover:underline whitespace-nowrap"
                    >
                      Edit
                    </Link>
                    <span className="text-zinc-600">·</span>
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
        confirmLabel={deleting ? 'Removing…' : 'Remove'}
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

      {addOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="bg-admin-surface border border-admin-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center px-4 py-3 border-b border-admin-border">
              <h2 className="text-lg font-semibold text-white">Promote to host</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="text-zinc-400 hover:text-white min-h-10 min-w-10"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              {createErr && <p className="text-red-400 text-sm">{createErr}</p>}
              <div>
                <label className="text-xs text-zinc-500">
                  Find referred user (must be BD-approved for onboarding)
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Username, email, or phone"
                    className="flex-1 rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    disabled={searching}
                    onClick={runSearch}
                    className="rounded-lg border border-admin-border px-3 py-2 text-sm text-white"
                  >
                    {searching ? '…' : 'Search'}
                  </button>
                </div>
                <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {searchResults.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          selectedUser?.id === u.id
                            ? 'bg-admin-accent/20 border border-admin-accent text-white'
                            : 'bg-admin-base border border-admin-border text-zinc-300'
                        }`}
                      >
                        {u.username || u.email || u.phone || u.id} ({u.id.slice(-6)})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedUser && (
                <p className="text-xs text-zinc-400 rounded-lg border border-admin-border border-dashed px-3 py-2">
                  A starter host profile will be created. They complete display name, about, photo, and categories in
                  the app. Per-minute price uses the platform default until changed.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-admin-border">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-admin-border text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating || !selectedUser}
                onClick={submitCreate}
                className="px-4 py-2 rounded-xl bg-admin-accent text-admin-base font-semibold disabled:opacity-50"
              >
                {creating ? 'Promoting…' : 'Promote to host'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCreatorsPage;
