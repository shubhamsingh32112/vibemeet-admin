import * as React from 'react';
import { Coins, GraduationCap, Radio, TrendingUp, UserPlus, Wallet } from 'lucide-react';
import type { AgentSummary } from '../../services/agentPortalService';
import { formatDashboardMoneyFromCoins } from '../../utils/dashboardInr';

type Props = { s: AgentSummary };

const cardBase =
  'rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={cardBase}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        <span className={`rounded-lg p-1.5 ${accent}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white">{value}</p>
      {sub ? <p className="mt-1 text-[11px] text-emerald-400/90">{sub}</p> : null}
    </div>
  );
}

const AgentKpiStrip: React.FC<Props> = ({ s }) => {
  const total = s.totalCreators ?? s.activeCreators ?? 0;
  const online = s.onlineCreators ?? 0;
  const awaiting = s.referredUsersAwaitingPromotion ?? s.pendingApplications ?? 0;
  const fmtCoins = (n: number) => formatDashboardMoneyFromCoins(n).text;
  const hostToday = s.hostRevenueCoins?.today ?? 0;
  const hostWeek = s.hostRevenueCoins?.last7d ?? 0;
  const bdTotal = s.bdEarningsCoins?.totalBalance ?? 0;
  const bdWeek = s.bdEarningsCoins?.last7d ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
      <KpiCard
        label="Host revenue today"
        value={fmtCoins(hostToday)}
        sub="Coins earned by your hosts"
        accent="bg-violet-500/15 text-violet-300"
        icon={<Coins className="h-4 w-4" />}
      />
      <KpiCard
        label="Host revenue (7d)"
        value={fmtCoins(hostWeek)}
        sub="Rolling 7-day window"
        accent="bg-fuchsia-500/15 text-fuchsia-300"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KpiCard
        label="BD total earnings"
        value={fmtCoins(bdTotal)}
        sub={bdWeek > 0 ? `${fmtCoins(bdWeek)} this week` : 'Wallet balance'}
        accent="bg-emerald-500/15 text-emerald-300"
        icon={<Wallet className="h-4 w-4" />}
      />
      <KpiCard
        label="Awaiting promotion"
        value={awaiting.toLocaleString('en-IN')}
        sub="Referred users in funnel"
        accent="bg-amber-500/15 text-amber-300"
        icon={<UserPlus className="h-4 w-4" />}
      />
      <KpiCard
        label="Pending withdrawals"
        value={(s.pendingWithdrawals ?? 0).toLocaleString('en-IN')}
        sub="Needs your action"
        accent="bg-orange-500/15 text-orange-300"
        icon={<Wallet className="h-4 w-4" />}
      />
      <KpiCard
        label="Total creators"
        value={total.toLocaleString('en-IN')}
        sub="Hosts under you"
        accent="bg-violet-500/15 text-violet-300"
        icon={<GraduationCap className="h-4 w-4" />}
      />
      <KpiCard
        label="Creators online"
        value={total > 0 ? `${online} / ${total}` : '0'}
        sub="Live availability"
        accent="bg-sky-500/15 text-sky-300"
        icon={<Radio className="h-4 w-4" />}
      />
    </div>
  );
};

export default AgentKpiStrip;
