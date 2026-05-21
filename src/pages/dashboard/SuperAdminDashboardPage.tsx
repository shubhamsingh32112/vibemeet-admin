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
import {
  fetchDashboardAlerts,
  fetchDashboardCallAnalytics,
  fetchDashboardGeo,
  fetchDashboardHeatmap,
  fetchDashboardLiveCalls,
  fetchDashboardOverview,
  fetchDashboardPayouts,
  fetchDashboardRealtime,
  fetchDashboardRevenue,
  fetchDashboardTopAgencies,
  fetchDashboardTopBds,
  fetchDashboardTopHosts,
} from '../../services/dashboardApi';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import LiveCallsFeed from '../../components/admin/dashboard/LiveCallsFeed';
import ActivityMap from '../../components/admin/dashboard/ActivityMap';
import RankingLeaderboardCard from '../../components/admin/dashboard/RankingLeaderboardCard';
import AlertsPanel from '../../components/admin/dashboard/AlertsPanel';
import HeatmapChart from '../../components/admin/dashboard/HeatmapChart';
import CallAnalyticsBlock from '../../components/admin/dashboard/CallAnalyticsBlock';
import PayoutTable from '../../components/admin/dashboard/PayoutTable';

const DASH = 'dashboard' as const;

const SuperAdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshGeneration } = useAdminRealtime();

  React.useEffect(() => {
    if (refreshGeneration === 0) return;
    void queryClient.invalidateQueries({ queryKey: [DASH] });
  }, [refreshGeneration, queryClient]);

  const overview = useQuery({ queryKey: [DASH, 'overview'], queryFn: fetchDashboardOverview, staleTime: 20_000 });
  const revenue = useQuery({ queryKey: [DASH, 'revenue'], queryFn: () => fetchDashboardRevenue(14), staleTime: 60_000 });
  const live = useQuery({
    queryKey: [DASH, 'live-calls'],
    queryFn: fetchDashboardLiveCalls,
    refetchInterval: 30_000,
  });
  const realtime = useQuery({
    queryKey: [DASH, 'realtime'],
    queryFn: fetchDashboardRealtime,
    refetchInterval: 15_000,
  });
  const geo = useQuery({ queryKey: [DASH, 'geo'], queryFn: fetchDashboardGeo, staleTime: 120_000 });
  const topHosts = useQuery({ queryKey: [DASH, 'top-hosts'], queryFn: fetchDashboardTopHosts, staleTime: 60_000 });
  const topBds = useQuery({ queryKey: [DASH, 'top-bds'], queryFn: fetchDashboardTopBds, staleTime: 60_000 });
  const topAgencies = useQuery({ queryKey: [DASH, 'top-agencies'], queryFn: fetchDashboardTopAgencies, staleTime: 60_000 });
  const alerts = useQuery({ queryKey: [DASH, 'alerts'], queryFn: fetchDashboardAlerts, staleTime: 30_000 });
  const heatmap = useQuery({ queryKey: [DASH, 'heatmap'], queryFn: fetchDashboardHeatmap, staleTime: 120_000 });
  const callAn = useQuery({ queryKey: [DASH, 'call-analytics'], queryFn: fetchDashboardCallAnalytics, staleTime: 45_000 });
  const payouts = useQuery({ queryKey: [DASH, 'payouts'], queryFn: fetchDashboardPayouts, staleTime: 30_000 });

  const ov = overview.data;
  const spark = (revenue.data?.points ?? []).slice(-8).map((p: { revenueCoins: number }) => p.revenueCoins);

  const activityStats = React.useMemo(() => {
    const g = geo.data?.stats;
    const r = realtime.data as
      | { onlineCreators?: number; activeCalls?: number; activeBillingSessions?: number }
      | undefined;
    const liveCalls = r?.activeCalls ?? g?.liveCalls ?? 0;
    const onlineHosts = r?.onlineCreators ?? g?.onlineHosts ?? 0;
    return {
      onlineHosts,
      liveCalls,
      callsPerMinute: Math.round(((r?.activeCalls ?? 0) / 5) * 10) / 10,
      revenuePerMinute: g?.revenuePerMinute ?? 0,
    };
  }, [geo.data, realtime.data]);

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
            Revenue KPIs use wallet coin flow; live call tiles use operational proxies (see API notes).{' '}
            <Link className="text-violet-400 hover:underline" to="/overview">
              Legacy operations overview
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
        <KPIStatCard
          title="Revenue today (coins)"
          value={ov?.revenueCoinsToday ?? 0}
          icon={<Coins className="h-5 w-5" />}
          sparkline={spark.length > 1 ? spark : undefined}
          footnote={ov?.revenueCoinsTodayNote}
          accent="violet"
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
        <KPIStatCard title="Pending payouts" value={ov?.pendingPayouts ?? 0} icon={<Wallet className="h-5 w-5" />} accent="amber" />
        <KPIStatCard title="Call minutes today" value={ov?.totalCallMinutesToday ?? 0} icon={<Clock className="h-5 w-5" />} accent="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RevenueChart points={revenue.data?.points ?? []} />
        </div>
        <LiveCallsFeed calls={live.data?.calls ?? []} loading={live.isLoading} />
      </div>

      <ActivityMap stats={activityStats} countries={geo.data?.topCountries ?? []} isDemo={geo.data?.isDemo} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
        <RankingLeaderboardCard
          variant="hosts"
          title="Top performing hosts"
          viewAllHref="/leaderboards"
          rows={topHosts.data?.rows ?? []}
          loading={topHosts.isLoading}
        />
        <RankingLeaderboardCard
          variant="bds"
          title="Top performing BDs"
          viewAllHref="/bds"
          rows={topBds.data?.rows ?? []}
          loading={topBds.isLoading}
          footnote="Revenue shows BD wallet balance (coins); commission rollup pending. INR preview uses VITE_DASHBOARD_INR_PER_COIN when set."
        />
        <RankingLeaderboardCard
          variant="agencies"
          title="Top performing agencies"
          viewAllHref="/agencies"
          rows={topAgencies.data?.rows ?? []}
          loading={topAgencies.isLoading}
          footnote={topAgencies.data?.note}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5">
          <HeatmapChart cells={heatmap.data?.cells ?? []} isDemo={heatmap.data?.isDemo} />
        </div>
        <div className="xl:col-span-4">
          {callAn.data ? (
            <CallAnalyticsBlock today={callAn.data.today} dailyVolume={callAn.data.dailyVolume} />
          ) : (
            <div className="glass-panel rounded-2xl p-6 text-sm text-zinc-500">Loading call analytics…</div>
          )}
        </div>
        <div className="xl:col-span-3">
          <AlertsPanel alerts={alerts.data?.alerts ?? []} />
        </div>
      </div>

      <PayoutTable rows={payouts.data?.rows ?? []} loading={payouts.isLoading} />
    </motion.div>
  );
};

export default SuperAdminDashboardPage;
