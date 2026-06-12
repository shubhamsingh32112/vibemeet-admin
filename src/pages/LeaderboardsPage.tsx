import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import DataTable, { type Column } from '../components/ui/DataTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  adminService,
  type HostLeaderboardRow,
  type HostLeaderboardSort,
  type LeaderboardPeriod,
  type UserLeaderboardRow,
  type UserLeaderboardSort,
} from '../services/adminService';
import { formatDashboardMoneyFromCoins } from '../utils/dashboardInr';

const numFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const HOST_SORT_OPTIONS: { value: HostLeaderboardSort; label: string }[] = [
  { value: 'calls', label: 'Most calls' },
  { value: 'talk_time', label: 'Highest talk time' },
  { value: 'earnings', label: 'Highest earnings' },
  { value: 'gross_spend', label: 'Highest user spend (calls)' },
  { value: 'avg_duration', label: 'Longest avg call' },
];

const USER_SORT_OPTIONS: { value: UserLeaderboardSort; label: string }[] = [
  { value: 'calls', label: 'Most calls' },
  { value: 'talk_time', label: 'Highest talk time' },
  { value: 'messages', label: 'Most messages' },
  { value: 'recharge_inr', label: 'Highest recharge (INR)' },
  { value: 'recharge_coins', label: 'Most recharge coins' },
  { value: 'coins_received', label: 'Most coins received' },
  { value: 'coins_spent', label: 'Most coins spent' },
];

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const cls =
      rank === 1
        ? 'bg-amber-400/20 text-amber-200 ring-amber-400/40'
        : rank === 2
          ? 'bg-zinc-300/15 text-zinc-200 ring-zinc-400/30'
          : 'bg-orange-500/20 text-orange-200 ring-orange-500/40';
    return (
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ring-1 ${cls}`}>
        {rank}
      </span>
    );
  }
  return <span className="tabular-nums text-zinc-400 w-7 text-center inline-block">{rank}</span>;
}

function PersonCell({
  name,
  avatarUrl,
  sub,
  href,
}: {
  name: string;
  avatarUrl: string | null;
  sub?: string | null;
  href?: string;
}) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  const inner = (
    <div className="flex min-w-0 items-center gap-2">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-100">{name}</p>
        {sub ? <p className="truncate text-[10px] text-zinc-500">{sub}</p> : null}
      </div>
    </div>
  );
  if (href) {
    return (
      <Link to={href} className="hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

const hostColumns: Column<HostLeaderboardRow>[] = [
  {
    key: 'rank',
    header: '#',
    width: '48px',
    render: (r) => <RankBadge rank={r.rank} />,
  },
  {
    key: 'host',
    header: 'Host',
    render: (r) => (
      <PersonCell
        name={r.hostName}
        avatarUrl={r.avatarUrl}
        sub={r.creatorId ? `Creator · ${r.creatorId.slice(-6)}` : null}
        href="/creators"
      />
    ),
  },
  {
    key: 'calls',
    header: 'Calls',
    sortable: true,
    getValue: (r) => r.callCount,
    render: (r) => <span className="tabular-nums">{numFmt.format(r.callCount)}</span>,
  },
  {
    key: 'talk',
    header: 'Talk time',
    sortable: true,
    getValue: (r) => r.talkSeconds,
    render: (r) => (
      <span className="tabular-nums text-zinc-200" title={`${r.talkMinutes} min`}>
        {formatDuration(r.talkSeconds)}
      </span>
    ),
  },
  {
    key: 'avg',
    header: 'Avg call',
    sortable: true,
    getValue: (r) => r.avgCallDurationSec,
    render: (r) => <span className="tabular-nums text-zinc-400">{formatDuration(r.avgCallDurationSec)}</span>,
  },
  {
    key: 'earnings',
    header: 'Earnings',
    sortable: true,
    getValue: (r) => r.earningsCoins,
    render: (r) => {
      const m = formatDashboardMoneyFromCoins(r.earningsCoins);
      return <span className="tabular-nums text-emerald-300/90">{m.text}</span>;
    },
  },
  {
    key: 'gross',
    header: 'User spend',
    sortable: true,
    getValue: (r) => r.grossSpendCoins,
    render: (r) => {
      const m = formatDashboardMoneyFromCoins(r.grossSpendCoins);
      return <span className="tabular-nums text-violet-300/90">{m.text}</span>;
    },
  },
  {
    key: 'lifetime',
    header: 'Lifetime earn',
    sortable: true,
    getValue: (r) => r.lifetimeEarningsCoins,
    render: (r) => (
      <span className="tabular-nums text-zinc-400">{numFmt.format(r.lifetimeEarningsCoins)} coins</span>
    ),
  },
];

const userColumns: Column<UserLeaderboardRow>[] = [
  {
    key: 'rank',
    header: '#',
    width: '48px',
    render: (r) => <RankBadge rank={r.rank} />,
  },
  {
    key: 'user',
    header: 'User',
    render: (r) => (
      <PersonCell
        name={r.label}
        avatarUrl={r.avatarUrl}
        sub={r.email || r.phone}
        href="/users"
      />
    ),
  },
  {
    key: 'calls',
    header: 'Calls',
    sortable: true,
    getValue: (r) => r.callCount,
    render: (r) => <span className="tabular-nums">{numFmt.format(r.callCount)}</span>,
  },
  {
    key: 'talk',
    header: 'Talk time',
    sortable: true,
    getValue: (r) => r.talkSeconds,
    render: (r) => <span className="tabular-nums">{formatDuration(r.talkSeconds)}</span>,
  },
  {
    key: 'messages',
    header: 'Messages',
    sortable: true,
    getValue: (r) => r.totalMessages,
    render: (r) => (
      <span className="tabular-nums" title={`${r.freeMessages} free · ${r.paidMessages} paid`}>
        {numFmt.format(r.totalMessages)}
        <span className="text-zinc-500 text-[10px] ml-1">
          ({r.paidMessages} paid)
        </span>
      </span>
    ),
  },
  {
    key: 'rechargeInr',
    header: 'Recharge (INR)',
    sortable: true,
    getValue: (r) => r.rechargeInr,
    render: (r) => (
      <span className="tabular-nums text-amber-200/90">{inrFmt.format(r.rechargeInr)}</span>
    ),
  },
  {
    key: 'rechargeCoins',
    header: 'Recharge coins',
    sortable: true,
    getValue: (r) => r.rechargeCoins,
    render: (r) => <span className="tabular-nums">{numFmt.format(r.rechargeCoins)}</span>,
  },
  {
    key: 'received',
    header: 'Coins received',
    sortable: true,
    getValue: (r) => r.coinsReceived,
    render: (r) => <span className="tabular-nums text-emerald-300/80">{numFmt.format(r.coinsReceived)}</span>,
  },
  {
    key: 'spent',
    header: 'Coins spent',
    sortable: true,
    getValue: (r) => r.coinsSpent,
    render: (r) => (
      <span className="tabular-nums text-rose-300/80" title={`${r.coinsSpentOnCalls} on calls`}>
        {numFmt.format(r.coinsSpent)}
      </span>
    ),
  },
  {
    key: 'wallet',
    header: 'Wallet',
    sortable: true,
    getValue: (r) => r.walletCoins,
    render: (r) => <span className="tabular-nums text-zinc-300">{numFmt.format(r.walletCoins)}</span>,
  },
];

const LeaderboardsPage: React.FC = () => {
  const [tab, setTab] = useState<'hosts' | 'users'>('hosts');
  const [period, setPeriod] = useState<LeaderboardPeriod>('30d');
  const [hostSort, setHostSort] = useState<HostLeaderboardSort>('earnings');
  const [userSort, setUserSort] = useState<UserLeaderboardSort>('recharge_inr');
  const [hostRows, setHostRows] = useState<HostLeaderboardRow[]>([]);
  const [userRows, setUserRows] = useState<UserLeaderboardRow[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'hosts') {
        const data = await adminService.getLeaderboardHosts({
          period,
          sort: hostSort,
          limit: 100,
          cached: true,
        });
        setHostRows(data.rows);
        setNote(data.note ?? '');
      } else {
        const data = await adminService.getLeaderboardUsers({
          period,
          sort: userSort,
          limit: 100,
        });
        setUserRows(data.rows);
        setNote(data.note ?? '');
      }
    } catch {
      setError('Failed to load leaderboard');
      setHostRows([]);
      setUserRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab, period, hostSort, userSort]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 1_800_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-7 w-7 text-amber-400" />
            Leaderboards
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            Rank hosts and end-users by calls, talk time, revenue, messages, and wallet activity.
            Host rankings refresh every 30 minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            Period
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
              className="rounded-lg border border-admin-border bg-admin-base px-3 py-2 text-sm text-white"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {tab === 'hosts' ? (
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              Rank by
              <select
                value={hostSort}
                onChange={(e) => setHostSort(e.target.value as HostLeaderboardSort)}
                className="rounded-lg border border-admin-border bg-admin-base px-3 py-2 text-sm text-white min-w-[200px]"
              >
                {HOST_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              Rank by
              <select
                value={userSort}
                onChange={(e) => setUserSort(e.target.value as UserLeaderboardSort)}
                className="rounded-lg border border-admin-border bg-admin-base px-3 py-2 text-sm text-white min-w-[200px]"
              >
                {USER_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-admin-border bg-admin-surface/50 p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('hosts')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'hosts' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Hosts
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'users' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Users
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {note && <p className="text-xs text-zinc-500">{note}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Loading leaderboard…" />
        </div>
      ) : tab === 'hosts' ? (
        <DataTable
          columns={hostColumns}
          data={hostRows}
          keyField="hostUserId"
          searchPlaceholder="Search hosts…"
          searchFields={['hostName']}
          emptyMessage="No host activity in this period"
          maxHeight="70vh"
        />
      ) : (
        <DataTable
          columns={userColumns}
          data={userRows}
          keyField="userId"
          searchPlaceholder="Search users…"
          searchFields={['label', 'email', 'phone']}
          emptyMessage="No user activity in this period"
          maxHeight="70vh"
        />
      )}
    </div>
  );
};

export default LeaderboardsPage;
