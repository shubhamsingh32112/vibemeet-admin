import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '../../../lib/utils';
import { MetricHelpButton } from '../help/MetricHelpButton';

type CallAnalyticsBlockProps = {
  today: { totalCalls: number; answeredCalls: number; missedCalls: number; avgCallDurationSec: number };
  dailyVolume: Array<{ date: string; calls: number }>;
  className?: string;
  helpKey?: string;
};

export const CallAnalyticsBlock: React.FC<CallAnalyticsBlockProps> = ({
  today,
  dailyVolume,
  className,
  helpKey = 'dashboard.call_analytics',
}) => (
  <div className={cn('glass-panel rounded-2xl p-4', className)}>
    <h3 className="text-sm font-semibold text-white mb-3 inline-flex items-center gap-1">
      Call analytics
      <MetricHelpButton helpKey={helpKey} />
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      {[
        ['Total', today.totalCalls],
        ['Answered', today.answeredCalls],
        ['Missed', today.missedCalls],
        ['Avg dur (s)', today.avgCallDurationSec],
      ].map(([k, v]) => (
        <div key={String(k)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] text-zinc-500 uppercase">{k}</p>
          <p className="text-lg font-semibold text-white tabular-nums">{v}</p>
        </div>
      ))}
    </div>
    <div className="h-[200px] min-h-0 min-w-0">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={dailyVolume}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Bar dataKey="calls" fill="#60a5fa" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default CallAnalyticsBlock;
