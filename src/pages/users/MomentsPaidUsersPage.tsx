import React, { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';
import { Sparkles } from 'lucide-react';

type Row = {
  rank: number;
  userId: string;
  username: string;
  purchaseCount: number;
  totalCoinsSpent: number;
  firstPurchaseAt: string;
  lastPurchaseAt: string;
};

const MomentsPaidUsersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getMomentsPaidUsers>> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getMomentsPaidUsers({ page, limit: 50 });
      setData(res);
    } catch {
      setError('Failed to load moments paid users');
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
    { key: 'purchaseCount', header: 'Purchases', render: (r) => r.purchaseCount },
    { key: 'totalCoinsSpent', header: 'Coins spent', render: (r) => r.totalCoinsSpent },
    {
      key: 'lastPurchaseAt',
      header: 'Last purchase',
      render: (r) => formatDateTime(r.lastPurchaseAt),
    },
  ];

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Paid users — moments</h1>
        <p className="text-sm text-zinc-500 mt-1">Coin and VIP-discounted moment purchases (excludes refunds).</p>
      </div>
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIStatCard title="Buyers today" value={data.summary.uniqueBuyersToday} icon={<Sparkles className="h-5 w-5" />} />
          <KPIStatCard title="Buyers 7d" value={data.summary.uniqueBuyers7d} icon={<Sparkles className="h-5 w-5" />} />
          <KPIStatCard title="Buyers 30d" value={data.summary.uniqueBuyers30d} icon={<Sparkles className="h-5 w-5" />} />
          <KPIStatCard title="Revenue (coins)" value={data.summary.totalRevenueCoins} icon={<Sparkles className="h-5 w-5" />} />
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

export default MomentsPaidUsersPage;
