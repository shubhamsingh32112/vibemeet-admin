import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  agencyPortalService,
  type AgencyCreatorDetailData,
  type AgencyCreatorsPeriod,
} from '../../services/agencyPortalService';

const PERIODS: { value: AgencyCreatorsPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const AgencyCreatorViewPage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const [period, setPeriod] = useState<AgencyCreatorsPeriod>('today');
  const [data, setData] = useState<AgencyCreatorDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!creatorId) return;
    let ok = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const d = await agencyPortalService.getCreatorDetail(creatorId, period);
        if (ok) setData(d);
      } catch {
        if (ok) setErr('Failed to load creator');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [creatorId, period]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center py-24 gap-4">
        <p className="text-red-400">{err || 'Creator not found'}</p>
        <Link to="/agency/creators" className="text-sm text-emerald-400 hover:underline">
          ← Back to creators
        </Link>
      </div>
    );
  }

  const { creator, user, availability, callStats, pendingWithdrawal, earningsSummaryCoins } = data;
  const gallery = [...(creator.galleryImages || [])].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Link to="/agency/creators" className="text-sm text-zinc-500 hover:text-white">
          ← Creators
        </Link>
        <Link
          to={`/agency/creators/${creatorId}/edit`}
          className="text-sm rounded-xl bg-admin-accent text-admin-base font-semibold px-4 py-2"
        >
          Edit profile
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">Metrics period:</span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as AgencyCreatorsPeriod)}
          className="rounded-lg bg-admin-base border border-admin-border text-white text-sm px-2 py-1.5"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-admin-border bg-admin-surface overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex gap-2 shrink-0">
              <img
                src={creator.photo}
                alt=""
                className="w-24 h-24 rounded-2xl object-cover border border-admin-border"
              />
              {user.avatar && user.avatar !== creator.photo ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  title="User avatar"
                  className="w-16 h-16 rounded-2xl object-cover border border-admin-border self-end"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">{creator.name}</h1>
              <p className="text-emerald-400 font-medium">@{user.username || '—'}</p>
              <p className="text-sm text-zinc-500 mt-1">
                {availability === 'online' ? (
                  <span className="text-emerald-400">Online</span>
                ) : (
                  <span className="text-zinc-500">Busy / offline</span>
                )}{' '}
                · {creator.price} coins/min
                {creator.age != null ? ` · ${creator.age} yrs` : ''}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">About</h2>
            <p className="text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed">{creator.about}</p>
          </div>

          {creator.categories?.length ? (
            <div className="flex flex-wrap gap-2">
              {creator.categories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs px-2 py-1 rounded-lg bg-admin-elevated text-zinc-300 border border-admin-border"
                >
                  {cat}
                </span>
              ))}
            </div>
          ) : null}

          {gallery.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Gallery ({gallery.length})
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {gallery.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-admin-border bg-admin-base"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
        <div className="rounded-lg border border-admin-border p-3">
          <p className="text-zinc-500 text-xs">User coins</p>
          <p className="text-white font-semibold">{user.coins ?? 0}</p>
        </div>
        <div className="rounded-lg border border-admin-border p-3">
          <p className="text-zinc-500 text-xs">Lifetime earnings (doc)</p>
          <p className="text-white font-semibold">{creator.earningsCoins}</p>
        </div>
        <div className="rounded-lg border border-admin-border p-3">
          <p className="text-zinc-500 text-xs">1d / 7d / 30d coins</p>
          <p className="text-white font-semibold text-xs">
            {earningsSummaryCoins.last1d} / {earningsSummaryCoins.last7d} / {earningsSummaryCoins.last30d}
          </p>
        </div>
        <div className="rounded-lg border border-admin-border p-3">
          <p className="text-zinc-500 text-xs">Talk (period)</p>
          <p className="text-white font-semibold">{callStats.periodTalkMinutes}m</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg border border-admin-border p-3">
          <p className="text-zinc-500 text-xs">Calls (period)</p>
          <p className="text-white font-semibold">{callStats.periodCallCount}</p>
        </div>
        <div className="rounded-lg border border-admin-border p-3">
          <p className="text-zinc-500 text-xs">Coins earned (period)</p>
          <p className="text-white font-semibold">{callStats.periodCoinsEarned}</p>
        </div>
        <div className="rounded-lg border border-admin-border p-3">
          <p className="text-zinc-500 text-xs">All-time talk / calls</p>
          <p className="text-white font-semibold">
            {callStats.allTimeTalkMinutes}m · {callStats.allTimeCallCount}
          </p>
        </div>
      </div>

      {pendingWithdrawal && (
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-4 text-sm">
          <p className="text-amber-200 font-medium">Pending withdrawal</p>
          <p className="text-zinc-300 mt-1">
            {pendingWithdrawal.amount} coins · requested {new Date(pendingWithdrawal.requestedAt).toLocaleString()}
          </p>
          <Link to="/agency/withdrawals" className="text-emerald-400 text-sm mt-2 inline-block hover:underline">
            Go to withdrawals →
          </Link>
        </div>
      )}
    </div>
  );
};

export default AgencyCreatorViewPage;
