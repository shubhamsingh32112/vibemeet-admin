import * as React from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '../../../lib/utils';

export type KPIStatCardProps = {
  title: string;
  value: number;
  format?: 'number' | 'compact';
  icon: React.ReactNode;
  sparkline?: number[];
  footnote?: string;
  accent?: 'violet' | 'pink' | 'blue' | 'green' | 'amber';
};

const accentRing: Record<NonNullable<KPIStatCardProps['accent']>, string> = {
  violet: 'hover:shadow-glow-violet border-violet-500/20',
  pink: 'hover:shadow-[0_0_32px_-8px_rgba(244,114,182,0.35)] border-pink-500/20',
  blue: 'hover:shadow-[0_0_32px_-8px_rgba(96,165,250,0.35)] border-sky-500/20',
  green: 'hover:shadow-[0_0_32px_-8px_rgba(52,211,153,0.35)] border-emerald-500/20',
  amber: 'hover:shadow-[0_0_32px_-8px_rgba(251,191,36,0.35)] border-amber-500/20',
};

function formatVal(n: number, mode: KPIStatCardProps['format']) {
  if (mode === 'compact' && n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat().format(Math.round(n));
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  title,
  value,
  format = 'number',
  icon,
  sparkline,
  footnote,
  accent = 'violet',
}) => {
  const gid = React.useId().replace(/:/g, '');
  const display = formatVal(value, format);

  const chartData = (sparkline ?? []).map((y, i) => ({ i, y }));

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.06] to-transparent p-4 transition-shadow duration-300',
        accentRing[accent]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{title}</p>
          <motion.p
            key={value}
            initial={{ opacity: 0.4, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-1 text-2xl font-semibold tabular-nums text-white"
          >
            {display}
          </motion.p>
          {footnote ? <p className="mt-1 text-[10px] text-zinc-500">{footnote}</p> : null}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-violet-300">{icon}</div>
      </div>
      {chartData.length > 1 ? (
        <motion.div className="mt-3 h-10 w-full min-h-0 min-w-0 opacity-90">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="y" stroke="#a78bfa" fill={`url(#${gid})`} strokeWidth={1.5} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default KPIStatCard;
