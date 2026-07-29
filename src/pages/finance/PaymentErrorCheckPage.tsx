import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import { adminService, type PaymentErrorCheckResult } from '../../services/adminService';
import {
  formatIstDateTime,
  fromDatetimeLocalAsIst,
  toDatetimeLocalInputValueFromIst,
} from '../../utils/istTime';

const FIELD_ROWS: Array<{
  key: keyof NonNullable<PaymentErrorCheckResult['gotCoins'][number]>;
  label: string;
}> = [
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'amountLabel', label: 'Amount' },
  { key: 'paymentId', label: 'Payment ID' },
  { key: 'orderId', label: 'Order ID' },
  { key: 'razorpayLabel', label: 'Razorpay' },
  { key: 'mongoTxLabel', label: 'Mongo tx' },
  { key: 'walletNow', label: 'Wallet now' },
  { key: 'whenUtc', label: 'When (UTC)' },
];

function defaultRangeIso(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function cellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

const PaymentErrorCheckPage: React.FC = () => {
  const defaults = useMemo(() => defaultRangeIso(), []);
  const [fromIso, setFromIso] = useState(defaults.from);
  const [toIso, setToIso] = useState(defaults.to);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PaymentErrorCheckResult | null>(null);

  const runCheck = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getPaymentErrorCheck({ from: fromIso, to: toIso });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to run payment error check');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [fromIso, toIso]);

  const pairCount = Math.max(result?.gotCoins.length ?? 0, result?.paidNoCoins.length ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading title="Payment error check" helpKey="finance.payment_error_check" level={1} />
        <p className="text-sm text-zinc-500 mt-1">
          Compare Razorpay captured wallet payments against Mongo coin credits. Default range is the past 24
          hours (max 7 days).
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">From (IST)</label>
            <input
              type="datetime-local"
              value={toDatetimeLocalInputValueFromIst(fromIso)}
              onChange={(e) => {
                const d = fromDatetimeLocalAsIst(e.target.value);
                if (d) setFromIso(d.toISOString());
              }}
              className="px-2 py-1.5 text-sm bg-zinc-950 border border-white/10 rounded text-zinc-200"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">To (IST)</label>
            <input
              type="datetime-local"
              value={toDatetimeLocalInputValueFromIst(toIso)}
              onChange={(e) => {
                const d = fromDatetimeLocalAsIst(e.target.value);
                if (d) setToIso(d.toISOString());
              }}
              className="px-2 py-1.5 text-sm bg-zinc-950 border border-white/10 rounded text-zinc-200"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const next = defaultRangeIso();
              setFromIso(next.from);
              setToIso(next.to);
            }}
            className="px-3 py-1.5 text-xs rounded border border-white/10 text-zinc-300 hover:bg-white/5"
          >
            Past 24 hours
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void runCheck()}
            className="px-4 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white"
          >
            {loading ? 'Running…' : 'Run check'}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">
          Selected: {formatIstDateTime(fromIso)} → {formatIstDateTime(toIso)} IST
        </p>
      </div>

      {loading ? <LoadingSpinner /> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {result && !loading ? (
        <div className="space-y-4">
          {!result.configured ? (
            <p className="text-sm text-amber-300">Razorpay is not configured on this backend.</p>
          ) : null}

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded border border-white/10 px-3 py-1 text-zinc-300">
              Scanned payments: {result.scannedPayments}
            </span>
            <span className="rounded border border-white/10 px-3 py-1 text-zinc-300">
              Captured wallet: {result.capturedWalletPayments}
            </span>
            <span className="rounded border border-emerald-700/50 bg-emerald-950/30 px-3 py-1 text-emerald-200">
              Got coins: {result.gotCoins.length}
            </span>
            <span className="rounded border border-red-700/50 bg-red-950/30 px-3 py-1 text-red-200 inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Paid, no coins: {result.paidNoCoins.length}
            </span>
          </div>

          {pairCount === 0 ? (
            <p className="text-sm text-zinc-500">No captured wallet coin payments in this range.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-900/80 text-zinc-300">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium border-b border-white/10 w-36"> </th>
                    {Array.from({ length: Math.max(result.gotCoins.length, 1) }).map((_, idx) => (
                      <th
                        key={`got-${idx}`}
                        className="text-left px-3 py-2 font-medium border-b border-white/10 text-emerald-200 min-w-[220px]"
                      >
                        Got coins{result.gotCoins.length > 1 ? ` #${idx + 1}` : ''}
                      </th>
                    ))}
                    {Array.from({ length: Math.max(result.paidNoCoins.length, 1) }).map((_, idx) => (
                      <th
                        key={`miss-${idx}`}
                        className="text-left px-3 py-2 font-medium border-b border-white/10 text-red-200 min-w-[220px]"
                      >
                        Paid, no coins{result.paidNoCoins.length > 1 ? ` #${idx + 1}` : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIELD_ROWS.map((field) => (
                    <tr key={field.key} className="border-b border-white/5 align-top">
                      <td className="px-3 py-2 text-zinc-400 font-medium whitespace-nowrap">{field.label}</td>
                      {Array.from({ length: Math.max(result.gotCoins.length, 1) }).map((_, idx) => {
                        const row = result.gotCoins[idx];
                        return (
                          <td key={`got-${field.key}-${idx}`} className="px-3 py-2 text-zinc-100 break-all">
                            {row ? cellValue(row[field.key]) : '—'}
                          </td>
                        );
                      })}
                      {Array.from({ length: Math.max(result.paidNoCoins.length, 1) }).map((_, idx) => {
                        const row = result.paidNoCoins[idx];
                        return (
                          <td key={`miss-${field.key}-${idx}`} className="px-3 py-2 text-zinc-100 break-all">
                            {row ? cellValue(row[field.key]) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default PaymentErrorCheckPage;
