import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  GraduationCap,
  Wallet,
  Headphones,
} from 'lucide-react';
import { useAgentAuth } from '../../contexts/AgentAuthContext';

const items: Array<{
  path: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}> = [
  { path: '/agent', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/agent/referred', label: 'Referred users', icon: <Users className="h-4 w-4" /> },
  { path: '/agent/creators', label: 'Creators', icon: <GraduationCap className="h-4 w-4" /> },
  { path: '/agent/wallet', label: 'Wallet', icon: <Wallet className="h-4 w-4" /> },
  { path: '/agent/withdrawals', label: 'Host withdrawals', icon: <Wallet className="h-4 w-4" /> },
  { path: '/agent/profile', label: 'Profile', icon: <UserCircle className="h-4 w-4" /> },
  { path: '/agent/support', label: 'Support', icon: <Headphones className="h-4 w-4" /> },
];

type Props = {
  className?: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
};

const AgentSidebar: React.FC<Props> = ({
  className = '',
  onNavigate,
  showClose,
  onClose,
}) => {
  const { logout, user } = useAgentAuth();
  const bdLabel = user?.displayName?.trim() || user?.email || 'BD';

  return (
    <aside
      className={`flex w-60 min-h-screen flex-col border-r border-white/[0.06] bg-[#0c0c14]/95 ${className}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-lg">
            💜
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-white">MatchVibe</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">BD</p>
          </div>
        </div>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 min-w-10 shrink-0 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-sm"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto py-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              `mx-2 flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-violet-600/20 font-medium text-white ring-1 ring-violet-500/35'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
              }`
            }
          >
            <span
              className={
                item.path === '/agent' ||
                  item.path === '/agent/profile' ||
                  item.path === '/agent/support'
                  ? 'text-violet-300'
                  : 'text-zinc-500'
              }
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3 py-2.5 space-y-1">
          <p className="truncate text-xs font-medium text-white">{bdLabel}</p>
          <p className="truncate text-[10px] text-zinc-500">{user?.email}</p>
          {user?.referralCode ? (
            <p className="truncate font-mono text-[10px] text-emerald-400/90">{user.referralCode}</p>
          ) : null}
        </div>
        <Link
          to="/agent/support"
          onClick={() => onNavigate?.()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/25 hover:bg-violet-500"
        >
          <Headphones className="h-4 w-4" />
          Support
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl py-2 text-left text-xs text-red-400/90 transition hover:bg-red-500/10 min-h-[44px] px-2"
        >
          ← Sign out
        </button>
      </div>
    </aside>
  );
};

export default AgentSidebar;
