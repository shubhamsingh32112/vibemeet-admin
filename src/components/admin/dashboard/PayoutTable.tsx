import * as React from 'react';
import { cn } from '../../../lib/utils';
import StatusBadge from '../../ui/StatusBadge';

export type PayoutRow = {
  id: string;
  userLabel: string;
  role: string;
  amount: number;
  requestedAt: string;
  status: string;
};

function payoutBadge(status: string) {
  const s = status.toLowerCase();
  if (s === 'pending') return { variant: 'warning' as const, label: 'Pending' };
  if (s === 'approved') return { variant: 'info' as const, label: 'Approved' };
  if (s === 'rejected') return { variant: 'danger' as const, label: 'Rejected' };
  if (s === 'paid') return { variant: 'success' as const, label: 'Paid' };
  return { variant: 'neutral' as const, label: status };
}

type PayoutTableProps = {
  rows: PayoutRow[];
  loading?: boolean;
  className?: string;
};

export const PayoutTable: React.FC<PayoutTableProps> = ({ rows, loading, className }) => (
  <div className={cn('glass-panel rounded-2xl p-4', className)}>
    <h3 className="text-sm font-semibold text-white mb-3">Recent payout requests</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 text-zinc-500">
            <th className="py-2 px-2">User</th>
            <th className="py-2 px-2">Role</th>
            <th className="py-2 px-2">Amount</th>
            <th className="py-2 px-2">Requested</th>
            <th className="py-2 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="py-6 text-zinc-500 px-2">
                Loading…
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="py-2 px-2 text-zinc-200 max-w-[140px] truncate">{r.userLabel}</td>
                <td className="py-2 px-2 text-zinc-400">{r.role}</td>
                <td className="py-2 px-2 tabular-nums text-white">{r.amount}</td>
                <td className="py-2 px-2 text-zinc-500">{new Date(r.requestedAt).toLocaleString()}</td>
                <td className="py-2 px-2">
                  <StatusBadge {...payoutBadge(r.status)} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default PayoutTable;
