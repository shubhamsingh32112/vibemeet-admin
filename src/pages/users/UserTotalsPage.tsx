import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import UserLoginChart, {
  type UserLoginGranularity,
} from '../../components/admin/dashboard/UserLoginChart';
import UserSignupChart, {
  type UserSignupGranularity,
} from '../../components/admin/dashboard/UserSignupChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { Users } from 'lucide-react';

const UserTotalsPage: React.FC = () => {
  const [granularity, setGranularity] = useState<UserLoginGranularity>('daily');
  const [signupGranularity, setSignupGranularity] = useState<UserSignupGranularity>('hourly');
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof adminService.getUsersSummary>> | null>(
    null
  );
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSummaryLoading(true);
        const data = await adminService.getUsersSummary();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummaryError('Failed to load user totals');
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginSeries = useQuery({
    queryKey: ['users', 'login-series', granularity],
    queryFn: () => adminService.getUsersLoginSeries(granularity),
    staleTime: 60_000,
  });

  const signupSeries = useQuery({
    queryKey: ['users', 'signup-series', signupGranularity],
    queryFn: () => adminService.getUsersSignupSeries(signupGranularity),
    staleTime: 60_000,
  });

  if (summaryLoading) return <LoadingSpinner />;
  if (summaryError || !summary) {
    return <p className="text-red-400 text-sm">{summaryError || 'No data'}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Total users</h1>
        <p className="text-sm text-zinc-500 mt-1">
          End-user signups and logins (role=user). Counts use UTC boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPIStatCard title="All time" value={summary.totalUsers} icon={<Users className="h-5 w-5" />} />
        <KPIStatCard title="Today" value={summary.signupsToday} icon={<Users className="h-5 w-5" />} />
        <KPIStatCard title="Last 7 days" value={summary.signups7d} icon={<Users className="h-5 w-5" />} />
        <KPIStatCard title="Last 30 days" value={summary.signups30d} icon={<Users className="h-5 w-5" />} />
      </div>

      <UserSignupChart
        points={signupSeries.data?.points ?? []}
        granularity={signupGranularity}
        onGranularityChange={setSignupGranularity}
        loading={signupSeries.isLoading}
        note={signupSeries.data?.note}
      />

      <UserLoginChart
        points={loginSeries.data?.points ?? []}
        granularity={granularity}
        onGranularityChange={setGranularity}
        loading={loginSeries.isLoading}
        note={loginSeries.data?.note}
      />

      <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
        <p className="text-sm text-zinc-400">
          Onboarded users (categories set):{' '}
          <span className="text-white font-semibold tabular-nums">{summary.onboardedUsers}</span>
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          Generated {new Date(summary.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default UserTotalsPage;
