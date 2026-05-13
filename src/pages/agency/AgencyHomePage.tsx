import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  agencyPortalService,
  type AgencyDashboardData,
} from '../../services/agencyPortalService';
import AgencyKpiStrip from '../../components/agency/AgencyKpiStrip';
import AgencyDashboardCharts from '../../components/agency/AgencyDashboardCharts';
import AgencyRevenueDonut from '../../components/agency/AgencyRevenueDonut';
import AgencyLeaderboardTables from '../../components/agency/AgencyLeaderboardTables';
import AgencyRecentActivity from '../../components/agency/AgencyRecentActivity';
import AgencyPayoutCard from '../../components/agency/AgencyPayoutCard';

function enrichDashboard(raw: AgencyDashboardData): AgencyDashboardData {
  const topHosts = raw.topHostsLeaderboard ?? [];
  let topBds = raw.topBdsLeaderboard ?? [];
  if (topBds.length === 0 && raw.bdAnalytics?.length) {
    const sorted = [...raw.bdAnalytics].sort(
      (a, b) =>
        b.bdEarningsCoinsLast7d - a.bdEarningsCoinsLast7d ||
        b.hostCount - a.hostCount ||
        b.agencyRevenueFromBdLast7d - a.agencyRevenueFromBdLast7d,
    );
    topBds = sorted.slice(0, 5).map((row, i) => ({
      rank: i + 1,
      id: row.id,
      displayLabel: row.displayName || row.email,
      avatarUrl: row.avatarUrl ?? null,
      hostCount: row.hostCount,
      revenueGeneratedCoins: row.bdEarningsCoinsLast7d,
      commission5PctCoins: Math.round(row.bdEarningsCoinsLast7d * 0.05),
      activeHosts: row.onlineHostCount,
    }));
  }

  return {
    ...raw,
    bdAnalytics: (raw.bdAnalytics ?? []).map((b) => ({
      ...b,
      avatarUrl: b.avatarUrl ?? null,
    })),
    topBdsLeaderboard: topBds,
    topHostsLeaderboard: topHosts,
    revenueSeries14d: raw.revenueSeries14d ?? [],
    activitySeries7d: raw.activitySeries7d ?? [],
    recentActivity: raw.recentActivity ?? [],
    payoutSummary: raw.payoutSummary ?? {
      pendingCoins: 0,
      processingCoins: 0,
      paidCoins: 0,
      nextPayoutNote: 'Payout schedule is coordinated with platform finance.',
    },
  };
}

const AgencyHomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [d, setD] = useState<AgencyDashboardData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agencyPortalService.getDashboard();
      setD(enrichDashboard(data));
    } catch {
      setErr('Failed to load dashboard');
      setD(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!d) {
    return (
      <div className="space-y-4">
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">MatchVibe</p>
          <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">Overview</h2>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500">
            Revenue reflects call settlement credits to your agency wallet. Charts use UTC days.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 hover:border-violet-500/40 hover:text-white"
        >
          Refresh
        </button>
      </div>
      {err && <p className="text-red-400 text-sm">{err}</p>}

      <AgencyKpiStrip d={d} />

      <AgencyDashboardCharts d={d} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AgencyRevenueDonut d={d} />
        </div>
        <div className="lg:col-span-2">
          <AgencyLeaderboardTables d={d} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AgencyRecentActivity d={d} />
        <AgencyPayoutCard d={d} />
      </div>
    </div>
  );
};

export default AgencyHomePage;
