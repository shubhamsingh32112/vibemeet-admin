import * as React from 'react';
import { Link } from 'react-router-dom';
import type { AgencyDashboardData } from '../../services/agencyPortalService';
import { formatDashboardMoneyFromCoins } from '../../utils/dashboardInr';

type Props = { d: AgencyDashboardData };

const AgencyPayoutCard: React.FC<Props> = ({ d }) => {
  const p = d.payoutSummary;
  const fmt = (n: number) => formatDashboardMoneyFromCoins(n).text;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-5">
      <h2 className="text-sm font-semibold text-white">Payout summary</h2>
      <p className="mt-1 text-xs text-zinc-500">{d.payoutSummary.nextPayoutNote}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-200/80">Pending</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-white">{fmt(p.pendingCoins)}</p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-sky-200/80">Processing</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-white">{fmt(p.processingCoins)}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-200/80">Paid</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-white">{fmt(p.paidCoins)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/agency/wallet"
          className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500"
        >
          View payouts
        </Link>
      </div>
    </div>
  );
};

export default AgencyPayoutCard;
