import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAdminDateRange } from '../../hooks/useAdminDateRange';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const SOURCE_MAP: Record<string, string> = {
  calls: 'video_call',
  vip: 'vip_membership',
  moments: 'moment_purchase',
};

const TITLE_MAP: Record<string, string> = {
  calls: 'Payment call logs',
  vip: 'Payment VIP logs',
  moments: 'Payment moments logs',
};

type Tx = {
  id: string;
  username: string;
  type: string;
  coins: number;
  status: string;
  description?: string;
  callId?: string;
  createdAt: string;
};

const FinancePaymentsPage: React.FC = () => {
  const { kind } = useParams<{ kind: string }>();
  const source = SOURCE_MAP[kind ?? 'calls'] ?? 'video_call';
  const title = TITLE_MAP[kind ?? 'calls'] ?? 'Payments';
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { dateRange } = useAdminDateRange('last30d');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getFinancePayments({
        page,
        limit: 50,
        source,
        from: dateRange.from,
        to: dateRange.to,
      });
      setRows(data.transactions);
      setTotalPages(data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, source, dateRange.from, dateRange.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Tx>[] = [
    { key: 'createdAt', header: 'Date', render: (r) => formatDateTime(r.createdAt) },
    { key: 'username', header: 'User', render: (r) => r.username },
    { key: 'type', header: 'Type', render: (r) => r.type },
    { key: 'coins', header: 'Coins', render: (r) => r.coins },
    { key: 'status', header: 'Status', render: (r) => r.status },
    { key: 'callId', header: 'Call ID', render: (r) => r.callId ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>
      {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={rows} keyField="id" />}
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

export default FinancePaymentsPage;
