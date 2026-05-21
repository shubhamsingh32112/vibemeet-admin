import * as React from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '../../../lib/utils';
import type { SplitSlice } from '../../../lib/revenueSplitModel';
import { formatCoinsAndInr, slicesForChart } from '../../../lib/revenueSplitModel';

type RevenueSplitPieProps = {
  title: string;
  subtitle?: string;
  slices: SplitSlice[];
  className?: string;
};

type TooltipPayload = {
  active?: boolean;
  payload?: Array<{
    payload?: {
      name?: string;
      value?: number;
      coins?: number;
    };
  }>;
};

function CustomTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  const coins = p?.coins ?? 0;
  const { coins: coinsText, inr } = formatCoinsAndInr(coins);
  return (
    <div className="rounded-xl border border-white/10 bg-[#12121a] px-3 py-2 text-xs shadow-lg">
      <p className="text-zinc-200 font-medium">{p?.name}</p>
      <p className="text-zinc-400 mt-1">{coinsText}</p>
      <p className="text-emerald-300/90">{inr}</p>
    </div>
  );
}

export const RevenueSplitPie: React.FC<RevenueSplitPieProps> = ({
  title,
  subtitle,
  slices,
  className,
}) => {
  const data = slicesForChart(slices);

  return (
    <div className={cn('glass-panel rounded-2xl p-4 flex flex-col', className)}>
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle ? <p className="text-xs text-zinc-500 mt-1">{subtitle}</p> : null}
      </div>
      <div className="h-[260px] w-full min-h-0 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0.2)" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={48}
              formatter={(value) => (
                <span className="text-xs text-zinc-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-2 border-t border-white/10 pt-3">
        {slices.map((s) => {
          const coins = s.coins ?? 0;
          const { coins: coinsText, inr } = formatCoinsAndInr(coins);
          return (
            <li key={s.key} className="flex items-start justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 text-zinc-300 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: s.color }}
                />
                <span>
                  {s.label} <span className="text-zinc-500">({s.pct}%)</span>
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block tabular-nums text-zinc-100 font-medium">{coinsText}</span>
                <span className="block tabular-nums text-emerald-300/80 text-[10px]">{inr}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RevenueSplitPie;
