import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../../components/ui/MetricCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RefreshButton from '../../components/dashboard/RefreshButton';
import GlobalStaleBanner from '../../components/dashboard/GlobalStaleBanner';
import StaleSectionBadge from '../../components/dashboard/StaleSectionBadge';
import { useStaffRealtime } from '../../contexts/StaffRealtimeContext';
import { anySectionStale } from '../../types/dashboardStale';
import { agencyPortalService } from '../../services/agencyPortalService';
import { useAgencyAuth } from '../../contexts/AgencyAuthContext';
import AgencyReferralLinkCard from '../../components/agency/AgencyReferralLinkCard';

const AgencyHomePage: React.FC = () => {
  const { user } = useAgencyAuth();
  const [s, setS] = useState<Awaited<ReturnType<typeof agencyPortalService.getSummary>> | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const { stale, pendingHint, markFresh } = useStaffRealtime();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agencyPortalService.getSummary();
      setS(data);
      setErr('');
      markFresh(['overview', 'creators', 'revenue', 'withdrawals']);
    } catch {
      setErr('Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [markFresh]);

  useEffect(() => {
    load();
  }, [load]);

  const pageStale = anySectionStale(stale, ['overview', 'creators', 'revenue', 'withdrawals']);

  if (loading && !s) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  const total = s?.totalCreators ?? s?.activeCreators ?? 0;
  const online = s?.onlineCreators ?? 0;

  return (
    <div className="space-y-6">
      {pendingHint && pageStale && (
        <GlobalStaleBanner message={pendingHint} onRefreshAll={load} loading={loading} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Dashboard
            <StaleSectionBadge stale={pageStale} />
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Your recruitment pipeline and payouts queue.</p>
        </div>
        <RefreshButton onRefresh={load} stale={pageStale} loading={loading} />
      </div>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/agency/referred" className="block">
          <MetricCard
            label="Pending approval"
            value={
              s?.referredUsersPendingApproval ??
              s?.referredUsersAwaitingPromotion ??
              s?.pendingApplications ??
              0
            }
            subtitle="Referred users — tap to review"
          />
        </Link>
        <Link to="/agency/withdrawals" className="block">
          <MetricCard label="Pending withdrawals" value={s?.pendingWithdrawals ?? 0} subtitle="View only · super admin processes" />
        </Link>
        <MetricCard label="Creators" value={total} subtitle={`${online} online`} />
        <MetricCard
          label="Agency earnings (7d)"
          value={s?.agencyEarningsCoins?.last7d ?? 0}
          subtitle={`Today: ${s?.agencyEarningsCoins?.today ?? 0}`}
        />
      </div>
      <AgencyReferralLinkCard
        referralCode={user?.referralCode}
        displayName={user?.displayName}
      />
    </div>
  );
};

export default AgencyHomePage;
