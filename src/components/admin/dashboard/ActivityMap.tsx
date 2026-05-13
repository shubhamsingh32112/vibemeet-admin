import * as React from 'react';
import { Globe2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

type ActivityMapProps = {
  stats: { onlineHosts: number; liveCalls: number; callsPerMinute: number; revenuePerMinute: number };
  countries: Array<{ code: string; label: string; pct: number }>;
  isDemo?: boolean;
  className?: string;
};

export const ActivityMap: React.FC<ActivityMapProps> = ({ stats, countries, isDemo, className }) => (
  <div className={cn('glass-panel rounded-2xl p-4', className)}>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-sky-400" />
        Activity map
      </h3>
      {isDemo ? (
        <span className="text-[10px] uppercase tracking-wider text-amber-400/90">Demo regions</span>
      ) : null}
    </div>
    <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
      <div className="relative h-48 rounded-xl bg-gradient-to-br from-sky-500/10 via-violet-500/5 to-transparent border border-white/10 flex items-center justify-center">
        <p className="text-xs text-zinc-500 text-center px-4">
          World heat layer ships when per-country telemetry is available. Right rail shows illustrative regional mix.
        </p>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <p className="text-[10px] text-zinc-500">Online hosts</p>
            <p className="text-lg font-semibold text-white tabular-nums">{stats.onlineHosts}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <p className="text-[10px] text-zinc-500">Live calls</p>
            <p className="text-lg font-semibold text-white tabular-nums">{stats.liveCalls}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <p className="text-[10px] text-zinc-500">Calls / min</p>
            <p className="text-lg font-semibold text-white tabular-nums">{stats.callsPerMinute}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <p className="text-[10px] text-zinc-500">Rev / min</p>
            <p className="text-lg font-semibold text-white tabular-nums">{stats.revenuePerMinute}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Top countries</p>
          <ul className="space-y-1.5">
            {countries.map((c) => (
              <li key={c.code} className="flex justify-between text-xs text-zinc-300">
                <span>{c.label}</span>
                <span className="tabular-nums text-violet-300">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default ActivityMap;
