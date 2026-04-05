import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../../components/ui/MetricCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { agentPortalService, type AgentSummary } from '../../services/agentPortalService';

const AgentHomePage: React.FC = () => {
  const [s, setS] = useState<AgentSummary | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const data = await agentPortalService.getSummary();
        if (ok) setS(data);
      } catch (e: unknown) {
        if (ok) setErr('Failed to load summary');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Your recruitment pipeline and payouts queue.</p>
      </div>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/agent/pending" className="block">
          <MetricCard label="Pending applications" value={s?.pendingApplications ?? 0} subtitle="Tap to review" />
        </Link>
        <Link to="/agent/withdrawals" className="block">
          <MetricCard label="Pending withdrawals" value={s?.pendingWithdrawals ?? 0} subtitle="Needs action" />
        </Link>
        <Link to="/agent/creators" className="block">
          <MetricCard label="Active creators" value={s?.activeCreators ?? 0} subtitle="Under you" />
        </Link>
      </div>
    </div>
  );
};

export default AgentHomePage;
