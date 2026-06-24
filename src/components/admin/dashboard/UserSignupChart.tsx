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

export type UserSignupGranularity = 'hourly' | 'daily';

export type UserSignupSeriesPoint = {
  label: string;
  startDate: string;
  signups: number;
};

type UserSignupChartProps = {
  points: UserSignupSeriesPoint[];
  granularity: UserSignupGranularity;
  onGranularityChange: (g: UserSignupGranularity) => void;
  loading?: boolean;
  note?: string;
  className?: string;
};

const GRANULARITY_OPTIONS: { value: UserSignupGranularity; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
];

const numIn = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const UserSignupChart: React.FC<UserSignupChartProps> = ({
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
        <h3 className="text-sm font-semibold text-white">New user signups</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          End-user registrations per {granularity === 'hourly' ? 'UTC hour (last 48h)' : 'UTC day'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-zinc-500">View:</span>
        {GRANULARITY_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onGranularityChange(o.value)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11px] transition',
              granularity === o.value
                ? 'border-violet-500/50 bg-violet-500/15 text-violet-200'
                : 'border-white/10 text-zinc-500 hover:text-zinc-300'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>

    {loading ? (
      <div className="flex h-48 items-center justify-center text-xs text-zinc-500">Loading…</div>
    ) : points.length === 0 ? (
      <div className="flex h-48 items-center justify-center text-xs text-zinc-500">No signup data</div>
    ) : (
      <div className="h-52 w-full min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 10 }}
              interval={granularity === 'hourly' ? Math.max(0, Math.floor(points.length / 12) - 1) : 'preserveStartEnd'}
            />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} allowDecimals={false} width={32} />
            <Tooltip
              contentStyle={{
                background: '#18181b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [numIn.format(Number(value ?? 0)), 'Signups']}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as UserSignupSeriesPoint | undefined;
                return row?.startDate ? new Date(row.startDate).toUTCString() : '';
              }}
            />
            <Bar dataKey="signups" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={granularity === 'hourly' ? 12 : 24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}

    {note ? <p className="mt-2 text-[10px] text-zinc-600 leading-snug">{note}</p> : null}
  </div>
);

export default UserSignupChart;
