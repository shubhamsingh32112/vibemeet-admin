import * as React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { AgencyDashboardData } from '../../services/agencyPortalService';
import { formatDashboardMoneyFromCoins } from '../../utils/dashboardInr';

type Props = { d: AgencyDashboardData };

const shell = 'rounded-2xl border border-white/[0.06] bg-zinc-950/70 overflow-hidden';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 text-[10px] font-bold text-amber-950 ring-1 ring-amber-900/30">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 text-[10px] font-bold text-zinc-800 ring-1 ring-zinc-600/40">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-orange-200 via-amber-700 to-amber-900 text-[10px] font-bold text-amber-950 ring-1 ring-amber-950/40">
        3
      </span>
    );
  return <span className="tabular-nums text-zinc-400">{rank}</span>;
}

function Avatar({ url, label }: { url: string | null; label: string }) {
  const ch = label.trim().charAt(0).toUpperCase() || '?';
  if (url)
    return (
      <img src={url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
    );
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200 ring-1 ring-white/10">
      {ch}
    </div>
  );
}

const numIn = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const numDec = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

const AgencyLeaderboardTables: React.FC<Props> = ({ d }) => {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className={shell}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Top performing BDs</h2>
          <Link to="/agency/bds" className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                <th className="w-10 px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">BD name</th>
                <th className="px-3 py-2.5 text-right">Hosts</th>
                <th className="px-3 py-2.5 text-right">Revenue generated</th>
                <th className="px-3 py-2.5 text-right">Commission (5%)</th>
                <th className="px-3 py-2.5 text-right">Active hosts</th>
              </tr>
            </thead>
            <tbody>
              {d.topBdsLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                    No BDs yet
                  </td>
                </tr>
              ) : (
                d.topBdsLeaderboard.map((row) => {
                  const rev = formatDashboardMoneyFromCoins(row.revenueGeneratedCoins);
                  const com = formatDashboardMoneyFromCoins(row.commission5PctCoins);
                  return (
                    <tr key={row.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 align-middle">
                        {row.rank <= 3 ? <RankBadge rank={row.rank} /> : (
                          <span className="text-zinc-400">{row.rank}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar url={row.avatarUrl} label={row.displayLabel} />
                          <span className="truncate font-medium text-zinc-100">{row.displayLabel}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-200">{numIn.format(row.hostCount)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-100">
                        {rev.text}
                        {rev.format === 'coins' ? <span className="block text-[10px] text-zinc-500">(coins)</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-100">
                        {com.text}
                        {com.format === 'coins' ? <span className="block text-[10px] text-zinc-500">(coins)</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-200">{numIn.format(row.activeHosts)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/[0.06] py-3 text-center">
          <Link
            to="/agency/bds"
            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300"
          >
            View all BDs <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className={shell}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Top performing hosts</h2>
          <span className="text-[10px] text-zinc-500">7d · by earnings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                <th className="w-10 px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Host name</th>
                <th className="px-3 py-2.5">BD name</th>
                <th className="px-3 py-2.5 text-right">Call minutes</th>
                <th className="px-3 py-2.5 text-right">Calls</th>
                <th className="px-3 py-2.5 text-right">Earnings</th>
                <th className="px-3 py-2.5 text-right">Incentive</th>
              </tr>
            </thead>
            <tbody>
              {d.topHostsLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                    No host call activity in the last 7 days
                  </td>
                </tr>
              ) : (
                d.topHostsLeaderboard.map((row) => {
                  const earn = formatDashboardMoneyFromCoins(row.earningsCoins);
                  const inc = formatDashboardMoneyFromCoins(row.incentiveCoins);
                  return (
                    <tr
                      key={`${row.rank}-${row.hostName}`}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2.5 align-middle">
                        {row.rank <= 3 ? <RankBadge rank={row.rank} /> : <span className="text-zinc-400">{row.rank}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar url={row.avatarUrl} label={row.hostName} />
                          <span className="truncate font-medium text-zinc-100">{row.hostName}</span>
                        </div>
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2.5 text-zinc-300">{row.bdName}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-200">{numDec.format(row.minutes)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-200">{numIn.format(row.calls)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-100">
                        {earn.text}
                        {earn.format === 'coins' ? <span className="block text-[10px] text-zinc-500">(coins)</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-block rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-medium text-violet-200 ring-1 ring-violet-500/30">
                          {inc.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/[0.06] py-3 text-center">
          <Link to="/agency/bds" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300">
            View all hosts <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AgencyLeaderboardTables;
