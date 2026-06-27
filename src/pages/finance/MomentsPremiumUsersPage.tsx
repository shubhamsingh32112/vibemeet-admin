import React, { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';
import { Sparkles } from 'lucide-react';

type Row = {
  rank: number;
  userId: string;
  username: string;
  status: string;
  planId: string;
  daysRemaining: number;
  startedAt: string;
  expiresAt: string;
  priceInr: number;
  paidAt: string;
};

const MomentsPremiumUsersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getMomentsPremiumUsers>> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getMomentsPremiumUsers({ page, limit: 50 });
      setData(res);
    } catch {
      setError('Failed to load Moments premium users');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Row>[] = [
    { key: 'rank', header: '#', render: (r) => r.rank },
    { key: 'username', header: 'User', render: (r) => r.username },
    {
      key: 'status',
      header: 'Premium',
      render: (r) => (
        <StatusBadge
          variant={r.status === 'active' ? 'online' : 'offline'}
          label={r.status === 'active' ? 'Active' : r.status}
        />
      ),
    },
    { key: 'planId', header: 'Plan', render: (r) => r.planId },
    {
      key: 'daysRemaining',
      header: 'Days left',
      render: (r) => (r.status === 'active' ? r.daysRemaining : '—'),
    },
    { key: 'priceInr', header: 'Price (₹)', render: (r) => (r.priceInr > 0 ? r.priceInr : '—') },
    { key: 'startedAt', header: 'Started', render: (r) => formatDateTime(r.startedAt) },
    { key: 'expiresAt', header: 'Expires', render: (r) => formatDateTime(r.expiresAt) },
    { key: 'paidAt', header: 'Last purchase', render: (r) => formatDateTime(r.paidAt) },
  ];

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Moments premium users</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Users who purchased Moments Premium and their remaining subscription days.
        </p>
      </div>
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPIStatCard title="Active members" value={data.summary.activeMembers} icon={<Sparkles className="h-5 w-5" />} />
          <KPIStatCard title="New today" value={data.summary.newPurchasesToday} icon={<Sparkles className="h-5 w-5" />} />
          <KPIStatCard title="New 7d" value={data.summary.newPurchases7d} icon={<Sparkles className="h-5 w-5" />} />
          <KPIStatCard title="New 30d" value={data.summary.newPurchases30d} icon={<Sparkles className="h-5 w-5" />} />
          <KPIStatCard title="Revenue 30d (₹)" value={data.summary.revenueInr30d} icon={<Sparkles className="h-5 w-5" />} />
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

export default MomentsPremiumUsersPage;
