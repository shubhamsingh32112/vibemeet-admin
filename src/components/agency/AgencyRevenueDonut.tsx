import * as React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AgencyDashboardData } from '../../services/agencyPortalService';

type Props = { d: AgencyDashboardData };

const COLORS = ['#a78bfa', '#38bdf8', '#fbbf24', '#34d399'];

const AgencyRevenueDonut: React.FC<Props> = ({ d }) => {
  const hostPool = d.topHostsLeaderboard.reduce((s, h) => s + h.earningsCoins, 0);
  const bdPool = d.bdAnalytics.reduce((s, b) => s + b.bdEarningsCoinsLast7d, 0);
  const agency7 = d.revenueCoins.last7d;
  const platformEst = Math.max(0, Math.round(bdPool * 0.08));

  const raw = [
    { name: 'Host earnings (7d est.)', value: Math.max(0, hostPool) },
    { name: 'BD activity (7d est.)', value: Math.max(0, bdPool) },
    { name: 'Agency credits (7d)', value: Math.max(0, agency7) },
    { name: 'Platform (est.)', value: platformEst },
  ];
  const sum = raw.reduce((s, x) => s + x.value, 0);
  const data = sum === 0 ? [{ name: 'No data yet', value: 1 }] : raw;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
      <h2 className="text-sm font-semibold text-white">Revenue breakdown</h2>
      <p className="mt-0.5 text-[10px] text-zinc-500">Illustrative split from 7d activity · not tax advice</p>
      <div className="mx-auto mt-2 h-[220px] w-full max-w-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={sum === 0 ? '#3f3f46' : COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#18181b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                fontSize: 11,
              }}
              formatter={(v: number, n: string) => [`${v.toLocaleString('en-IN')} (weight)`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-1 space-y-1.5 text-[11px] text-zinc-400">
        {data.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: sum === 0 ? '#52525b' : COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{s.name}</span>
            </span>
            <span className="tabular-nums text-zinc-300">{s.value.toLocaleString('en-IN')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AgencyRevenueDonut;
