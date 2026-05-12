import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  agentPortalService,
  type AgentCreatorDetailData,
  type GalleryImageDto,
} from '../../services/agentPortalService';
import { uploadCreatorProfileImage } from '../../utils/firebaseStorage';
import { compressImage } from '../../utils/imageCompression';
import { normalizeCreatorPriceTier } from '../../constants/creatorPriceTiers';

const GalleryContentType = 'image/jpeg' as const;

function categoriesToString(cats: string[] | undefined): string {
  return (cats || []).join(', ');
}

function parseCategories(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 4);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

const AgentCreatorEditPage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [data, setData] = useState<AgentCreatorDetailData | null>(null);

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [photo, setPhoto] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [syncAvatarWithPhoto, setSyncAvatarWithPhoto] = useState(true);
  const [categoriesStr, setCategoriesStr] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryImageDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);

  const load = useCallback(async () => {
    if (!creatorId) return;
    setLoading(true);
    setErr('');
    try {
      const d = await agentPortalService.getCreatorDetail(creatorId, 'today');
      setData(d);
      setName(d.creator.name);
      setAbout(d.creator.about);
      setPhoto(d.creator.photo);
      setAge(d.creator.age ?? '');
      setUsername(d.user?.username || '');
      setAvatar(d.user?.avatar || '');
      setSyncAvatarWithPhoto(true);
      setCategoriesStr(categoriesToString(d.creator.categories));
      setGalleryImages([...(d.creator.galleryImages || [])].sort((a, b) => a.position - b.position));
    } catch {
      setErr('Failed to load creator');
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!creatorId) return;
    const cats = parseCategories(categoriesStr);
    if (name.trim().length < 2) {
      setErr('Name must be at least 2 characters');
      return;
    }
    if (about.trim().length < 10 || about.trim().length > 1000) {
      setErr('About must be between 10 and 1000 characters');
      return;
    }
    if (!photo.trim()) {
      setErr('Main photo is required — upload an image');
      return;
    }
    if (username.trim().length < 4 || username.trim().length > 10) {
      setErr('Username must be between 4 and 10 characters');
      return;
    }

    setSaving(true);
    setErr('');
    try {
      await agentPortalService.updateCreatorProfile(creatorId, {
        name: name.trim(),
        about: about.trim(),
        photo: photo.trim(),
        categories: cats,
        age: age === '' ? undefined : Number(age),
      });
      const avatarVal = syncAvatarWithPhoto ? photo.trim() : avatar.trim();
      await agentPortalService.patchCreatorUser(creatorId, {
        username: username.trim(),
        avatar: avatarVal || undefined,
        categories: cats,
      });
      await load();
    } catch {
      setErr('Save failed — check validation (e.g. about min length, age 18–100).');
    } finally {
      setSaving(false);
    }
  };

  const handleMainPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !creatorId) return;
    try {
      setSaving(true);
      const b64 = await compressImage(file, 1024, 1024, 0.82, 350);
      const blob = await dataUrlToBlob(b64);
      const jpeg = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const url = await uploadCreatorProfileImage(jpeg, creatorId);
      setPhoto(url);
      if (syncAvatarWithPhoto) setAvatar(url);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !creatorId) return;
    try {
      setSaving(true);
      const b64 = await compressImage(file, 512, 512, 0.82, 200);
      const blob = await dataUrlToBlob(b64);
      const jpeg = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const url = await uploadCreatorProfileImage(jpeg, `${creatorId}-avatar`);
      setSyncAvatarWithPhoto(false);
      setAvatar(url);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !creatorId) return;
    setGalleryBusy(true);
    try {
      const b64 = await compressImage(file, 1200, 1200, 0.82, 400);
      const blob = await dataUrlToBlob(b64);
      // Cloudflare-Images direct upload (see CreatorEditModal for shape).
      const { uploadUrl, sessionId } = await agentPortalService.creatorGalleryUploadUrl(
        creatorId,
        GalleryContentType,
        blob.size,
      );
      const formData = new FormData();
      formData.append('file', blob, `gallery-${Date.now()}.jpg`);
      const put = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      if (!put.ok) throw new Error(`Cloudflare upload failed (${put.status})`);
      const imgs = await agentPortalService.creatorGalleryCommit(creatorId, sessionId);
      setGalleryImages(imgs.sort((a, b) => a.position - b.position));
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Gallery upload failed');
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleGalleryDelete = async (imageId: string) => {
    if (!creatorId || !confirm('Remove this gallery image?')) return;
    setGalleryBusy(true);
    try {
      const imgs = await agentPortalService.creatorGalleryDelete(creatorId, imageId);
      setGalleryImages(imgs.sort((a, b) => a.position - b.position));
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Delete failed');
      setErr(msg);
    } finally {
      setGalleryBusy(false);
    }
  };

  const moveGallery = async (index: number, dir: -1 | 1) => {
    if (!creatorId) return;
    const next = index + dir;
    if (next < 0 || next >= galleryImages.length) return;
    const ids = galleryImages.map((g) => g.id);
    const t = ids[index];
    ids[index] = ids[next];
    ids[next] = t;
    setGalleryBusy(true);
    try {
      const imgs = await agentPortalService.creatorGalleryReorder(creatorId, ids);
      setGalleryImages(imgs.sort((a, b) => a.position - b.position));
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Reorder failed');
      setErr(msg);
    } finally {
      setGalleryBusy(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center py-24">
        {err && !data ? <p className="text-red-400">{err}</p> : <LoadingSpinner />}
      </div>
    );
  }

  const es = data.earningsSummaryCoins;

  return (
    <div className="space-y-6 max-w-2xl pb-12">
      <div className="flex flex-wrap items-center gap-3">
        <Link to={`/agent/creators/${creatorId}`} className="text-sm text-zinc-500 hover:text-white">
          ← View profile
        </Link>
        <Link to="/agent/creators" className="text-sm text-zinc-500 hover:text-white">
          All creators
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
          <label className="text-xs text-zinc-400">Categories (comma, max 4)</label>
          <input
            value={categoriesStr}
            onChange={(e) => setCategoriesStr(e.target.value)}
            className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          />
        </div>
        <p className="text-xs text-zinc-500 rounded-lg border border-admin-border border-dashed px-3 py-2">
          Price:{' '}
          <span className="text-zinc-300 font-medium">
            {normalizeCreatorPriceTier(data.creator.price)} coins/min
          </span>{' '}
          — only Super Admin can change pricing.
        </p>
        <div>
          <label className="text-xs text-zinc-400">Age (18–100)</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-1 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="border-t border-admin-border pt-4">
          <label className="text-xs text-zinc-400">Main photo</label>
          <p className="text-xs text-zinc-500 mt-0.5 mb-2">Upload an image — no URL field.</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-emerald-300 cursor-pointer min-h-[44px]">
              <input type="file" accept="image/*" className="sr-only" onChange={handleMainPhotoFile} />
              <span className="px-3 py-2 rounded-xl border border-admin-border">Upload main photo</span>
            </label>
            {photo ? (
              <img src={photo} alt="" className="h-16 w-16 rounded-xl object-cover border border-admin-border" />
            ) : null}
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

        <div className="border-t border-admin-border pt-4 space-y-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={syncAvatarWithPhoto}
              onChange={(e) => {
                setSyncAvatarWithPhoto(e.target.checked);
                if (e.target.checked) setAvatar(photo);
              }}
            />
            Use main photo as user avatar
          </label>
          {!syncAvatarWithPhoto && (
            <div>
              <label className="text-xs text-zinc-400">Avatar (upload)</label>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarFile} />
                  <span className="px-3 py-2 rounded-xl border border-admin-border">Upload avatar</span>
                </label>
                {avatar ? (
                  <img src={avatar} alt="" className="h-12 w-12 rounded-xl object-cover border border-admin-border" />
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-admin-border pt-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Gallery (up to 6)</h3>
          <p className="text-xs text-zinc-500">Upload images — stored via signed URLs.</p>
          <label
            className={`inline-flex items-center gap-2 text-sm text-zinc-300 min-h-[44px] ${
              galleryBusy ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={galleryBusy}
              onChange={handleGalleryAdd}
            />
            <span className="px-3 py-2 rounded-xl border border-admin-border">+ Add image</span>
          </label>
          <ul className="space-y-2">
            {galleryImages.map((img, i) => (
              <li
                key={img.id}
                className="flex items-center gap-3 p-2 rounded-xl bg-admin-base border border-admin-border"
              >
                <img src={img.url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                <div className="flex flex-col gap-1 shrink-0 ml-auto">
                  <button
                    type="button"
                    disabled={galleryBusy || i === 0}
                    onClick={() => moveGallery(i, -1)}
                    className="px-2 py-1 text-xs rounded-lg bg-admin-elevated disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={galleryBusy || i === galleryImages.length - 1}
                    onClick={() => moveGallery(i, 1)}
                    className="px-2 py-1 text-xs rounded-lg bg-admin-elevated disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={galleryBusy}
                    onClick={() => handleGalleryDelete(img.id)}
                    className="px-2 py-1 text-xs rounded-lg bg-red-900/40 text-red-300"
                  >
                    Del
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-admin-accent text-admin-base font-semibold px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  );
};

export default AgentCreatorEditPage;
