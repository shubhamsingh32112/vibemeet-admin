import React, { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import StatusBadge from '../../components/ui/StatusBadge';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';
import { Crown } from 'lucide-react';

type Row = {
  rank: number;
  userId: string;
  username: string;
  status: string;
  planId: string;
  daysRemaining: number;
  startedAt: string;
  expiresAt: string;
  coinsPaid: number;
  paidAt: string;
};

type StatusFilter = 'all' | 'active' | 'expired';

const VipPaidUsersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getVipPaidUsers>> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getVipPaidUsers({
        page,
        limit: 50,
        status: statusFilter,
      });
      setData(res);
    } catch {
      setError('Failed to load VIP paid users');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Row>[] = [
    { key: 'rank', header: '#', render: (r) => r.rank },
    { key: 'username', header: 'User', render: (r) => r.username },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <StatusBadge
          variant={r.status === 'active' ? 'online' : 'offline'}
          label={r.status}
        />
      ),
    },
    { key: 'planId', header: 'Plan', render: (r) => r.planId },
    {
      key: 'daysRemaining',
      header: 'Days left',
      render: (r) =>
        r.status === 'active' ? (
          <StatusBadge
            variant={r.daysRemaining <= 7 ? 'warning' : 'info'}
            label={String(r.daysRemaining)}
          />
        ) : (
          '—'
        ),
    },
    { key: 'coinsPaid', header: 'Coins paid', render: (r) => r.coinsPaid },
    { key: 'startedAt', header: 'Started', render: (r) => formatDateTime(r.startedAt) },
    { key: 'expiresAt', header: 'Expires', render: (r) => formatDateTime(r.expiresAt) },
  ];

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading title="Paid users — VIP" helpKey="finance.vip_paid_users" level={1} />
        <p className="text-sm text-zinc-500 mt-1">VIP memberships and purchase ledger.</p>
      </div>
      <div className="flex gap-2">
        {(['all', 'active', 'expired'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setPage(1);
              setStatusFilter(tab);
            }}
            className={`px-3 py-1 rounded border text-sm ${
              statusFilter === tab
                ? 'border-amber-400 text-amber-300'
                : 'border-white/10 text-zinc-400'
            }`}
          >
            {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : 'Expired'}
          </button>
        ))}
      </div>
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIStatCard title="Active members" value={data.summary.activeMembers} icon={<Crown className="h-5 w-5" />} helpKey="finance.vip_paid_users" />
          <KPIStatCard title="New today" value={data.summary.newPurchasesToday} icon={<Crown className="h-5 w-5" />} helpKey="finance.vip_paid_users" />
          <KPIStatCard title="New 7d" value={data.summary.newPurchases7d} icon={<Crown className="h-5 w-5" />} helpKey="finance.vip_paid_users" />
          <KPIStatCard title="Revenue 30d (coins)" value={data.summary.revenueCoins30d} icon={<Crown className="h-5 w-5" />} helpKey="finance.vip_paid_users" />
        </div>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <DataTable columns={columns} data={data?.rows ?? []} keyField="userId" />
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border border-white/10 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-400 self-center">
            Page {page} / {data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border border-white/10 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default VipPaidUsersPage;
