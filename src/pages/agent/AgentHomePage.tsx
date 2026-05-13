import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AgentKpiStrip from '../../components/agent/AgentKpiStrip';
import AgentQuickLinks from '../../components/agent/AgentQuickLinks';
import AgentReferralCard from '../../components/agent/AgentReferralCard';
import { agentPortalService, type AgentSummary } from '../../services/agentPortalService';

const AgentHomePage: React.FC = () => {
  const [s, setS] = useState<AgentSummary | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agentPortalService.getSummary();
      setS(data);
    } catch {
      setErr('Failed to load dashboard');
      setS(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 45_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !s) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!s) {
    return (
      <div className="space-y-4">
        {err ? <p className="text-red-400 text-sm">{err}</p> : null}
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
            Your recruitment pipeline, host roster, and withdrawal queue at a glance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 hover:border-violet-500/40 hover:text-white"
        >
          Refresh
        </button>
      </div>
      {err ? <p className="text-red-400 text-sm">{err}</p> : null}

      <AgentKpiStrip s={s} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AgentReferralCard />
        <AgentQuickLinks />
      </div>
    </div>
  );
};

export default AgentHomePage;
