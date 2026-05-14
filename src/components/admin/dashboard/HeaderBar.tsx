import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, CalendarDays, Circle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminRealtime } from '../../../contexts/AdminRealtimeContext';
import DateRangeFilter from '../../filters/DateRangeFilter';
import { useAdminDateRange } from '../../../hooks/useAdminDateRange';
import api from '../../../config/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

const ROUTE_TITLES: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: (p) => p === '/' || p === '/dashboard', title: 'Command center' },
  { match: (p) => p.startsWith('/creators'), title: 'Hosts' },
  { match: (p) => p.startsWith('/users'), title: 'Users' },
  { match: (p) => p.startsWith('/coins'), title: 'Wallet & transactions' },
  { match: (p) => p.startsWith('/calls') || p.startsWith('/call-logs'), title: 'Calls & billing' },
  { match: (p) => p.startsWith('/withdrawals'), title: 'Payout requests' },
  { match: (p) => p.startsWith('/support'), title: 'Support' },
  { match: (p) => p.startsWith('/system'), title: 'System health' },
  { match: (p) => p.startsWith('/agents'), title: 'BDs' },
  { match: (p) => p.startsWith('/agencies'), title: 'Agencies' },
  { match: (p) => p.startsWith('/overview'), title: 'Operations overview' },
];

function titleForPath(pathname: string): string {
  const hit = ROUTE_TITLES.find((r) => r.match(pathname));
  return hit?.title ?? 'Super Admin';
}

async function fetchRealtimeAlerts() {
  const res = await api.get('/admin/realtime-metrics');
  const d = res.data?.data as {
    pendingWithdrawals?: number;
    openSupportTickets?: number;
  };
  const n = (d?.pendingWithdrawals ?? 0) + (d?.openSupportTickets ?? 0);
  return n;
}

export const HeaderBar: React.FC = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { connected, lastError } = useAdminRealtime();
  const { dateRange, setPreset, setCustom } = useAdminDateRange('today');
  const showDate = pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/overview');

  const { data: alertCount = 0 } = useQuery({
    queryKey: ['admin', 'realtime-metrics', 'header-bell'],
    queryFn: fetchRealtimeAlerts,
    refetchInterval: 45_000,
  });

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-white/8 bg-[#08080f]/90 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">{titleForPath(pathname)}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''} ·{' '}
            {new Intl.DateTimeFormat(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date())}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]',
              connected ? 'border-emerald-500/30 text-emerald-300/90' : 'border-amber-500/25 text-amber-200/90'
            )}
            title={lastError || undefined}
          >
            <Circle className={cn('h-2 w-2 fill-current', connected ? 'text-emerald-400' : 'text-amber-400')} />
            {connected ? 'Live' : 'Reconnecting'}
          </div>

          <Button variant="ghost" size="icon" className="relative rounded-full border border-white/10" type="button">
            <Bell className="h-4 w-4" />
            {alertCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-fuchsia-600 px-1 text-[10px] font-bold text-white">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            ) : null}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full border-white/10 gap-2">
                <span className="hidden sm:inline max-w-[140px] truncate">{user?.email ?? 'Profile'}</span>
                <span className="sm:hidden">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled>My profile</DropdownMenuItem>
              <DropdownMenuItem disabled>Admin settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  void logout();
                }}
                className="text-red-300 focus:text-red-200"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showDate ? (
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="h-4 w-4 text-zinc-500 hidden sm:block" />
          <DateRangeFilter value={dateRange} onPresetChange={setPreset} onCustomChange={setCustom} className="" />
        </div>
      ) : null}
    </header>
  );
};

export default HeaderBar;
