import React, { useCallback, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { useAgencyAuth } from '../../contexts/AgencyAuthContext';
import { buildReferralJoinUrl } from '../../utils/referralJoinLink';

const items = [
  { path: '/agency', label: 'Dashboard', icon: '📊', end: true },
  { path: '/agency/referred', label: 'Referred users', icon: '👥' },
  { path: '/agency/creators', label: 'Creators', icon: '🎓' },
  { path: '/agency/withdrawals', label: 'Withdrawals', icon: '💸' },
  { path: '/agency/wallet', label: 'Wallet', icon: '💰' },
  { path: '/agency/profile', label: 'Profile', icon: '👤' },
  { path: '/agency/support', label: 'Support', icon: '🎧' },
];

type Props = {
  className?: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
};

const AgencySidebar: React.FC<Props> = ({
  className = '',
  onNavigate,
  showClose,
  onClose,
}) => {
  const { logout, user } = useAgencyAuth();
  const [codeCopied, setCodeCopied] = useState(false);
  const referralCode = user?.referralCode?.trim().toUpperCase() || '';

  const copyCode = useCallback(async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1500);
    } catch {
      setCodeCopied(false);
    }
  }, [referralCode]);

  const copyLink = useCallback(async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(buildReferralJoinUrl(referralCode));
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1500);
    } catch {
      setCodeCopied(false);
    }
  }, [referralCode]);

  return (
    <aside
      className={`w-56 min-h-screen bg-admin-surface border-r border-admin-border flex flex-col ${className}`}
    >
      <div className="px-4 py-4 border-b border-admin-border flex items-start justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Eazy Talks</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Agency Portal</p>
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
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
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
      <div className="border-t border-admin-border px-4 py-3 space-y-2">
        <p className="text-[10px] text-zinc-500">Referral code</p>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-mono text-emerald-400 flex-1 truncate">
            {referralCode || '—'}
          </p>
          {referralCode ? (
            <button
              type="button"
              onClick={copyCode}
              className="shrink-0 rounded p-1 text-zinc-500 hover:text-violet-300 transition"
              aria-label={codeCopied ? 'Copied' : 'Copy referral code'}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        {referralCode ? (
          <div className="flex flex-col gap-1">
            <Link
              to="/agency#referral-link"
              onClick={() => onNavigate?.()}
              className="text-[11px] text-violet-400 hover:text-violet-300 transition"
            >
              Share referral link →
            </Link>
            <button
              type="button"
              onClick={copyLink}
              className="text-left text-[11px] text-zinc-500 hover:text-zinc-300 transition"
            >
              {codeCopied ? 'Link copied' : 'Copy join link'}
            </button>
          </div>
        ) : null}
        <p className="text-xs text-zinc-500 truncate pt-1">{user?.email}</p>
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

export default AgencySidebar;
