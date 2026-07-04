import React, { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';
import { Coins } from 'lucide-react';

type Row = {
  rank: number;
  userId: string;
  username: string;
  email: string | null;
  phone: string | null;
  purchaseCount: number;
  totalRechargeCoins: number;
  totalRechargeInr: number;
  lastPurchaseAt: string;
};

const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const CoinsPaidUsersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getCoinsPaidUsers>> | null>(
    null
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getCoinsPaidUsers({ page, limit: 50 });
      setData(res);
    } catch {
      setError('Failed to load coin recharge buyers');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Row>[] = [
    { key: 'rank', header: '#', render: (r) => r.rank },
    {
      key: 'username',
      header: 'User',
      render: (r) => (
        <div>
          <p className="text-white text-sm">{r.username}</p>
          <p className="text-[10px] text-zinc-500">{r.email || r.phone || '—'}</p>
        </div>
      ),
    },
    { key: 'purchaseCount', header: 'Purchases', render: (r) => r.purchaseCount },
    {
      key: 'totalRechargeInr',
      header: 'Total INR',
      render: (r) => inrFmt.format(r.totalRechargeInr),
    },
    { key: 'totalRechargeCoins', header: 'Coins bought', render: (r) => r.totalRechargeCoins },
    { key: 'lastPurchaseAt', header: 'Last purchase', render: (r) => formatDateTime(r.lastPurchaseAt) },
  ];

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading title="Paid users — coins" helpKey="finance.coins_paid_users" level={1} />
        <p className="text-sm text-zinc-500 mt-1">
          Users who completed wallet recharges from the app (payment_gateway).
        </p>
      </div>
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPIStatCard
            title="Unique buyers"
            value={data.summary.uniqueBuyersAllTime}
            icon={<Coins className="h-5 w-5" />}
            helpKey="finance.coins_paid_users"
          />
          <KPIStatCard title="Buyers today" value={data.summary.buyersToday} icon={<Coins className="h-5 w-5" />} helpKey="finance.coins_paid_users" />
          <KPIStatCard title="Buyers 7d" value={data.summary.buyers7d} icon={<Coins className="h-5 w-5" />} helpKey="finance.coins_paid_users" />
          <KPIStatCard title="Buyers 30d" value={data.summary.buyers30d} icon={<Coins className="h-5 w-5" />} helpKey="finance.coins_paid_users" />
          <KPIStatCard
            title="INR collected 30d"
            value={data.summary.revenueInr30d}
            format="inr"
            icon={<Coins className="h-5 w-5" />}
            helpKey="finance.coins_paid_users"
          />
        </div>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <DataTable columns={columns} data={data?.rows ?? []} keyField="userId" />
      {(data?.pagination.totalPages ?? 1) > 1 && (
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
            Page {page} / {data?.pagination.totalPages ?? 1}
          </span>
          <button
            type="button"
            disabled={page >= (data?.pagination.totalPages ?? 1)}
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

export default CoinsPaidUsersPage;
