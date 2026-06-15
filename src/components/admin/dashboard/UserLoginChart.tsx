import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '../../../lib/utils';

export type UserLoginGranularity = 'daily' | 'weekly' | 'monthly';

export type UserLoginSeriesPoint = {
  label: string;
  startDate: string;
  uniqueLogins: number;
  loginEvents: number;
};

type UserLoginChartProps = {
  points: UserLoginSeriesPoint[];
  granularity: UserLoginGranularity;
  onGranularityChange: (g: UserLoginGranularity) => void;
  loading?: boolean;
  note?: string;
  className?: string;
};

const GRANULARITY_OPTIONS: { value: UserLoginGranularity; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const numIn = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const UserLoginChart: React.FC<UserLoginChartProps> = ({
  points,
  granularity,
  onGranularityChange,
  loading,
  note,
  className,
}) => (
  <div className={cn('glass-panel rounded-2xl p-4', className)}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-white">User logins</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          Unique end-users (role=user) who logged in per {granularity === 'daily' ? 'day' : granularity === 'weekly' ? 'week' : 'month'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-zinc-500">View:</span>
        {GRANULARITY_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onGranularityChange(o.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition ${
              granularity === o.value
                ? 'bg-violet-600/25 border-violet-500/50 text-violet-100'
                : 'border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>

    {loading ? (
      <div className="flex h-[280px] items-center justify-center text-sm text-zinc-500">Loading chart…</div>
    ) : points.length === 0 ? (
      <div className="flex h-[280px] items-center justify-center text-sm text-zinc-500">
        No login data yet. Logins are tracked after this update is deployed.
      </div>
    ) : (
      <div className="h-[280px] min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={granularity === 'daily' ? 4 : 0}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as UserLoginSeriesPoint;
                return (
                  <div className="rounded-xl border border-white/10 bg-[#12121a] px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium text-zinc-200">Period: {label}</p>
                    <p className="mt-1 text-violet-300 tabular-nums">
                      Unique users: {numIn.format(row.uniqueLogins)}
                    </p>
                    <p className="text-zinc-400 tabular-nums">
                      Login events: {numIn.format(row.loginEvents)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="uniqueLogins" name="uniqueLogins" fill="#a78bfa" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}

    {note ? <p className="mt-3 text-[10px] leading-snug text-zinc-500">{note}</p> : null}
  </div>
);

export default UserLoginChart;
