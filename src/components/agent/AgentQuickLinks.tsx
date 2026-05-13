import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, UserCircle, UserPlus, Wallet } from 'lucide-react';

const cardBase =
  'group rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4 transition hover:border-violet-500/30 hover:bg-zinc-900/80';

const items = [
  {
    to: '/agent/referred',
    label: 'Referred users',
    desc: 'Review signups and approve host onboarding',
    icon: <UserPlus className="h-5 w-5 text-amber-300" />,
    accent: 'bg-amber-500/15',
  },
  {
    to: '/agent/creators',
    label: 'Creators',
    desc: 'Manage hosts, performance and assignments',
    icon: <GraduationCap className="h-5 w-5 text-violet-300" />,
    accent: 'bg-violet-500/15',
  },
  {
    to: '/agent/withdrawals',
    label: 'Withdrawals',
    desc: 'Approve, reject or mark payouts as paid',
    icon: <Wallet className="h-5 w-5 text-orange-300" />,
    accent: 'bg-orange-500/15',
  },
  {
    to: '/agent/profile',
    label: 'Profile',
    desc: 'Account details and password',
    icon: <UserCircle className="h-5 w-5 text-sky-300" />,
    accent: 'bg-sky-500/15',
  },
];

const AgentQuickLinks: React.FC = () => {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
      <h2 className="text-sm font-semibold text-white">Quick actions</h2>
      <p className="mt-1 text-xs text-zinc-500">Jump to the areas you work in most often.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className={cardBase}>
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.accent}`}>
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-violet-400" />
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AgentQuickLinks;
