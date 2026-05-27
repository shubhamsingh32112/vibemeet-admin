import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gift,
  Headphones,
  LifeBuoy,
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

type NavSection = { id: string; title: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    id: 'user-management',
    title: 'User management',
    items: [
      { to: '/agencies', label: 'Agencies', icon: Building2 },
      { to: '/bds', label: 'BDs', icon: Users },
      { to: '/creators', label: 'Hosts', icon: Users },
      { to: '/blocked-hosts', label: 'Blocked Hosts', icon: UserX },
      { to: '/kyc', label: 'KYC Verification', icon: ShieldCheck },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    items: [
      { to: '/analytics/revenue', label: 'Revenue Analytics', icon: LineChart },
      { to: '/calls', label: 'Call Analytics', icon: Phone },
      { to: '/users', label: 'User Activity', icon: Activity },
      { to: '/leaderboards', label: 'Leaderboards', icon: Trophy },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    items: [
      { to: '/withdrawals', label: 'Payout Requests', icon: Wallet },
      { to: '/settlements', label: 'Settlements', icon: ArrowRightLeft },
      { to: '/coins', label: 'Wallet Transactions', icon: Receipt },
      { to: '/revenue-split', label: 'Revenue Split', icon: PieChart },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    items: [
      { to: '/support', label: 'Support', icon: LifeBuoy },
      { to: '/calls', label: 'Live Calls', icon: Video },
      { to: '/call-logs', label: 'Call Logs', icon: ScrollText },
      { to: '/fraud', label: 'Fraud Detection', icon: AlertTriangle },
      { to: '/quality', label: 'Quality Monitoring', icon: Headphones },
    ],
  },
  {
    id: 'incentives',
    title: 'Incentives',
    items: [
      { to: '/incentives/rules', label: 'Incentive Rules', icon: ListOrdered },
      { to: '/incentives/tracking', label: 'Incentive Tracking', icon: Gift },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    items: [
      { to: '/system', label: 'Platform Settings', icon: Settings },
      { to: '/commission', label: 'Commission Settings', icon: Percent },
      { to: '/system-logs', label: 'System Logs', icon: ScrollText },
    ],
  },
];

const DASHBOARD_ITEM: NavItem = {
  to: '/',
  label: 'Dashboard',
  icon: LayoutDashboard,
  end: true,
  live: true,
};

const SECTIONS_STORAGE_KEY = 'mv_admin_sidebar_sections_open';

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.end) {
    return pathname === item.to || (item.to !== '/' && pathname === item.to);
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function sectionIsActive(pathname: string, section: NavSection): boolean {
  return section.items.some((item) => isItemActive(pathname, item));
}

function readStoredOpenSections(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(SECTIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistOpenSections(open: Record<string, boolean>) {
  try {
    localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(open));
  } catch {
    /* ignore */
  }
}

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
  const { pathname, search } = useLocation();
  const preservedSearch = React.useMemo(() => {
    const current = new URLSearchParams(search);
    const next = new URLSearchParams();
    for (const key of ['drPreset', 'drFrom', 'drTo']) {
      const value = current.get(key);
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `?${qs}` : '';
  }, [search]);

  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
    const stored = readStoredOpenSections();
    const initial: Record<string, boolean> = { ...stored };
    for (const section of SECTIONS) {
      if (sectionIsActive(pathname, section)) {
        initial[section.id] = true;
      }
    }
    return initial;
  });

  React.useEffect(() => {
    setOpenSections((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const section of SECTIONS) {
        if (sectionIsActive(pathname, section) && !next[section.id]) {
          next[section.id] = true;
          changed = true;
        }
      }
      if (changed) persistOpenSections(next);
      return changed ? next : prev;
    });
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      persistOpenSections(next);
      return next;
    });
  };

  const renderNavItem = (item: NavItem, keyPrefix: string) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={`${keyPrefix}-${item.to}-${item.label}`}
        to={{ pathname: item.to, search: preservedSearch }}
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
  };

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
        <div className="px-2 mb-2">{renderNavItem(DASHBOARD_ITEM, 'main')}</div>

        {SECTIONS.map((section) => {
          const isOpen = openSections[section.id] ?? false;
          const active = sectionIsActive(pathname, section);

          if (sidebarCollapsed) {
            return (
              <div key={section.id} className="mb-2 px-2 space-y-0.5">
                {section.items.map((item) => renderNavItem(item, section.id))}
              </div>
            );
          }

          return (
            <div key={section.id} className="mb-1 px-2">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 min-h-[40px] text-left text-sm transition-colors',
                  active
                    ? 'text-zinc-100 bg-white/[0.04] border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                )}
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                  aria-hidden
                />
                <span className="flex-1 truncate font-medium text-[11px] uppercase tracking-wider">
                  {section.title}
                </span>
              </button>

              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-0.5 pt-0.5 pb-1 pl-2 ml-2 border-l border-white/10">
                    {section.items.map((item) => renderNavItem(item, section.id))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
