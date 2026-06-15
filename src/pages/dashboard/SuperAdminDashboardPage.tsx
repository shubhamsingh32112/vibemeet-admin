import * as React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Clock,
  Coins,
  PhoneCall,
  Radio,
  Users,
  Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminRealtime } from '../../contexts/AdminRealtimeContext';
import { useAdminDateRange } from '../../hooks/useAdminDateRange';
import { adminDateRangeQueryParams, dateRangePresetLabel } from '../../utils/dateRange';
import {
  fetchDashboardAlerts,
  fetchDashboardCallAnalytics,
  fetchDashboardLiveCalls,
  fetchDashboardOverview,
  fetchDashboardPayouts,
  fetchDashboardRazorpayBalance,
  fetchDashboardRevenue,
  fetchDashboardTopAgencies,
  fetchDashboardTopBds,
  fetchDashboardTopHosts,
} from '../../services/dashboardApi';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import LiveCallsFeed from '../../components/admin/dashboard/LiveCallsFeed';
import RankingLeaderboardCard from '../../components/admin/dashboard/RankingLeaderboardCard';
import AlertsPanel from '../../components/admin/dashboard/AlertsPanel';
import CallAnalyticsBlock from '../../components/admin/dashboard/CallAnalyticsBlock';
import PayoutTable from '../../components/admin/dashboard/PayoutTable';
import RazorpayBalancePanel from '../../components/admin/dashboard/RazorpayBalancePanel';
import RevenueDailyBalanceModal from '../../components/admin/dashboard/RevenueDailyBalanceModal';

const DASH = 'dashboard' as const;

const SuperAdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshGeneration } = useAdminRealtime();
  const { dateRange } = useAdminDateRange('today');
  const [revenueHistoryOpen, setRevenueHistoryOpen] = React.useState(false);
  const dashboardDateParams = React.useMemo(
    () => adminDateRangeQueryParams(dateRange),
    [dateRange.preset, dateRange.from, dateRange.to]
  );
  const headerRangeLabel = dateRangePresetLabel(dateRange.preset);

  React.useEffect(() => {
    if (refreshGeneration === 0) return;
    void queryClient.invalidateQueries({ queryKey: [DASH] });
  }, [refreshGeneration, queryClient]);

  const overview = useQuery({
    queryKey: [DASH, 'overview', dateRange.preset, dashboardDateParams.from, dashboardDateParams.to],
    queryFn: () => fetchDashboardOverview(dashboardDateParams),
    staleTime: 20_000,
  });
  const revenue = useQuery({
    queryKey: [DASH, 'revenue', dateRange.preset, dashboardDateParams.from, dashboardDateParams.to],
    queryFn: () => fetchDashboardRevenue(14, dashboardDateParams),
    staleTime: 60_000,
  });
  const live = useQuery({
    queryKey: [DASH, 'live-calls'],
    queryFn: fetchDashboardLiveCalls,
    refetchInterval: 30_000,
  });
  const topHosts = useQuery({
    queryKey: [DASH, 'top-hosts', dateRange.preset, dashboardDateParams.from, dashboardDateParams.to],
    queryFn: () => fetchDashboardTopHosts(dashboardDateParams),
    staleTime: 60_000,
  });
  const topBds = useQuery({
    queryKey: [DASH, 'top-bds', dateRange.preset, dashboardDateParams.from, dashboardDateParams.to],
    queryFn: () => fetchDashboardTopBds(dashboardDateParams),
    staleTime: 60_000,
  });
  const topAgencies = useQuery({
    queryKey: [DASH, 'top-agencies', dateRange.preset, dashboardDateParams.from, dashboardDateParams.to],
    queryFn: () => fetchDashboardTopAgencies(dashboardDateParams),
    staleTime: 60_000,
  });
  const alerts = useQuery({ queryKey: [DASH, 'alerts'], queryFn: fetchDashboardAlerts, staleTime: 30_000 });
  const callAn = useQuery({
    queryKey: [DASH, 'call-analytics', dateRange.preset, dashboardDateParams.from, dashboardDateParams.to],
    queryFn: () => fetchDashboardCallAnalytics(dashboardDateParams),
    staleTime: 45_000,
  });
  const payouts = useQuery({
    queryKey: [DASH, 'payouts', dateRange.preset, dashboardDateParams.from, dashboardDateParams.to],
    queryFn: () => fetchDashboardPayouts(dashboardDateParams),
    staleTime: 30_000,
  });
  const razorpayBalance = useQuery({
    queryKey: [DASH, 'razorpay-balance'],
    queryFn: fetchDashboardRazorpayBalance,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const ov = overview.data;
  const walletFlowPoints = ov?.walletFlowSeries?.points ?? [];
  const spark = walletFlowPoints.slice(-8).map((p) => p.netCoins);

  const revenueRangeLabel = React.useMemo(() => {
    if (ov?.walletFlowSeries?.selectedRange) {
      const { from, to } = ov.walletFlowSeries.selectedRange;
      return `${from.slice(0, 10)} → ${to.slice(0, 10)}`;
    }
    if (dateRange.from && dateRange.to) {
      return `${dateRange.from.slice(0, 10)} → ${dateRange.to.slice(0, 10)}`;
    }
    return 'last 90 days';
  }, [ov?.walletFlowSeries?.selectedRange, dateRange.from, dateRange.to]);

  const errs = [overview, revenue, live, alerts].find((q) => q.isError);
  if (errs?.isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200 text-sm">
        Failed to load dashboard. Ensure you are signed in as super admin and the API is running.
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">MatchVibe</p>
          <h2 className="text-2xl font-bold text-white tracking-tight">Command center</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Revenue and call aggregates follow the selected header date range; live call tiles remain realtime proxies.{' '}
            <Link className="text-violet-400 hover:underline" to="/overview">
              Legacy operations overview
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
        <KPIStatCard
          title="Revenue daily balance"
          value={ov?.revenueDailyBalance ?? 0}
          icon={<Coins className="h-5 w-5" />}
          sparkline={spark.length > 1 ? spark : undefined}
          footnote={ov?.revenueDailyBalanceNote ?? 'Today (UTC) · Tap for daily history'}
          accent="violet"
          onClick={() => setRevenueHistoryOpen(true)}
        />
        <KPIStatCard
          title="Live calls (5m proxy)"
          value={ov?.liveCallsProxy ?? 0}
          icon={<PhoneCall className="h-5 w-5" />}
          accent="pink"
        />
        <KPIStatCard title="Online hosts" value={ov?.onlineHosts ?? 0} icon={<Radio className="h-5 w-5" />} accent="green" />
        <KPIStatCard title="Agencies" value={ov?.totalAgencies ?? 0} icon={<Building2 className="h-5 w-5" />} accent="blue" />
        <KPIStatCard title="BDs" value={ov?.totalBds ?? 0} icon={<Users className="h-5 w-5" />} accent="amber" />
        <KPIStatCard title="Pending payouts" value={ov?.pendingPayouts ?? 0} icon={<Wallet className="h-5 w-5" />} accent="amber" footnote={ov?.pendingPayoutsNote} />
        <KPIStatCard title="Call minutes (selected range)" value={ov?.totalCallMinutesToday ?? 0} icon={<Clock className="h-5 w-5" />} accent="blue" />
      </div>

      <RevenueDailyBalanceModal
        open={revenueHistoryOpen}
        onClose={() => setRevenueHistoryOpen(false)}
        todayBalance={ov?.revenueDailyBalance ?? 0}
        points={walletFlowPoints}
        rangeLabel={revenueRangeLabel}
        note={ov?.walletFlowSeries?.note}
      />

      <PayoutTable rows={payouts.data?.rows ?? []} loading={payouts.isLoading} />
      <RazorpayBalancePanel
        data={razorpayBalance.data}
        loading={razorpayBalance.isLoading}
        error={razorpayBalance.isError}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RevenueChart points={revenue.data?.points ?? []} />
        </div>
        <LiveCallsFeed calls={live.data?.calls ?? []} loading={live.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
        <RankingLeaderboardCard
          variant="hosts"
          title="Top performing hosts"
          viewAllHref="/leaderboards"
          rows={topHosts.data?.rows ?? []}
          loading={topHosts.isLoading}
          footnote={topHosts.data?.note}
          rangeLabel={headerRangeLabel}
        />
        <RankingLeaderboardCard
          variant="bds"
          title="Top performing BDs"
          viewAllHref="/bds"
          rows={topBds.data?.rows ?? []}
          loading={topBds.isLoading}
          footnote={topBds.data?.note}
          rangeLabel={headerRangeLabel}
        />
        <RankingLeaderboardCard
          variant="agencies"
          title="Top performing agencies"
          viewAllHref="/agencies"
          rows={topAgencies.data?.rows ?? []}
          loading={topAgencies.isLoading}
          footnote={topAgencies.data?.note}
          rangeLabel={headerRangeLabel}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          {callAn.data ? (
            <CallAnalyticsBlock today={callAn.data.today} dailyVolume={callAn.data.dailyVolume} />
          ) : (
            <div className="glass-panel rounded-2xl p-6 text-sm text-zinc-500">Loading call analytics…</div>
          )}
        </div>
        <div className="xl:col-span-5">
          <AlertsPanel alerts={alerts.data?.alerts ?? []} />
        </div>
      </div>

    </motion.div>
  );
};

export default SuperAdminDashboardPage;
