import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Gift,
  Headphones,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  Percent,
  Phone,
  PieChart,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Trophy,
  UserX,
  Users,
  Video,
  Wallet,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminShell } from '../../../contexts/AdminShellContext';
import { Badge } from '../../ui/badge';

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: number;
  live?: boolean;
};

type NavSection = { title: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, live: true }],
  },
  {
    title: 'User management',
    items: [
      { to: '/agencies', label: 'Agencies', icon: Building2 },
      { to: '/bds', label: 'BDs', icon: Users },
      { to: '/creators', label: 'Hosts', icon: Users },
      { to: '/blocked-users', label: 'Blocked Users', icon: UserX },
      { to: '/kyc', label: 'KYC Verification', icon: ShieldCheck },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { to: '/analytics/revenue', label: 'Revenue Analytics', icon: LineChart },
      { to: '/calls', label: 'Call Analytics', icon: Phone },
      { to: '/users', label: 'User Activity', icon: Activity },
      { to: '/leaderboards', label: 'Leaderboards', icon: Trophy },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/withdrawals', label: 'Payout Requests', icon: Wallet },
      { to: '/settlements', label: 'Settlements', icon: ArrowRightLeft },
      { to: '/coins', label: 'Wallet Transactions', icon: Receipt },
      { to: '/revenue-split', label: 'Revenue Split', icon: PieChart },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { to: '/calls', label: 'Live Calls', icon: Video },
      { to: '/call-logs', label: 'Call Logs', icon: ScrollText },
      { to: '/fraud', label: 'Fraud Detection', icon: AlertTriangle },
      { to: '/quality', label: 'Quality Monitoring', icon: Headphones },
    ],
  },
  {
    title: 'Incentives',
    items: [
      { to: '/incentives/rules', label: 'Incentive Rules', icon: ListOrdered },
      { to: '/incentives/tracking', label: 'Incentive Tracking', icon: Gift },
    ],
  },
  {
    title: 'Settings',
    items: [
      { to: '/system', label: 'Platform Settings', icon: Settings },
      { to: '/commission', label: 'Commission Settings', icon: Percent },
      { to: '/system-logs', label: 'System Logs', icon: ScrollText },
    ],
  },
];

type SuperAdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
};

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  className = '',
  onNavigate,
  showClose,
  onClose,
}) => {
  const { logout, user } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useAdminShell();

  return (
    <aside
      className={cn(
        'min-h-screen bg-admin-surface/95 border-r border-admin-border flex flex-col backdrop-blur-xl transition-[width] duration-300 ease-out',
        sidebarCollapsed ? 'w-[4.25rem]' : 'w-56',
        className
      )}
    >
      <div className="px-3 py-4 border-b border-admin-border flex items-center gap-2 justify-between">
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight truncate">MatchVibe</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Super Admin</p>
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {showClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden min-h-10 min-w-10 rounded-lg border border-white/10 text-zinc-400 hover:text-white text-sm"
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-3">
            {!sidebarCollapsed && (
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={`${section.title}-${item.to}-${item.label}`}
                    to={item.to}
                    end={item.end}
                    title={sidebarCollapsed ? item.label : undefined}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-2.5 rounded-lg py-2.5 min-h-[42px] text-sm transition-all',
                        sidebarCollapsed ? 'justify-center px-0' : 'px-3',
                        isActive
                          ? 'text-white bg-gradient-to-r from-violet-600/25 to-fuchsia-600/10 shadow-glow-sm border border-violet-500/20'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
                      )
                    }
                  >
                    <span className="relative shrink-0">
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                      {item.live ? (
                        <span className="absolute -right-1 -top-1 flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                      ) : null}
                    </span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="truncate flex-1">{item.label}</span>
                        {item.live ? (
                          <Badge variant="live" className="text-[9px] px-1 py-0 font-bold">
                            LIVE
                          </Badge>
                        ) : null}
                        {item.badge != null && item.badge > 0 ? (
                          <span className="text-[10px] rounded-full bg-violet-600 px-1.5 py-0.5 text-white font-semibold">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-admin-border px-3 py-3">
        {!sidebarCollapsed && (
          <p className="text-xs text-zinc-500 truncate mb-2" title={user?.email}>
            {user?.email || 'Admin'}
          </p>
        )}
        <button
          type="button"
          onClick={logout}
          className={cn(
            'w-full text-left text-xs text-red-400/90 hover:text-red-300 transition min-h-[40px]',
            sidebarCollapsed ? 'text-center' : ''
          )}
        >
          {sidebarCollapsed ? '⎋' : '← Sign out'}
        </button>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
