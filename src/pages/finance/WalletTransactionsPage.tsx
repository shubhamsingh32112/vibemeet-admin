import React, { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DateRangeFilter from '../../components/filters/DateRangeFilter';
import { useAdminDateRange } from '../../hooks/useAdminDateRange';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

type Tx = {
  id: string;
  transactionId: string;
  username: string;
  type: string;
  coins: number;
  source: string;
  status: string;
  description?: string;
  createdAt: string;
};

const WalletTransactionsPage: React.FC = () => {
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { dateRange, setPreset, setCustom } = useAdminDateRange('last30d');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getWalletTransactions({
        page,
        limit: 50,
        from: dateRange.from,
        to: dateRange.to,
      });
      setRows(data.transactions);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setError('Failed to load wallet transactions');
    } finally {
      setLoading(false);
    }
  }, [page, dateRange.from, dateRange.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Tx>[] = [
    { key: 'createdAt', header: 'Date', render: (r) => formatDateTime(r.createdAt) },
    { key: 'username', header: 'User', render: (r) => r.username },
    { key: 'type', header: 'Type', render: (r) => r.type },
    { key: 'source', header: 'Source', render: (r) => r.source },
    { key: 'coins', header: 'Coins', render: (r) => r.coins },
    { key: 'status', header: 'Status', render: (r) => r.status },
    {
      key: 'description',
      header: 'Description',
      render: (r) => (
        <span className="truncate max-w-[200px] block" title={r.description}>
          {r.description ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Wallet transactions</h1>
          <p className="text-sm text-zinc-500 mt-1">All completed and pending coin ledger entries.</p>
        </div>
        <DateRangeFilter
          value={dateRange}
          onPresetChange={setPreset}
          onCustomChange={(from, to) => setCustom(from, to)}
        />
      </div>
      {loading ? <LoadingSpinner /> : null}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <DataTable columns={columns} data={rows} keyField="id" />
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-white/10 text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-zinc-400 self-center">Page {page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-white/10 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
};

export default WalletTransactionsPage;
