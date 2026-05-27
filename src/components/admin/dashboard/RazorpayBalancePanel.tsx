import * as React from 'react';
import { AlertCircle, CheckCircle2, Landmark } from 'lucide-react';
import type { DashboardRazorpayBalance } from '../../../services/dashboardApi';

type RazorpayBalancePanelProps = {
  data?: DashboardRazorpayBalance;
  loading?: boolean;
  error?: boolean;
};

function formatMoney(subunits: number, currency: string): string {
  const majorAmount = subunits / 100;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(majorAmount);
  } catch {
    return `${currency} ${majorAmount.toFixed(2)}`;
  }
}

const RazorpayBalancePanel: React.FC<RazorpayBalancePanelProps> = ({ data, loading, error }) => {
  if (loading) {
    return <div className="glass-panel rounded-2xl p-5 text-sm text-zinc-400">Loading Razorpay balances...</div>;
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-5 text-sm text-red-300">
        Unable to load Razorpay balances right now.
      </div>
    );
  }

  if (!data) return null;

  const currency = data.totals.currency || 'INR';

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Razorpay Balances</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Available, reserve, and channel-level balances for Superadmin visibility.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
            data.hasNegativeAvailable
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {data.hasNegativeAvailable ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {data.hasNegativeAvailable ? 'Negative available balance' : 'Available balance healthy'}
        </div>
      </div>

      {!data.configured ? (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
          Razorpay keys are not configured on backend (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`).
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Available</p>
              <p className="mt-1 text-lg font-semibold text-white">{formatMoney(data.totals.available, currency)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Reserve (max negative)</p>
              <p className="mt-1 text-lg font-semibold text-white">{formatMoney(data.maxNegativeLimit, currency)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">On Hold</p>
              <p className="mt-1 text-lg font-semibold text-white">{formatMoney(data.totals.onHold, currency)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Net Balance</p>
              <p className="mt-1 text-lg font-semibold text-white">{formatMoney(data.totals.net, currency)}</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-white/5 text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 font-medium">Available</th>
                  <th className="px-3 py-2 font-medium">Reserve</th>
                  <th className="px-3 py-2 font-medium">On Hold</th>
                  <th className="px-3 py-2 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {(data.channels ?? []).map((channel) => (
                  <tr key={channel.key} className="border-t border-white/10 text-zinc-200">
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1">
                        <Landmark className="h-3.5 w-3.5 text-zinc-500" />
                        {channel.channelLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2">{formatMoney(channel.available, channel.currency || currency)}</td>
                    <td className="px-3 py-2">{formatMoney(channel.reserved, channel.currency || currency)}</td>
                    <td className="px-3 py-2">{formatMoney(channel.onHold, channel.currency || currency)}</td>
                    <td className="px-3 py-2">{formatMoney(channel.net, channel.currency || currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-zinc-500">
            {data.note} Last synced: {new Date(data.fetchedAt).toLocaleString()}.
          </p>
        </>
      )}
    </div>
  );
};

export default RazorpayBalancePanel;
