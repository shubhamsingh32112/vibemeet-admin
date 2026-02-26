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

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-800">
        <h1 className="text-base font-bold text-white tracking-tight">
          Eazy Talks
        </h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
          Admin Console
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                isActive
                  ? 'text-white bg-gray-800 border-r-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-gray-800 px-4 py-3">
        <p className="text-xs text-gray-500 truncate mb-2">
          {user?.email || 'Admin'}
        </p>
        <button
          onClick={logout}
          className="w-full text-left text-xs text-red-400 hover:text-red-300 transition"
        >
          ← Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
