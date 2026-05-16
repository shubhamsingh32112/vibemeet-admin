import * as React from 'react';
import { motion } from 'framer-motion';
import { BellRing, Building2, KeyRound, ShieldAlert, UserPlus, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { StaffAlertBase } from '../../types/staffAlert';

const sevClass: Record<StaffAlertBase['severity'], string> = {
  info: 'border-sky-500/25 bg-sky-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  danger: 'border-red-500/35 bg-red-500/10',
};

const iconFor = (type: string) => {
  if (type === 'fraud') return <ShieldAlert className="h-4 w-4" />;
  if (type === 'payout') return <Wallet className="h-4 w-4" />;
  if (type === 'agency') return <Building2 className="h-4 w-4" />;
  if (type === 'onboarding') return <UserPlus className="h-4 w-4" />;
  if (type === 'security') return <KeyRound className="h-4 w-4" />;
  return <BellRing className="h-4 w-4" />;
};

type StaffAlertListProps = {
  alerts: StaffAlertBase[];
  className?: string;
  maxHeightClass?: string;
  emptyMessage?: string;
  onAlertClick?: (alert: StaffAlertBase) => void;
};

function AlertRow({
  alert,
  onClick,
}: {
  alert: StaffAlertBase;
  onClick?: () => void;
}) {
  const row = (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex gap-3 rounded-xl border px-3 py-2',
        sevClass[alert.severity],
        onClick && 'cursor-pointer hover:bg-white/[0.03] transition-colors'
      )}
    >
      <motion.div className="mt-0.5 text-violet-300">{iconFor(alert.type)}</motion.div>
      <motion.div className="min-w-0">
        <p className="text-xs text-zinc-200 leading-snug">{alert.message}</p>
        <p className="text-[10px] text-zinc-500 mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
      </motion.div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button type="button" className="w-full text-left" onClick={onClick}>
        {row}
      </button>
    );
  }

  return row;
}

export const StaffAlertList: React.FC<StaffAlertListProps> = ({
  alerts,
  className,
  maxHeightClass = 'max-h-[360px]',
  emptyMessage = 'All clear — no operational alerts.',
  onAlertClick,
}) => (
  <ul className={cn('space-y-2 flex-1 overflow-auto pr-1', maxHeightClass, className)}>
    {alerts.length === 0 ? (
      <li className="text-xs text-zinc-500 py-6 text-center">{emptyMessage}</li>
    ) : (
      alerts.map((a) => (
        <li key={a.id}>
          <AlertRow alert={a} onClick={onAlertClick ? () => onAlertClick(a) : undefined} />
        </li>
      ))
    )}
  </ul>
);

export default StaffAlertList;
