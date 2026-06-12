import React, { useEffect, useState } from 'react';
import KPIStatCard from '../../components/admin/dashboard/KPIStatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { Users } from 'lucide-react';

const UserTotalsPage: React.FC = () => {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getUsersSummary>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const summary = await adminService.getUsersSummary();
        if (!cancelled) setData(summary);
      } catch {
        if (!cancelled) setError('Failed to load user totals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error || !data) {
    return <p className="text-red-400 text-sm">{error || 'No data'}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Total users</h1>
        <p className="text-sm text-zinc-500 mt-1">
          End-user signups (role=user). Counts use UTC day boundaries.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPIStatCard title="All time" value={data.totalUsers} icon={<Users className="h-5 w-5" />} />
        <KPIStatCard title="Today" value={data.signupsToday} icon={<Users className="h-5 w-5" />} />
        <KPIStatCard title="Last 7 days" value={data.signups7d} icon={<Users className="h-5 w-5" />} />
        <KPIStatCard title="Last 30 days" value={data.signups30d} icon={<Users className="h-5 w-5" />} />
      </div>
      <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
        <p className="text-sm text-zinc-400">
          Onboarded users (categories set):{' '}
          <span className="text-white font-semibold tabular-nums">{data.onboardedUsers}</span>
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          Generated {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default UserTotalsPage;
