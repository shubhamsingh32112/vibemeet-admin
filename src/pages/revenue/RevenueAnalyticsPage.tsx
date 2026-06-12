import React, { useEffect, useState } from 'react';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { RevenueSplitPie } from '../../components/admin/dashboard/RevenueSplitPie';
import { adminService } from '../../services/adminService';
import { formatDashboardMoneyFromCoins } from '../../utils/dashboardInr';
import { Coins, LineChart } from 'lucide-react';

type Period = 'today' | '7d' | '30d';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

const RevenueAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getRevenueAnalyticsSummary>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await adminService.getRevenueAnalyticsSummary(period);
        if (!cancelled) setData(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (loading && !data) return <LoadingSpinner />;

  const c = data?.calls;
  const splitSlices = c
    ? [
        { key: 'host', label: 'Host', pct: 0, color: '#34d399', coins: c.hostRevenueCoins },
        { key: 'bd', label: 'BD', pct: 0, color: '#60a5fa', coins: c.bdRevenueCoins },
        { key: 'agency', label: 'Agency', pct: 0, color: '#a78bfa', coins: c.agencyRevenueCoins },
        { key: 'platform', label: 'Platform', pct: 0, color: '#52525b', coins: c.platformRevenueCoins },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Revenue analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Settled call revenue, moments, VIP, and payouts.</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                period === p.value ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-white/10 text-zinc-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {c && (
        <>
          <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Call revenue</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIStatCard title="Gross (user spend)" value={c.grossRevenueCoins} icon={<LineChart className="h-5 w-5" />} />
            <KPIStatCard title="Host earnings" value={c.hostRevenueCoins} icon={<Coins className="h-5 w-5" />} />
            <KPIStatCard title="Independent hosts" value={c.independentHostRevenueCoins} icon={<Coins className="h-5 w-5" />} />
            <KPIStatCard title="Staffed hosts" value={c.staffedHostRevenueCoins} icon={<Coins className="h-5 w-5" />} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
              <h3 className="text-sm text-zinc-400 mb-4">Revenue split (staffed)</h3>
              <RevenueSplitPie title="Staffed host split" slices={splitSlices} />
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
                <p className="text-xs text-zinc-500">BD revenue</p>
                <p className="text-lg font-bold text-white tabular-nums">{formatDashboardMoneyFromCoins(c.bdRevenueCoins).text}</p>
              </div>
              <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
                <p className="text-xs text-zinc-500">Agency revenue</p>
                <p className="text-lg font-bold text-white tabular-nums">{formatDashboardMoneyFromCoins(c.agencyRevenueCoins).text}</p>
              </div>
              <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
                <p className="text-xs text-zinc-500">Platform residual</p>
                <p className="text-lg font-bold text-white tabular-nums">{formatDashboardMoneyFromCoins(c.platformRevenueCoins).text}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Moments revenue</h3>
            <p className="text-xl font-bold text-white tabular-nums">{data.moments.revenueCoins} coins</p>
          </div>
          <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
            <h3 className="text-sm text-zinc-400 mb-2">VIP revenue</h3>
            <p className="text-xl font-bold text-white tabular-nums">{data.vip.revenueCoins} coins</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueAnalyticsPage;
