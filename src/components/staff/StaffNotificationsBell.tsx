import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { StaffAlert } from '../../types/staffAlert';
import StaffAlertList from './StaffAlertList';

type StaffNotificationsBellProps = {
  alerts: StaffAlert[];
  isLoading?: boolean;
  isError?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  variant?: 'icon' | 'agency';
};

export const StaffNotificationsBell: React.FC<StaffNotificationsBellProps> = ({
  alerts,
  isLoading = false,
  isError = false,
  onOpenChange,
  triggerClassName,
  variant = 'icon',
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const count = alerts.length;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const handleAlertClick = (alert: StaffAlert) => {
    setOpen(false);
    navigate(alert.href);
  };

  const trigger =
    variant === 'agency' ? (
      <button
        type="button"
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-300 transition hover:border-violet-500/40 hover:text-white',
          triggerClassName
        )}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>
    ) : (
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative rounded-full border border-white/10', triggerClassName)}
        type="button"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-fuchsia-600 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </Button>
    );

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,92vw)] p-0">
        <div className="p-3">
          <p className="text-sm font-semibold text-white mb-2">Notifications</p>
          {isLoading ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Loading…</p>
          ) : isError ? (
            <p className="text-xs text-red-300/90 py-4 text-center">Could not load notifications.</p>
          ) : (
            <StaffAlertList
              alerts={alerts}
              maxHeightClass="max-h-[min(360px,50vh)]"
              emptyMessage="All clear — no notifications."
              onAlertClick={(a) => handleAlertClick(a as StaffAlert)}
            />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StaffNotificationsBell;
