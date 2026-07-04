import React, { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import { useAdminDateRange } from '../../hooks/useAdminDateRange';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

type PurchaseRow = {
  id: string;
  username: string;
  product: string;
  planLabel: string;
  amountInr: number;
  coins: number | null;
  status: string;
  paymentId: string | null;
  orderId: string | null;
  createdAt: string;
};

const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const PaymentLogsPage: React.FC = () => {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const { dateRange } = useAdminDateRange('last30d');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getPaymentPurchaseLogs({
        page,
        limit: 50,
        from: dateRange.from,
        to: dateRange.to,
      });
      setRows(data.purchases);
      setTotalPages(data.pagination.totalPages);
      setTotalPurchases(data.pagination.total);
    } finally {
      setLoading(false);
    }
  }, [page, dateRange.from, dateRange.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<PurchaseRow>[] = [
    { key: 'createdAt', header: 'Date', render: (r) => formatDateTime(r.createdAt) },
    { key: 'username', header: 'User', render: (r) => r.username },
    { key: 'product', header: 'Product', render: (r) => r.product },
    {
      key: 'planLabel',
      header: 'Plan / details',
      render: (r) => (
        <span className="max-w-xs truncate block" title={r.planLabel}>
          {r.planLabel}
        </span>
      ),
    },
    {
      key: 'amountInr',
      header: 'Amount',
      render: (r) => (r.amountInr > 0 ? inrFmt.format(r.amountInr) : '—'),
    },
    {
      key: 'coins',
      header: 'Coins',
      render: (r) => (r.coins != null && r.coins > 0 ? r.coins.toLocaleString() : '—'),
    },
    { key: 'status', header: 'Status', render: (r) => r.status },
    {
      key: 'paymentId',
      header: 'Payment ID',
      render: (r) => (
        <span className="font-mono text-xs text-zinc-400 truncate block max-w-[140px]" title={r.paymentId ?? r.orderId ?? undefined}>
          {r.paymentId ?? r.orderId ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionHeading title="Payment logs" helpKey="finance.payments" level={1} />
          <p className="text-sm text-zinc-500 mt-1">
            Successful Razorpay purchases — coins, Moments Premium, and VIP ({totalPurchases} total
            {dateRange.preset !== 'all' ? ` · ${dateRange.preset}` : ''}).
          </p>
        </div>
      </div>
      {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={rows} keyField="id" />}
      {totalPages > 1 && (
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
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
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

export default PaymentLogsPage;
