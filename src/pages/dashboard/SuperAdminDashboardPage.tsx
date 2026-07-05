import * as React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Clock,
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
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import CommandCenterKpiModal, {
  type CommandCenterKpiKind,
} from '../../components/admin/dashboard/CommandCenterKpiModal';
import {
  invalidateDashboardSections,
  sectionsNewlyStale,
} from '../../utils/dashboardQueryInvalidation';
import type { StaleMap } from '../../types/dashboardStale';

const DASH = 'dashboard' as const;

const SuperAdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshGeneration, stale } = useAdminRealtime();
  const prevStaleRef = React.useRef<StaleMap>(stale);
  const invalidateTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { dateRange } = useAdminDateRange('today');
  const [revenueHistoryOpen, setRevenueHistoryOpen] = React.useState(false);
  const [kpiDrilldown, setKpiDrilldown] = React.useState<CommandCenterKpiKind | null>(null);
  const dashboardDateParams = React.useMemo(
    () => adminDateRangeQueryParams(dateRange),
    [dateRange.preset, dateRange.from, dateRange.to]
  );
  const headerRangeLabel = dateRangePresetLabel(dateRange.preset);

  React.useEffect(() => {
    if (refreshGeneration === 0) return;
    const newlyStale = sectionsNewlyStale(prevStaleRef.current, stale);
    prevStaleRef.current = stale;
    if (newlyStale.length === 0) return;

    if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
    invalidateTimerRef.current = setTimeout(() => {
      invalidateDashboardSections(queryClient, newlyStale);
    }, 1500);

    return () => {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
    };
  }, [refreshGeneration, stale, queryClient]);

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
  const rechargePoints = ov?.rechargeDailySeries?.points ?? ov?.walletFlowSeries?.points ?? [];
  const rechargeSpark = rechargePoints
    .slice(-8)
    .map((p) => p.rechargeInr ?? 0)
    .filter((n) => typeof n === 'number');

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
          <SectionHeading title="Command center" helpKey="dashboard.page" level={2} className="mt-0" />
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Call and payout aggregates follow the selected header date range; recharge collection always uses IST
            calendar days. Live call tiles remain realtime proxies.{' '}
            <Link className="text-violet-400 hover:underline" to="/overview">
              Legacy operations overview
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
        <KPIStatCard
          title="Recharge collection (today)"
          value={ov?.rechargeCollectionTodayInr ?? ov?.revenueDailyBalance ?? 0}
          format="inr"
          icon={<Wallet className="h-5 w-5" />}
          sparkline={rechargeSpark.length > 1 ? rechargeSpark : undefined}
          footnote={ov?.revenueDailyBalanceNote ?? 'Today (IST) · Tap for daily history'}
          accent="violet"
          helpKey="dashboard.recharge_collection"
          onClick={() => setRevenueHistoryOpen(true)}
        />
        <KPIStatCard
          title="Live calls (5m proxy)"
          value={ov?.liveCallsProxy ?? 0}
          icon={<PhoneCall className="h-5 w-5" />}
          accent="pink"
          footnote="Tap to see recent sessions"
          helpKey="dashboard.live_calls_5m"
          onClick={() => setKpiDrilldown('live_calls')}
        />
        <KPIStatCard
          title="Hosts online"
          value={ov?.hostsOnline ?? ov?.onlineHosts ?? 0}
          icon={<Radio className="h-5 w-5" />}
          accent="green"
          footnote="Tap to list online hosts"
          helpKey="dashboard.hosts_online"
          onClick={() => setKpiDrilldown('hosts_online')}
        />
        <KPIStatCard
          title="Hosts on call"
          value={ov?.hostsOnCall ?? 0}
          icon={<PhoneCall className="h-5 w-5" />}
          accent="amber"
          footnote="Tap to see who is on a call"
          helpKey="dashboard.hosts_on_call"
          onClick={() => setKpiDrilldown('hosts_on_call')}
        />
        <KPIStatCard
          title="Hosts offline"
          value={ov?.hostsOffline ?? 0}
          icon={<Radio className="h-5 w-5 opacity-50" />}
          accent="blue"
          footnote="Tap to list offline hosts"
          helpKey="dashboard.hosts_offline"
          onClick={() => setKpiDrilldown('hosts_offline')}
        />
        <KPIStatCard
          title="Agencies"
          value={ov?.totalAgencies ?? 0}
          icon={<Building2 className="h-5 w-5" />}
          accent="blue"
          footnote="Tap to view agencies"
          helpKey="dashboard.total_agencies"
          onClick={() => setKpiDrilldown('agencies')}
        />
        <KPIStatCard
          title="BDs"
          value={ov?.totalBds ?? 0}
          icon={<Users className="h-5 w-5" />}
          accent="amber"
          footnote="Tap to view BDs"
          helpKey="dashboard.total_bds"
          onClick={() => setKpiDrilldown('bds')}
        />
        <KPIStatCard
          title="Pending payouts"
          value={ov?.pendingPayouts ?? 0}
          icon={<Wallet className="h-5 w-5" />}
          accent="amber"
          footnote={ov?.pendingPayoutsNote ?? 'Tap to view pending requests'}
          helpKey="dashboard.pending_payouts"
          onClick={() => setKpiDrilldown('pending_payouts')}
        />
        <KPIStatCard
          title="Call minutes (selected range)"
          value={ov?.totalCallMinutesToday ?? 0}
          icon={<Clock className="h-5 w-5" />}
          accent="blue"
          footnote="Tap for call breakdown"
          helpKey="dashboard.call_minutes"
          onClick={() => setKpiDrilldown('call_minutes')}
        />
      </div>

      <CommandCenterKpiModal
        open={kpiDrilldown !== null}
        kind={kpiDrilldown}
        onClose={() => setKpiDrilldown(null)}
        overview={ov ?? null}
        payoutRows={payouts.data?.rows ?? []}
        callAnalytics={
          callAn.data
            ? {
                ...callAn.data.today,
                totalMinutes: ov?.totalCallMinutesToday,
                dailyVolume: callAn.data.dailyVolume,
              }
            : null
        }
        rangeLabel={headerRangeLabel}
      />

      <RevenueDailyBalanceModal
        open={revenueHistoryOpen}
        onClose={() => setRevenueHistoryOpen(false)}
        todayInr={ov?.rechargeCollectionTodayInr ?? ov?.revenueDailyBalance ?? 0}
        yesterdayInr={ov?.rechargeCollectionYesterdayInr}
        points={(ov?.rechargeDailySeries?.points ?? ov?.walletFlowSeries?.points ?? []).map((p) => ({
          date: p.date,
          rechargeInr: p.rechargeInr ?? 0,
          rechargeCoins: p.rechargeCoins ?? 0,
          transactionCount: p.transactionCount ?? 0,
        }))}
        historyDays={ov?.rechargeDailySeries?.historyDays ?? 90}
        note={ov?.rechargeDailySeries?.note ?? ov?.walletFlowSeries?.note}
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
          footnote={topHosts.data?.note ?? `Rankings for ${headerRangeLabel} (IST)`}
          rangeLabel={headerRangeLabel}
          helpKey="dashboard.top_hosts"
        />
        <RankingLeaderboardCard
          variant="bds"
          title="Top performing BDs"
          viewAllHref="/bds"
          rows={topBds.data?.rows ?? []}
          loading={topBds.isLoading}
          footnote={topBds.data?.note}
          rangeLabel={headerRangeLabel}
          helpKey="dashboard.top_bds"
        />
        <RankingLeaderboardCard
          variant="agencies"
          title="Top performing agencies"
          viewAllHref="/agencies"
          rows={topAgencies.data?.rows ?? []}
          loading={topAgencies.isLoading}
          footnote={topAgencies.data?.note}
          rangeLabel={headerRangeLabel}
          helpKey="dashboard.top_agencies"
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
