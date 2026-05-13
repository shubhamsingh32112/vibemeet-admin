import * as React from 'react';
import {
  Coins,
  PhoneCall,
  Radio,
  TrendingUp,
  Users,
  Wallet,
  Building2,
} from 'lucide-react';
import type { AgencyDashboardData } from '../../services/agencyPortalService';
import { formatDashboardMoneyFromCoins } from '../../utils/dashboardInr';

type Props = { d: AgencyDashboardData };

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

const AgencyKpiStrip: React.FC<Props> = ({ d }) => {
  const callMinutes7d = React.useMemo(
    () => d.activitySeries7d.reduce((s, x) => s + x.minutes, 0),
    [d.activitySeries7d],
  );
  const fmtCoins = (n: number) => formatDashboardMoneyFromCoins(n).text;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
      <KpiCard
        label="Revenue today"
        value={fmtCoins(d.revenueCoins.today)}
        sub="+0% vs yesterday"
        accent="bg-violet-500/15 text-violet-300"
        icon={<Coins className="h-4 w-4" />}
      />
      <KpiCard
        label="Active hosts"
        value={d.onlineHosts.toLocaleString('en-IN')}
        sub="+0% vs yesterday"
        accent="bg-sky-500/15 text-sky-300"
        icon={<Radio className="h-4 w-4" />}
      />
      <KpiCard
        label="Call minutes (7d)"
        value={Math.round(callMinutes7d).toLocaleString('en-IN')}
        sub="+0% vs prior week"
        accent="bg-fuchsia-500/15 text-fuchsia-300"
        icon={<PhoneCall className="h-4 w-4" />}
      />
      <KpiCard
        label="Total BDs"
        value={d.bdTotal.toLocaleString('en-IN')}
        sub="+0% vs yesterday"
        accent="bg-amber-500/15 text-amber-300"
        icon={<Users className="h-4 w-4" />}
      />
      <KpiCard
        label="Active BDs"
        value={d.bdActive.toLocaleString('en-IN')}
        sub="+0% vs yesterday"
        accent="bg-emerald-500/15 text-emerald-300"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KpiCard
        label="Pending payouts"
        value={d.withdrawals.pendingCount.toLocaleString('en-IN')}
        sub="+0% vs yesterday"
        accent="bg-orange-500/15 text-orange-300"
        icon={<Building2 className="h-4 w-4" />}
      />
      <KpiCard
        label="Wallet balance"
        value={fmtCoins(d.staffCoinsBalance)}
        sub="+0% vs yesterday"
        accent="bg-violet-500/15 text-violet-200"
        icon={<Wallet className="h-4 w-4" />}
      />
    </div>
  );
};

export default AgencyKpiStrip;
