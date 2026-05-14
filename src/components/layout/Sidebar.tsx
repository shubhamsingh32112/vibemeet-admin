import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  {
    path: '/',
    label: 'Overview',
    icon: '📊',
  },
  {
    path: '/creators',
    label: 'Creators',
    icon: '🎓',
  },
  {
    path: '/users',
    label: 'Users',
    icon: '👥',
  },
  {
    path: '/coins',
    label: 'Coins & Txns',
    icon: '💰',
  },
  {
    path: '/calls',
    label: 'Calls & Billing',
    icon: '📞',
  },
  {
    path: '/withdrawals',
    label: 'Withdrawals',
    icon: '💸',
  },
  {
    path: '/bds',
    label: 'BD',
    icon: '🤝',
  },
  {
    path: '/agencies',
    label: 'Agencies',
    icon: '🏢',
  },
  {
    path: '/support',
    label: 'Support',
    icon: '🛟',
  },
  {
    path: '/system',
    label: 'System Health',
    icon: '⚙️',
  },
];

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  onNavigate,
  showClose,
  onClose,
}) => {
  const { logout, user } = useAuth();

  return (
    <aside
      className={`w-56 min-h-screen bg-admin-surface border-r border-admin-border flex flex-col ${className}`}
    >
      <div className="px-4 py-4 border-b border-admin-border flex items-start justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">
            Eazy Talks
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
            Super Admin
          </p>
        </div>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 min-w-10 shrink-0 rounded-xl border border-admin-border text-zinc-400 hover:text-white text-sm"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-3 min-h-[44px] text-sm transition-colors ${
                isActive
                  ? 'text-white bg-admin-elevated border-r-2 border-admin-accent'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-admin-elevated/60'
              }`
            }
          >
            <span className="text-base" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-admin-border px-4 py-3">
        <p className="text-xs text-zinc-500 truncate mb-2">{user?.email || 'Admin'}</p>
        <button
          type="button"
          onClick={logout}
          className="w-full text-left text-xs text-red-400 hover:text-red-300 transition min-h-[44px] py-2"
        >
          ← Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
