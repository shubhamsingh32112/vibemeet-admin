import React, { useCallback, useEffect, useState } from 'react';
import WithdrawalsPage from '../WithdrawalsPage';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';
import { Wallet } from 'lucide-react';

type Tab = 'requests' | 'settlements';

type Settlement = {
  withdrawalId: string;
  amount: number;
  status: string;
  processedAt?: string;
  staffUserId: string | null;
  creatorUserId: string | null;
};

const FinancePayoutsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('requests');
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof adminService.getFinancePayoutsSummary>> | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    void adminService.getFinancePayoutsSummary('30d').then(setSummary).catch(() => {});
  }, []);

  const loadSettlements = useCallback(async () => {
    if (tab !== 'settlements') return;
    try {
      setLoading(true);
      const data = await adminService.getFinanceSettlements({ page, limit: 50 });
      setSettlements(data.settlements);
      setTotalPages(data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  const settlementCols: Column<Settlement>[] = [
    { key: 'withdrawalId', header: 'ID', render: (r) => r.withdrawalId.slice(-8) },
    { key: 'amount', header: 'Amount', render: (r) => r.amount },
    { key: 'status', header: 'Status', render: (r) => r.status },
    { key: 'processedAt', header: 'Paid at', render: (r) => (r.processedAt ? formatDateTime(r.processedAt) : '—') },
    {
      key: 'party',
      header: 'Party',
      render: (r) => (r.staffUserId ? `Staff ${r.staffUserId.slice(-6)}` : r.creatorUserId ? `Host ${r.creatorUserId.slice(-6)}` : '—'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading title="Payouts & settlements" helpKey="finance.payouts" level={1} />
        <p className="text-sm text-zinc-500 mt-1">Withdrawal requests and completed settlements.</p>
      </div>
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIStatCard title="Host payouts (30d)" value={summary.hostPayoutsCoins} icon={<Wallet className="h-5 w-5" />} helpKey="finance.payouts" />
          <KPIStatCard title="BD payouts (30d)" value={summary.bdPayoutsCoins} icon={<Wallet className="h-5 w-5" />} helpKey="finance.payouts" />
          <KPIStatCard title="Agency payouts (30d)" value={summary.agencyPayoutsCoins} icon={<Wallet className="h-5 w-5" />} helpKey="finance.payouts" />
          <KPIStatCard title="Total paid (30d)" value={summary.totalPayoutsCoins} icon={<Wallet className="h-5 w-5" />} helpKey="finance.payouts" />
        </div>
      )}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`px-4 py-2 text-sm rounded-lg ${tab === 'requests' ? 'bg-violet-600/30 text-white' : 'text-zinc-400'}`}
        >
          Payout requests (hosts)
        </button>
        <button
          type="button"
          onClick={() => setTab('settlements')}
          className={`px-4 py-2 text-sm rounded-lg ${tab === 'settlements' ? 'bg-violet-600/30 text-white' : 'text-zinc-400'}`}
        >
          Settlements
        </button>
      </div>
      {tab === 'requests' ? (
        <WithdrawalsPage embedded variant="creator" />
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <DataTable columns={settlementCols} data={settlements} keyField="withdrawalId" />
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-white/10 text-sm disabled:opacity-40">Previous</button>
              <span className="text-sm text-zinc-400 self-center">Page {page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-white/10 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancePayoutsPage;
