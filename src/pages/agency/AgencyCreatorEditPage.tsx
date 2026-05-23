import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  agencyPortalService,
  type AgencyCreatorDetailData,
  type GalleryImageDto,
} from '../../services/agencyPortalService';
import { agencyApi } from '../../config/agencyApi';
import { compressImage } from '../../utils/imageCompression';
import { uploadImageViaDirectSession, formatCloudflareApiError } from '../../utils/cloudflareImageUpload';
import {
  galleryThumbUrl,
  hasLegacyFirebaseAvatarOnly,
  hostAvatarPreviewUrl,
  isLegacyFirebaseStorageUrl,
  normalizeGalleryImages,
} from '../../utils/hostImageUrls';
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

const AgencyCreatorEditPage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [data, setData] = useState<AgencyCreatorDetailData | null>(null);

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [legacyPhotoOnly, setLegacyPhotoOnly] = useState(false);
  const [age, setAge] = useState<number | ''>('');
  const [username, setUsername] = useState('');
  const [categoriesStr, setCategoriesStr] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryImageDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);

  const load = useCallback(async () => {
    if (!creatorId) return;
    setLoading(true);
    setErr('');
    try {
      const d = await agencyPortalService.getCreatorDetail(creatorId, 'today');
      setData(d);
      setName(d.creator.name);
      setAbout(d.creator.about);
      setAvatarPreviewUrl(hostAvatarPreviewUrl(d.creator));
      setLegacyPhotoOnly(hasLegacyFirebaseAvatarOnly(d.creator));
      setAge(d.creator.age ?? '');
      setUsername(d.user?.username || '');
      setCategoriesStr(categoriesToString(d.creator.categories));
      setGalleryImages(normalizeGalleryImages(d.creator.galleryImages));
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
    if (!avatarPreviewUrl) {
      setErr('Profile photo is required — upload an image');
      return;
    }
    if (username.trim().length < 4 || username.trim().length > 10) {
      setErr('Username must be between 4 and 10 characters');
      return;
    }

    setSaving(true);
    setErr('');
    try {
      await agencyPortalService.updateCreatorProfile(creatorId, {
        name: name.trim(),
        about: about.trim(),
        categories: cats,
        age: age === '' ? undefined : Number(age),
      });
      await agencyPortalService.patchCreatorUser(creatorId, {
        username: username.trim(),
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
      setErr('');
      const b64 = await compressImage(file, 1024, 1024, 0.82, 350);
      const blob = await dataUrlToBlob(b64);
      const session = await uploadImageViaDirectSession(agencyApi, {
        purpose: 'creator-avatar',
        blob,
        contentType: 'image/jpeg',
        filename: 'profile.jpg',
      });
      const result = await agencyPortalService.creatorAvatarCommit(creatorId, session.sessionId);
      const nextUrl = result.avatarUrl ?? result.avatar?.avatarUrls?.md ?? null;
      if (!nextUrl || isLegacyFirebaseStorageUrl(nextUrl)) {
        setErr('Photo upload did not return a Cloudflare URL. Check API image settings.');
        await load();
        return;
      }
      setAvatarPreviewUrl(nextUrl);
      setLegacyPhotoOnly(false);
      setGalleryImages(normalizeGalleryImages(result.galleryImages));
      await load();
    } catch (ex: unknown) {
      setErr(formatCloudflareApiError(ex));
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
      const { sessionId } = await uploadImageViaDirectSession(agencyApi, {
        purpose: 'creator-gallery',
        blob,
        contentType: GalleryContentType,
        filename: `gallery-${Date.now()}.jpg`,
      });
      const imgs = await agencyPortalService.creatorGalleryCommit(creatorId, sessionId);
      setGalleryImages(normalizeGalleryImages(imgs));
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
      const imgs = await agencyPortalService.creatorGalleryDelete(creatorId, imageId);
      setGalleryImages(normalizeGalleryImages(imgs));
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
      const imgs = await agencyPortalService.creatorGalleryReorder(creatorId, ids);
      setGalleryImages(normalizeGalleryImages(imgs));
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
        <Link to={`/agency/creators/${creatorId}`} className="text-sm text-zinc-500 hover:text-white">
          ← View profile
        </Link>
        <Link to="/agency/creators" className="text-sm text-zinc-500 hover:text-white">
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
          <label className="text-xs text-zinc-400">Profile photo</label>
          <p className="text-xs text-zinc-500 mt-0.5 mb-2">
            Stored on Cloudflare Images; user avatar syncs automatically for the app.
          </p>
          {legacyPhotoOnly ? (
            <p className="text-xs text-amber-400/90 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 mb-2">
              Legacy Firebase photo on file — upload again to store on Cloudflare.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-emerald-300 cursor-pointer min-h-[44px]">
              <input type="file" accept="image/*" className="sr-only" onChange={handleMainPhotoFile} />
              <span className="px-3 py-2 rounded-xl border border-admin-border">Upload profile photo</span>
            </label>
            {avatarPreviewUrl ? (
              <img
                src={avatarPreviewUrl}
                alt=""
                className="h-16 w-16 rounded-xl object-cover border border-admin-border"
              />
            ) : (
              <span className="text-xs text-amber-400/90">No photo yet</span>
            )}
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
                {galleryThumbUrl(img) ? (
                  <img
                    src={galleryThumbUrl(img)!}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-dashed border-admin-border shrink-0" />
                )}
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

export default AgencyCreatorEditPage;
