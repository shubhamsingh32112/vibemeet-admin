import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BellRing, ShieldAlert, Wallet } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type AlertItem = {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  createdAt: string;
};

const iconFor = (type: string) => {
  if (type === 'fraud') return <ShieldAlert className="h-4 w-4" />;
  if (type === 'payout') return <Wallet className="h-4 w-4" />;
  return <BellRing className="h-4 w-4" />;
};

const sevClass: Record<AlertItem['severity'], string> = {
  info: 'border-sky-500/25 bg-sky-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  danger: 'border-red-500/35 bg-red-500/10',
};

type AlertsPanelProps = {
  alerts: AlertItem[];
  className?: string;
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, className }) => (
  <div className={cn('glass-panel rounded-2xl p-4 flex flex-col', className)}>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white">Alerts</h3>
      <AlertTriangle className="h-4 w-4 text-amber-400/80" />
    </div>
    <ul className="space-y-2 flex-1 overflow-auto max-h-[360px] pr-1">
      {alerts.length === 0 ? (
        <li className="text-xs text-zinc-500 py-6 text-center">All clear — no operational alerts.</li>
      ) : (
        alerts.map((a) => (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn('flex gap-3 rounded-xl border px-3 py-2', sevClass[a.severity])}
          >
            <div className="mt-0.5 text-violet-300">{iconFor(a.type)}</div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-200 leading-snug">{a.message}</p>
              <p className="text-[10px] text-zinc-500 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
            </div>
          </motion.li>
        ))
      )}
    </ul>
  </div>
);

export default AlertsPanel;
