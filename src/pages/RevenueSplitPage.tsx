import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { RevenueSplitPie } from '../components/admin/dashboard/RevenueSplitPie';
import {
  SPLIT_INDEPENDENT_HOST,
  SPLIT_WITH_AGENCY_AND_BD,
  applyCoinsToSlices,
  formatCoinsAndInr,
  type SplitSlice,
} from '../lib/revenueSplitModel';
import { adminService, type RevenueSplitSummary } from '../services/adminService';

function RevenueAmountCard({
  label,
  coins,
  accent = 'text-white',
}: {
  label: string;
  coins: number;
  accent?: string;
}) {
  const { coins: coinsText, inr } = formatCoinsAndInr(coins);
  return (
    <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`text-xl font-bold tabular-nums mt-1 ${accent}`}>{coinsText}</p>
      <p className="text-sm text-emerald-300/90 tabular-nums mt-0.5">{inr}</p>
    </div>
  );
}

const RevenueSplitPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [summary, setSummary] = useState<RevenueSplitSummary | null>(null);
  const [bdBps, setBdBps] = useState(500);
  const [agencyBps, setAgencyBps] = useState(1500);
  const [hostSharePct, setHostSharePct] = useState(25);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [rangeDays, setRangeDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [splitData, config] = await Promise.all([
        adminService.getRevenueSplitSummary(rangeDays),
        adminService.getPlatformRevenue(),
      ]);
      setSummary(splitData);
      setBdBps(config.bdBps);
      setAgencyBps(config.agencyBps);
      if (typeof config.hostSharePct === 'number') setHostSharePct(config.hostSharePct);
      if (config.note) setNote(config.note);
    } catch {
      setErr('Failed to load revenue split');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await adminService.updatePlatformRevenue({ bdBps, agencyBps });
      await load();
    } catch {
      setErr('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const pieWithStaff: SplitSlice[] = useMemo(() => {
    if (!summary) return SPLIT_WITH_AGENCY_AND_BD;
    return applyCoinsToSlices(
      SPLIT_WITH_AGENCY_AND_BD,
      summary.actual.totalRevenue
    ).map((s) => {
      const fromApi = summary.scenarios.withAgencyAndBd.slices.find((x) => x.key === s.key);
      return { ...s, coins: fromApi?.coins ?? s.coins };
    });
  }, [summary]);

  const pieIndependent: SplitSlice[] = useMemo(() => {
    if (!summary) return SPLIT_INDEPENDENT_HOST;
    return applyCoinsToSlices(SPLIT_INDEPENDENT_HOST, summary.actual.totalRevenue).map((s) => {
      const fromApi = summary.scenarios.independentHost.slices.find((x) => x.key === s.key);
      return { ...s, coins: fromApi?.coins ?? s.coins };
    });
  }, [summary]);

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner label="Loading revenue split…" />
      </div>
    );
  }

  const actual = summary?.actual;
  const combined = summary?.combinedPlatformCoins;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue split</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-3xl">
            Call revenue from user coin spend (last {summary?.rangeDays ?? rangeDays} days). INR uses{' '}
            <strong className="text-zinc-300">₹0.80 per coin</strong> (80 paise).
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Period</span>
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="rounded-lg border border-admin-border bg-admin-base px-3 py-2 text-sm text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      {actual && (
        <>
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Actual revenue (settled)</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <RevenueAmountCard label="Total revenue" coins={actual.totalRevenue} accent="text-violet-300" />
              <RevenueAmountCard label="Host revenue" coins={actual.hostRevenue} accent="text-emerald-300" />
              <RevenueAmountCard label="BD revenue" coins={actual.bdRevenue} accent="text-sky-300" />
              <RevenueAmountCard label="Agency revenue" coins={actual.agencyRevenue} accent="text-fuchsia-300" />
              <RevenueAmountCard label="Platform revenue" coins={actual.platformRevenue} />
            </div>
          </div>

          {combined && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-5 space-y-4">
              <h2 className="text-lg font-semibold text-white">Platform revenue — combined (coins & INR)</h2>
              <p className="text-xs text-zinc-500">
                Actual platform share from settlements, plus policy-model platform amounts when splits are
                applied to the same total call revenue.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <PlatformCombinedCard
                  title="Actual (settled)"
                  coins={combined.actualSettled}
                  highlight
                />
                <PlatformCombinedCard
                  title="Policy — with agency & BD (55%)"
                  coins={combined.policyWithStaff}
                />
                <PlatformCombinedCard
                  title="Policy — no agency / BD (75%)"
                  coins={combined.policyIndependentHost}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueSplitPie
          title="Host with agency & BD"
          subtitle="25% host · 5% BD · 15% agency · 55% platform — coin amounts from total revenue"
          slices={pieWithStaff}
        />
        <RevenueSplitPie
          title="Host without agency or BD"
          subtitle="25% host · 75% platform (BD/agency share stays with platform)"
          slices={pieIndependent}
        />
      </div>

      <div className="rounded-xl border border-admin-border bg-admin-surface/80 p-5 space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-white">Settlement settings (basis points)</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          BD and agency rates apply to the <strong className="text-zinc-300">host earnings pool</strong>{' '}
          when a creator is assigned to an agency ({note || 'see server'}). Billing host share from env:{' '}
          <strong className="text-zinc-300">{hostSharePct}%</strong>.
        </p>
        <form onSubmit={save} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">BD (bps of host earnings)</label>
            <input
              type="number"
              min={0}
              max={10000}
              value={bdBps}
              onChange={(e) => setBdBps(Number(e.target.value))}
              className="w-28 rounded-lg border border-admin-border bg-admin-base px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Agency (bps of host earnings)</label>
            <input
              type="number"
              min={0}
              max={10000}
              value={agencyBps}
              onChange={(e) => setAgencyBps(Number(e.target.value))}
              className="w-28 rounded-lg border border-admin-border bg-admin-base px-3 py-2 text-sm text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

function PlatformCombinedCard({
  title,
  coins,
  highlight,
}: {
  title: string;
  coins: number;
  highlight?: boolean;
}) {
  const { coins: coinsText, inr } = formatCoinsAndInr(coins);
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? 'border-emerald-500/30 bg-emerald-950/20'
          : 'border-white/10 bg-black/20'
      }`}
    >
      <p className="text-xs text-zinc-400">{title}</p>
      <p className="text-lg font-bold text-white tabular-nums mt-2">{coinsText}</p>
      <p className="text-sm text-emerald-300/90 tabular-nums">{inr}</p>
    </div>
  );
}

export default RevenueSplitPage;
