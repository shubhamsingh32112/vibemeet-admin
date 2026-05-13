import * as React from 'react';
import { Wallet } from 'lucide-react';
import type { AgencyDashboardData } from '../../services/agencyPortalService';

type Props = { d: AgencyDashboardData };

const AgencyRecentActivity: React.FC<Props> = ({ d }) => {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
      <h2 className="text-sm font-semibold text-white">Recent activity</h2>
      <ul className="mt-3 space-y-2">
        {d.recentActivity.length === 0 ? (
          <li className="text-xs text-zinc-500">No recent events.</li>
        ) : (
          d.recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 rounded-xl border border-white/[0.04] bg-zinc-900/40 px-3 py-2.5"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                <Wallet className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-200">{item.message}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  {new Date(item.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default AgencyRecentActivity;
