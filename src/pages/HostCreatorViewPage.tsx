import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { HostProfileMedia } from '../components/host/HostProfileMedia';
import type { HostProfileCreator, HostProfileUser } from '../types/hostProfile';

export type HostCreatorViewConfig = {
  backHref: string;
  backLabel: string;
  editHref?: string;
  load: (creatorId: string) => Promise<{
    creator: HostProfileCreator;
    user: HostProfileUser;
    agencyLabel?: string | null;
    assignedAgencyLabel?: string | null;
  }>;
  extraMetrics?: React.ReactNode;
};

type HostCreatorViewPageProps = {
  config: HostCreatorViewConfig;
};

const HostCreatorViewPage: React.FC<HostCreatorViewPageProps> = ({ config }) => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const [creator, setCreator] = useState<HostProfileCreator | null>(null);
  const [user, setUser] = useState<HostProfileUser | null>(null);
  const [agencyLabel, setAgencyLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const loadRef = React.useRef(config.load);
  loadRef.current = config.load;

  useEffect(() => {
    if (!creatorId) return;
    let ok = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const d = await loadRef.current(creatorId);
        if (!ok) return;
        setCreator(d.creator);
        setUser(d.user);
        setAgencyLabel(d.agencyLabel ?? d.assignedAgencyLabel ?? null);
      } catch {
        if (ok) setErr('Failed to load host profile');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [creatorId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!creator || !user) {
    return (
      <div className="flex flex-col items-center py-24 gap-4">
        <p className="text-red-400">{err || 'Host not found'}</p>
        <Link to={config.backHref} className="text-sm text-emerald-400 hover:underline">
          ← {config.backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Link to={config.backHref} className="text-sm text-zinc-500 hover:text-white">
          ← {config.backLabel}
        </Link>
        {config.editHref ? (
          <Link
            to={config.editHref}
            className="text-sm rounded-xl bg-admin-accent text-admin-base font-semibold px-4 py-2"
          >
            Edit profile
          </Link>
        ) : null}
      </div>

      <div className="rounded-2xl border border-admin-border bg-admin-surface overflow-hidden">
        <div className="p-6 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white">{creator.name}</h1>
            <p className="text-emerald-400 font-medium text-sm mt-0.5">@{user.username || '—'}</p>
            <p className="text-sm text-zinc-500 mt-1">
              {creator.price} coins/min
              {creator.age != null ? ` · ${creator.age} yrs` : ''}
              {agencyLabel ? ` · ${agencyLabel}` : ''}
            </p>
          </div>

          <HostProfileMedia creator={creator} user={user} />

          {creator.about ? (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">About</h2>
              <p className="text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed">{creator.about}</p>
            </div>
          ) : null}

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
        </div>
      </div>

      {config.extraMetrics}
    </div>
  );
};

export default HostCreatorViewPage;
