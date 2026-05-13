import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AgencyDashboardData } from '../../services/agencyPortalService';

type Props = { d: AgencyDashboardData };

const axisStyle = { fontSize: 10, fill: '#71717a' };
const gridStyle = { stroke: 'rgba(255,255,255,0.06)' };

function formatDay(iso: string) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const AgencyDashboardCharts: React.FC<Props> = ({ d }) => {
  const revenueData = d.revenueSeries14d.map((p) => ({
    ...p,
    label: formatDay(p.date),
  }));
  const activityData = d.activitySeries7d.map((p) => ({
    ...p,
    label: formatDay(p.date),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Revenue overview</h2>
          <span className="text-[10px] text-zinc-500">14d · agency ledger credits</span>
        </div>
        <div className="h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="agencyRevFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStyle.stroke} vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(v: number) => [`${v.toLocaleString('en-IN')} coins`, 'Credits']}
              />
              <Area
                type="monotone"
                dataKey="coins"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#agencyRevFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Activity overview</h2>
          <span className="text-[10px] text-zinc-500">7d · calls to your hosts</span>
        </div>
        <div className="h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStyle.stroke} vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="calls"
                name="Calls"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="minutes"
                name="Minutes"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-400" /> Calls
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" /> Minutes
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboardCharts;
