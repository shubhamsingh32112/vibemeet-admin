import * as React from 'react';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import { Skeleton } from '../../ui/skeleton';
import { cn } from '../../../lib/utils';

export type LiveCallRow = {
  callId: string;
  hostName: string;
  hostId: string | null;
  callerName: string;
  durationSeconds: number;
  revenueCoins: number;
  startedAt: string;
};

type LiveCallsFeedProps = {
  calls: LiveCallRow[];
  loading?: boolean;
  className?: string;
};

export const LiveCallsFeed: React.FC<LiveCallsFeedProps> = ({ calls, loading, className }) => (
  <div className={cn('glass-panel rounded-2xl p-4 flex flex-col min-h-[280px]', className)}>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white">Recent creator calls (30m feed)</h3>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/90 animate-live-pulse">
        Auto-refresh
      </span>
    </div>
    {loading ? (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    ) : calls.length === 0 ? (
      <p className="text-sm text-zinc-500 py-8 text-center">No creator-side sessions in the trailing 30 minutes.</p>
    ) : (
      <ScrollArea className="h-[240px] pr-2">
        <ul className="space-y-2">
          {calls.map((c) => (
            <motion.li
              key={c.callId}
              layout
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{c.hostName}</p>
                <p className="text-[11px] text-zinc-500 truncate">
                  Caller: {c.callerName} · {c.durationSeconds}s · {c.revenueCoins} coins
                </p>
              </div>
              <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                {new Date(c.startedAt).toLocaleTimeString()}
              </span>
            </motion.li>
          ))}
        </ul>
      </ScrollArea>
    )}
  </div>
);

export default LiveCallsFeed;
