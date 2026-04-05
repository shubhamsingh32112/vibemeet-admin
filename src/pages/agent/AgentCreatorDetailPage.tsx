import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { agentPortalService } from '../../services/agentPortalService';

const AgentCreatorDetailPage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  type Detail = {
    creator: {
      id: string;
      name: string;
      about: string;
      photo: string;
      categories: string[];
      price: number;
      age?: number;
    };
    user: { username?: string; email?: string; coins?: number; profileRevision?: number };
    earningsSummaryCoins?: { last1d: number; last7d: number; last30d: number };
  };
  const [data, setData] = useState<Detail | null>(null);

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [photo, setPhoto] = useState('');
  const [price, setPrice] = useState(0);
  const [age, setAge] = useState<number | ''>('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!creatorId) return;
    let ok = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const d = (await agentPortalService.getCreatorDetail(creatorId)) as Detail;
        if (!ok) return;
        setData(d);
        setName(d.creator.name);
        setAbout(d.creator.about);
        setPhoto(d.creator.photo);
        setPrice(d.creator.price);
        setAge(d.creator.age ?? '');
        setUsername(d.user?.username || '');
      } catch {
        if (ok) setErr('Failed to load creator');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [creatorId]);

  const save = async () => {
    if (!creatorId) return;
    setSaving(true);
    setErr('');
    try {
      await agentPortalService.updateCreatorProfile(creatorId, {
        name,
        about,
        photo,
        price,
        ...(age !== '' ? { age: Number(age) } : {}),
      });
      if (username.trim().length >= 4) {
        await agentPortalService.patchCreatorUser(creatorId, { username: username.trim() });
      }
      const d = (await agentPortalService.getCreatorDetail(creatorId)) as Detail;
      setData(d);
    } catch (e: unknown) {
      setErr('Save failed — check validation (e.g. about min length, age 18–100).');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  const es = data.earningsSummaryCoins;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/agent/creators" className="text-sm text-zinc-500 hover:text-white">
          ← Creators
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Edit creator</h1>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      {es && (
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg border border-admin-border p-3">
            <p className="text-zinc-500 text-xs">1d coins</p>
            <p className="text-white font-semibold">{es.last1d}</p>
          </div>
          <div className="rounded-lg border border-admin-border p-3">
            <p className="text-zinc-500 text-xs">7d coins</p>
            <p className="text-white font-semibold">{es.last7d}</p>
          </div>
          <div className="rounded-lg border border-admin-border p-3">
            <p className="text-zinc-500 text-xs">30d coins</p>
            <p className="text-white font-semibold">{es.last30d}</p>
          </div>
        </div>
      )}
      <div className="space-y-4 rounded-xl border border-admin-border bg-admin-surface p-4">
        <div>
          <label className="text-xs text-zinc-400">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400">About (min 10 chars)</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Photo URL</label>
          <input
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400">Price (coins/min)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Age (18–100)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-400">Username (4–10 chars)</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-admin-accent text-admin-base font-semibold px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

export default AgentCreatorDetailPage;
