import { Banknote } from 'lucide-react';
import type { DashboardRazorpayCollectedAmount } from '../../../services/dashboardApi';
import { MetricHelpButton } from '../help/MetricHelpButton';

type Props = {
  data?: DashboardRazorpayCollectedAmount;
  loading: boolean;
  fetching: boolean;
  error: boolean;
  rangeLabel: string;
};

function formatMajorAmount(amount: string, currency: string): string {
  const [whole = '0', fraction = '00'] = amount.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const symbol = currency === 'INR' ? '₹' : `${currency} `;
  return `${symbol}${grouped}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}

export default function RazorpayCollectedAmountCard({
  data,
  loading,
  fetching,
  error,
  rangeLabel,
}: Props) {
  const mixed = Boolean(data && data.currencyBuckets.length > 1);
  const incomplete = data?.dataMode === 'projection' && !data.completeness.complete;
  const value =
    data?.amountMajor !== null && data?.amountMajor !== undefined && data.currency
      ? formatMajorAmount(data.amountMajor, data.currency)
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-white/[0.06] to-transparent p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Razorpay Collected Amount
            <MetricHelpButton helpKey="dashboard.razorpay_collected_amount" />
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {loading ? 'Loading…' : error ? 'Unavailable' : mixed ? 'Multiple currencies' : value ?? 'Unavailable'}
          </p>
          <p className="mt-1 text-[10px] text-zinc-500">
            {error
              ? 'Provider total could not be loaded; no zero fallback is shown.'
              : mixed
                ? data?.currencyBuckets
                    .map((bucket) => `${bucket.currency} ${bucket.amountMajor}`)
                    .join(' · ')
                : `${rangeLabel} · ${data?.paymentCount ?? 0} captured payment(s)${
                    incomplete ? ` · partial (${data?.completeness.status})` : ''
                  }${
                    data?.stale ? ' · stale last-good result' : ''
                  }${fetching && data ? ' · refreshing' : ''}`}
          </p>
          {data ? (
            <p className="mt-1 text-[10px] text-zinc-600">
              As of {new Date(data.asOf).toLocaleString()} · {data.cache} cache
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-emerald-300">
          <Banknote className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
