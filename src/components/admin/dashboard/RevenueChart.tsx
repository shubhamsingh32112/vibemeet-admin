import * as React from 'react';
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '../../../lib/utils';
import { MetricHelpButton } from '../help/MetricHelpButton';

export type RevenuePoint = { date: string; revenueCoins: number; commissionCoins: number };

type RevenueChartProps = {
  points: RevenuePoint[];
  className?: string;
  helpKey?: string;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({ points, className, helpKey = 'dashboard.revenue_chart' }) => (
  <div className={cn('glass-panel rounded-2xl p-4', className)}>
    <div className="mb-3 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-white inline-flex items-center gap-1">
          Call spend overview
          <MetricHelpButton helpKey={helpKey} />
        </h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">Coins deducted on calls — separate from net wallet flow KPI</p>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Coins · IST day</span>
    </div>
    <div className="h-[280px] w-full min-h-0 min-w-0">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={points}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="comFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="revenueCoins" name="Call spend" stroke="#a78bfa" fill="url(#revFill)" strokeWidth={2} />
          <Area type="monotone" dataKey="commissionCoins" name="Commission" stroke="#f472b6" fill="url(#comFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default RevenueChart;
