import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { formatDashboardMoneyFromCoins } from '../../../utils/dashboardInr';

const numIn = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const numInDecimal = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export type LeaderboardPeriod = 'month' | '30d' | 'all';

type BaseProps = {
  title: string;
  viewAllHref: string;
  loading?: boolean;
  /** Shown under the table when set (e.g. wallet balance disclaimer for BDs). */
  footnote?: string;
  /** e.g. "Last 7d" from the header date filter */
  rangeLabel?: string;
  className?: string;
};

export type HostLeaderboardRow = {
  rank: number;
  host: string;
  avatarUrl: string | null;
  minutes: number;
  calls: number;
  earningsCoins: number;
};

export type BdLeaderboardRow = {
  rank: number;
  bdName: string;
  hosts: number;
  revenueCoins: number;
  commissionCoins: number;
};

export type AgencyLeaderboardRow = {
  rank: number;
  agencyName: string;
  bds: number;
  hosts: number;
  revenueCoins: number;
};

export type RankingLeaderboardCardProps =
  | ({ variant: 'hosts'; rows: HostLeaderboardRow[] } & BaseProps)
  | ({ variant: 'bds'; rows: BdLeaderboardRow[] } & BaseProps)
  | ({ variant: 'agencies'; rows: AgencyLeaderboardRow[] } & BaseProps);

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 text-[10px] font-bold text-amber-950 shadow-sm ring-1 ring-amber-900/30"
        title="1st"
      >
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 text-[10px] font-bold text-zinc-800 shadow-sm ring-1 ring-zinc-600/40"
        title="2nd"
      >
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-orange-200 via-amber-700 to-amber-900 text-[10px] font-bold text-amber-950 shadow-sm ring-1 ring-amber-950/40"
        title="3rd"
      >
        3
      </span>
    );
  }
  return <span className="tabular-nums text-zinc-400">{rank}</span>;
}

function HostCell({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-2">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200 ring-1 ring-white/10">
          {initial}
        </div>
      )}
      <span className="truncate font-medium text-zinc-100">{name}</span>
    </div>
  );
}

export function RankingLeaderboardCard(props: RankingLeaderboardCardProps) {
  const { title, viewAllHref, loading, footnote, rangeLabel, className, variant, rows } = props;

  return (
    <div
      className={cn(
        'flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {rangeLabel ? (
            <span className="rounded-lg border border-white/10 bg-zinc-900/90 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400">
              {rangeLabel}
            </span>
          ) : null}
          <Link
            to={viewAllHref}
            className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 hover:underline"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto px-1 pb-1">
        <table className="w-full min-w-[260px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              {variant === 'hosts' ? (
                <>
                  <th className="w-10 px-2 py-2.5">#</th>
                  <th className="px-2 py-2.5">Host</th>
                  <th className="px-2 py-2.5 text-right">Minutes</th>
                  <th className="px-2 py-2.5 text-right">Calls</th>
                  <th className="px-2 py-2.5 text-right">Earnings</th>
                </>
              ) : variant === 'bds' ? (
                <>
                  <th className="w-10 px-2 py-2.5">#</th>
                  <th className="px-2 py-2.5">BD name</th>
                  <th className="px-2 py-2.5 text-right">Hosts</th>
                  <th className="px-2 py-2.5 text-right">Revenue</th>
                  <th className="px-2 py-2.5 text-right">Commission</th>
                </>
              ) : (
                <>
                  <th className="w-10 px-2 py-2.5">#</th>
                  <th className="px-2 py-2.5">Agency name</th>
                  <th className="px-2 py-2.5 text-right">BDs</th>
                  <th className="px-2 py-2.5 text-right">Hosts</th>
                  <th className="px-2 py-2.5 text-right">Revenue</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-2 py-8 text-center text-zinc-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-8 text-center text-zinc-500">
                  No data
                </td>
              </tr>
            ) : variant === 'hosts' ? (
              (rows as HostLeaderboardRow[]).map((row) => {
                const earn = formatDashboardMoneyFromCoins(row.earningsCoins);
                return (
                  <tr
                    key={`${row.rank}-${row.host}`}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-2 py-2.5 align-middle">
                      {row.rank <= 3 ? <RankMedal rank={row.rank} /> : <span className="text-zinc-400">{row.rank}</span>}
                    </td>
                    <td className="max-w-[140px] px-2 py-2.5 align-middle">
                      <HostCell name={row.host} avatarUrl={row.avatarUrl} />
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-200">
                      {numInDecimal.format(row.minutes)}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-200">{numIn.format(row.calls)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-100">
                      {earn.text}
                      {earn.format === 'coins' ? (
                        <span className="block text-[10px] font-normal text-zinc-500">(coins)</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : variant === 'bds' ? (
              (rows as BdLeaderboardRow[]).map((row) => {
                const rev = formatDashboardMoneyFromCoins(row.revenueCoins);
                const com = formatDashboardMoneyFromCoins(row.commissionCoins);
                return (
                  <tr
                    key={`${row.rank}-${row.bdName}`}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-2 py-2.5 text-zinc-400 tabular-nums">{row.rank}</td>
                    <td className="max-w-[140px] truncate px-2 py-2.5 font-medium text-zinc-100">{row.bdName}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-200">{numIn.format(row.hosts)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-100">
                      {rev.text}
                      {rev.format === 'coins' ? (
                        <span className="block text-[10px] font-normal text-zinc-500">(coins)</span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-100">
                      {com.text}
                      {com.format === 'coins' ? (
                        <span className="block text-[10px] font-normal text-zinc-500">(coins)</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : (
              (rows as AgencyLeaderboardRow[]).map((row) => {
                const rev = formatDashboardMoneyFromCoins(row.revenueCoins);
                return (
                  <tr
                    key={`${row.rank}-${row.agencyName}`}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-2 py-2.5 text-zinc-400 tabular-nums">{row.rank}</td>
                    <td className="max-w-[140px] truncate px-2 py-2.5 font-medium text-zinc-100">{row.agencyName}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-200">{numIn.format(row.bds)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-200">{numIn.format(row.hosts)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-zinc-100">
                      {rev.text}
                      {rev.format === 'coins' ? (
                        <span className="block text-[10px] font-normal text-zinc-500">(coins)</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footnote ? <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] leading-snug text-zinc-500">{footnote}</p> : null}
    </div>
  );
}

export default RankingLeaderboardCard;
