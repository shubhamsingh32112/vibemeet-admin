import * as React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import api from '../../../config/api';
import { adminService, type CreatorPerformance } from '../../../services/adminService';
import {
  fetchDashboardLiveCalls,
  fetchDashboardUsersOnline,
  type DashboardOverview,
} from '../../../services/dashboardApi';
import StatusBadge from '../../ui/StatusBadge';
import LoadingSpinner from '../../ui/LoadingSpinner';

export type CommandCenterKpiKind =
  | 'live_calls'
  | 'users_online'
  | 'hosts_online'
  | 'hosts_on_call'
  | 'hosts_offline'
  | 'agencies'
  | 'bds'
  | 'pending_payouts'
  | 'call_minutes';

type PayoutRow = {
  id: string;
  userLabel: string;
  role: string;
  amount: number;
  requestedAt: string;
  status: string;
};

type CallAnalyticsSnapshot = {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgCallDurationSec: number;
  totalMinutes?: number;
  dailyVolume?: Array<{ date: string; calls: number }>;
};

type AgencyRow = {
  id: string;
  email: string;
  displayName: string | null;
  activeCreators: number;
  agencyDisabled: boolean;
};

type BdRow = {
  id: string;
  email: string;
  displayName: string | null;
  agencyCount: number;
  totalHostCount: number;
  bdDisabled: boolean;
};

type LiveCallRow = {
  callId: string;
  hostName: string;
  hostId: string | null;
  callerName: string;
  durationSeconds: number;
  revenueCoins: number;
  startedAt: string;
};

type OnlineUserRow = {
  id: string;
  firebaseUid: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
  avatar: string | null;
};

type CommandCenterKpiModalProps = {
  open: boolean;
  kind: CommandCenterKpiKind | null;
  onClose: () => void;
  overview?: DashboardOverview | null;
  payoutRows?: PayoutRow[];
  callAnalytics?: CallAnalyticsSnapshot | null;
  rangeLabel?: string;
};

const META: Record<
  CommandCenterKpiKind,
  { title: string; description: string; viewAllHref?: string; viewAllLabel?: string }
> = {
  live_calls: {
    title: 'Live calls (5m proxy)',
    description:
      'Recent creator-side call activity in the last 5 minutes. Count on the KPI card is a realtime proxy, not exact concurrent calls.',
    viewAllHref: '/users/calls',
    viewAllLabel: 'Open call logs',
  },
  users_online: {
    title: 'Users online (5m)',
    description: 'Fans with socket activity in the last 5 minutes.',
    viewAllHref: '/users/analytics',
    viewAllLabel: 'Open user analytics',
  },
  hosts_online: {
    title: 'Hosts online',
    description: 'Hosts currently available for calls (Redis live presence).',
    viewAllHref: '/hosts/all?presence=online',
    viewAllLabel: 'Open all hosts (online)',
  },
  hosts_on_call: {
    title: 'Hosts on call',
    description: 'Hosts in an active video call right now.',
    viewAllHref: '/hosts/all?presence=on_call',
    viewAllLabel: 'Open all hosts (on call)',
  },
  hosts_offline: {
    title: 'Hosts offline',
    description: 'Hosts not available for calls.',
    viewAllHref: '/hosts/all?presence=offline',
    viewAllLabel: 'Open all hosts (offline)',
  },
  agencies: {
    title: 'Agencies',
    description: 'Registered agency accounts on the platform.',
    viewAllHref: '/hosts/agencies',
    viewAllLabel: 'Manage agencies',
  },
  bds: {
    title: 'Business developers',
    description: 'BD accounts managing agencies and host recruitment.',
    viewAllHref: '/hosts/bds',
    viewAllLabel: 'Manage BDs',
  },
  pending_payouts: {
    title: 'Pending payouts',
    description: 'Withdrawal requests awaiting admin action.',
    viewAllHref: '/finance/payouts',
    viewAllLabel: 'Open finance payouts',
  },
  call_minutes: {
    title: 'Call minutes',
    description: 'Call volume and duration for the selected header date range.',
    viewAllHref: '/users/calls',
    viewAllLabel: 'Open call logs',
  },
};

function presenceBadge(status?: string) {
  if (status === 'online') return <StatusBadge variant="online" label="Online" dot />;
  if (status === 'on_call') return <StatusBadge variant="warning" label="On call" dot />;
  return <StatusBadge variant="offline" label="Offline" dot />;
}

export const CommandCenterKpiModal: React.FC<CommandCenterKpiModalProps> = ({
  open,
  kind,
  onClose,
  overview,
  payoutRows = [],
  callAnalytics,
  rangeLabel,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [hosts, setHosts] = React.useState<CreatorPerformance[]>([]);
  const [hostTotal, setHostTotal] = React.useState(0);
  const [liveCalls, setLiveCalls] = React.useState<LiveCallRow[]>([]);
  const [liveNote, setLiveNote] = React.useState<string | undefined>();
  const [onlineUsers, setOnlineUsers] = React.useState<OnlineUserRow[]>([]);
  const [onlineUsersTotal, setOnlineUsersTotal] = React.useState(0);
  const [onlineUsersNote, setOnlineUsersNote] = React.useState<string | undefined>();
  const [agencies, setAgencies] = React.useState<AgencyRow[]>([]);
  const [bds, setBds] = React.useState<BdRow[]>([]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open || !kind) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      setHosts([]);
      setHostTotal(0);
      setLiveCalls([]);
      setOnlineUsers([]);
      setOnlineUsersTotal(0);
      setOnlineUsersNote(undefined);
      setAgencies([]);
      setBds([]);

      try {
        if (kind === 'hosts_online' || kind === 'hosts_on_call' || kind === 'hosts_offline') {
          const presenceStatus =
            kind === 'hosts_online' ? 'online' : kind === 'hosts_on_call' ? 'on_call' : 'offline';
          const data = await adminService.getCreatorsPerformancePage({
            presenceStatus,
            page: 1,
            limit: 100,
          });
          if (cancelled) return;
          setHosts(data.creators);
          setHostTotal(data.total);
        } else if (kind === 'live_calls') {
          const data = await fetchDashboardLiveCalls();
          if (cancelled) return;
          setLiveCalls(data.calls ?? []);
          setLiveNote(data.note);
        } else if (kind === 'users_online') {
          const data = await fetchDashboardUsersOnline(50);
          if (cancelled) return;
          setOnlineUsers(data.users ?? []);
          setOnlineUsersTotal(data.total ?? 0);
          setOnlineUsersNote(data.note);
        } else if (kind === 'agencies') {
          const res = await api.get('/admin/agencies');
          if (cancelled) return;
          setAgencies(res.data.data.agencies ?? []);
        } else if (kind === 'bds') {
          const res = await api.get('/admin/bds');
          if (cancelled) return;
          setBds(res.data.data.bds ?? []);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const e = err as { response?: { data?: { error?: string } }; message?: string };
        setError(e.response?.data?.error || e.message || 'Failed to load details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, kind]);

  if (!open || !kind) return null;

  const meta = META[kind];
  const pendingRows = payoutRows.filter((r) => r.status.toLowerCase() === 'pending');

  const headlineCount = (() => {
    switch (kind) {
      case 'live_calls':
        return overview?.liveCallsProxy ?? liveCalls.length;
      case 'users_online':
        return overview?.usersOnline ?? onlineUsersTotal;
      case 'hosts_online':
        return overview?.hostsOnline ?? overview?.onlineHosts ?? hostTotal;
      case 'hosts_on_call':
        return overview?.hostsOnCall ?? hostTotal;
      case 'hosts_offline':
        return overview?.hostsOffline ?? hostTotal;
      case 'agencies':
        return overview?.totalAgencies ?? agencies.length;
      case 'bds':
        return overview?.totalBds ?? bds.length;
      case 'pending_payouts':
        return overview?.pendingPayouts ?? pendingRows.length;
      case 'call_minutes':
        return overview?.totalCallMinutesToday ?? callAnalytics?.totalMinutes ?? 0;
      default:
        return 0;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-center-kpi-title"
        className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 id="command-center-kpi-title" className="text-lg font-semibold text-white">
              {meta.title}
            </h3>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-violet-300">
              {new Intl.NumberFormat().format(Math.round(headlineCount))}
              {kind === 'call_minutes' ? (
                <span className="ml-2 text-sm font-normal text-zinc-500">minutes</span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{meta.description}</p>
            {rangeLabel && (kind === 'call_minutes' || kind === 'pending_payouts') ? (
              <p className="mt-0.5 text-[11px] text-zinc-600">Range: {rangeLabel}</p>
            ) : null}
            {overview?.presenceNote &&
            (kind === 'hosts_online' || kind === 'hosts_on_call' || kind === 'hosts_offline') ? (
              <p className="mt-1 text-[11px] text-zinc-600">{overview.presenceNote}</p>
            ) : null}
            {kind === 'users_online' && (onlineUsersNote || overview?.usersOnlineNote) ? (
              <p className="mt-1 text-[11px] text-zinc-600">
                {onlineUsersNote || overview?.usersOnlineNote}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
          {loading ? (
            <LoadingSpinner label="Loading…" />
          ) : error ? (
            <p className="px-3 py-10 text-center text-sm text-red-400">{error}</p>
          ) : (
            <>
              {(kind === 'hosts_online' || kind === 'hosts_on_call' || kind === 'hosts_offline') && (
                <>
                  {hosts.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">No hosts in this state.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur">
                        <tr className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                          <th className="px-3 py-2.5">Host</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5 text-right">Mins (30d)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hosts.map((h) => (
                          <tr key={h.creatorId} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="px-3 py-2.5">
                              <Link
                                to={`/hosts/all/${h.creatorId}`}
                                className="font-medium text-violet-300 hover:underline"
                                onClick={onClose}
                              >
                                {h.name}
                              </Link>
                              <p className="text-[11px] text-zinc-500">
                                {h.username ? `@${h.username}` : h.email || h.phone || '—'}
                              </p>
                            </td>
                            <td className="px-3 py-2.5">{presenceBadge(h.presenceStatus)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">
                              {h.minutes30d}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {hostTotal > hosts.length ? (
                    <p className="px-3 py-2 text-[11px] text-zinc-500">
                      Showing first {hosts.length} of {hostTotal.toLocaleString()} hosts.
                    </p>
                  ) : null}
                </>
              )}

              {kind === 'live_calls' && (
                <>
                  {liveNote ? (
                    <p className="px-3 py-2 text-[11px] text-zinc-500">{liveNote}</p>
                  ) : null}
                  {liveCalls.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">
                      No creator-side sessions in the trailing window.
                    </p>
                  ) : (
                    <ul className="space-y-2 px-2">
                      {liveCalls.map((c) => (
                        <li
                          key={c.callId}
                          className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                        >
                          <p className="text-sm font-medium text-white">
                            {c.hostId ? (
                              <Link
                                to={`/hosts/all/${c.hostId}`}
                                className="text-violet-300 hover:underline"
                                onClick={onClose}
                              >
                                {c.hostName}
                              </Link>
                            ) : (
                              c.hostName
                            )}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Caller: {c.callerName} · {c.durationSeconds}s · {c.revenueCoins} coins ·{' '}
                            {new Date(c.startedAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {kind === 'users_online' && (
                <>
                  {onlineUsers.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">
                      No fans active in the last 5 minutes.
                    </p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur">
                        <tr className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                          <th className="px-3 py-2.5">User</th>
                          <th className="px-3 py-2.5">Email</th>
                          <th className="px-3 py-2.5">ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onlineUsers.map((u) => (
                          <tr key={u.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-white">
                                {u.displayName?.trim() || u.username || 'User'}
                              </p>
                              {u.username ? (
                                <p className="text-[11px] text-zinc-500">@{u.username}</p>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5 text-zinc-400">{u.email || '—'}</td>
                            <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-500">{u.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {onlineUsersTotal > onlineUsers.length ? (
                    <p className="px-3 py-2 text-[11px] text-zinc-500">
                      Showing first {onlineUsers.length} of {onlineUsersTotal.toLocaleString()} users.
                    </p>
                  ) : null}
                </>
              )}

              {kind === 'agencies' && (
                <>
                  {agencies.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">No agencies yet.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur">
                        <tr className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                          <th className="px-3 py-2.5">Agency</th>
                          <th className="px-3 py-2.5 text-right">Active hosts</th>
                          <th className="px-3 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agencies.map((a) => (
                          <tr key={a.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="px-3 py-2.5">
                              <Link
                                to={`/hosts/agencies/${a.id}`}
                                className="font-medium text-violet-300 hover:underline"
                                onClick={onClose}
                              >
                                {a.displayName?.trim() || a.email}
                              </Link>
                              <p className="text-[11px] text-zinc-500">{a.email}</p>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">
                              {a.activeCreators}
                            </td>
                            <td className="px-3 py-2.5">
                              {a.agencyDisabled ? (
                                <StatusBadge variant="offline" label="Disabled" />
                              ) : (
                                <StatusBadge variant="success" label="Active" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {kind === 'bds' && (
                <>
                  {bds.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">No BD accounts yet.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur">
                        <tr className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                          <th className="px-3 py-2.5">BD</th>
                          <th className="px-3 py-2.5 text-right">Agencies</th>
                          <th className="px-3 py-2.5 text-right">Hosts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bds.map((b) => (
                          <tr key={b.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="px-3 py-2.5">
                              <Link
                                to={`/hosts/bds/${b.id}`}
                                className="font-medium text-violet-300 hover:underline"
                                onClick={onClose}
                              >
                                {b.displayName?.trim() || b.email}
                              </Link>
                              <p className="text-[11px] text-zinc-500">{b.email}</p>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">
                              {b.agencyCount}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">
                              {b.totalHostCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {kind === 'pending_payouts' && (
                <>
                  {overview?.pendingPayoutsNote ? (
                    <p className="px-3 py-2 text-[11px] text-zinc-500">{overview.pendingPayoutsNote}</p>
                  ) : null}
                  {pendingRows.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">
                      No pending payout requests in this view.
                    </p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur">
                        <tr className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                          <th className="px-3 py-2.5">User</th>
                          <th className="px-3 py-2.5">Role</th>
                          <th className="px-3 py-2.5 text-right">Amount</th>
                          <th className="px-3 py-2.5">Requested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRows.map((r) => (
                          <tr key={r.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="px-3 py-2.5 text-zinc-200">{r.userLabel}</td>
                            <td className="px-3 py-2.5 text-zinc-400">{r.role}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-white">{r.amount}</td>
                            <td className="px-3 py-2.5 text-zinc-500">
                              {new Date(r.requestedAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {kind === 'call_minutes' && callAnalytics && (
                <div className="px-3 py-2 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      ['Total calls', callAnalytics.totalCalls],
                      ['Answered', callAnalytics.answeredCalls],
                      ['Missed', callAnalytics.missedCalls],
                      ['Avg duration (s)', callAnalytics.avgCallDurationSec],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <p className="text-[10px] text-zinc-500 uppercase">{label}</p>
                        <p className="text-lg font-semibold text-white tabular-nums">{value}</p>
                      </div>
                    ))}
                  </div>
                  {callAnalytics.dailyVolume && callAnalytics.dailyVolume.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 mb-2">
                        Daily call volume
                      </p>
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-[11px] text-zinc-500">
                            <th className="px-2 py-1.5">Date</th>
                            <th className="px-2 py-1.5 text-right">Calls</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...callAnalytics.dailyVolume]
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .slice(0, 14)
                            .map((row) => (
                              <tr key={row.date} className="border-t border-white/[0.04]">
                                <td className="px-2 py-1.5 text-zinc-300">{row.date}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-zinc-400">
                                  {row.calls}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>

        {meta.viewAllHref ? (
          <div className="border-t border-white/10 px-5 py-3 flex justify-end">
            <Link
              to={meta.viewAllHref}
              onClick={onClose}
              className="text-sm text-violet-400 hover:text-violet-300 hover:underline"
            >
              {meta.viewAllLabel ?? 'View all'} →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CommandCenterKpiModal;
