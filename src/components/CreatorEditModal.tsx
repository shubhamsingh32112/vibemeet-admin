import React, { useCallback, useEffect, useState } from 'react';
import { creatorService } from '../services/creatorService';
import { adminService, type CreatorPerformance, type GalleryImageDto } from '../services/adminService';
import api from '../config/api';
import { compressImage } from '../utils/imageCompression';
import { uploadImageViaDirectSession, formatCloudflareApiError } from '../utils/cloudflareImageUpload';
import {
  galleryThumbUrl,
  hasLegacyFirebaseAvatarOnly,
  hostAvatarPreviewUrl,
  isLegacyFirebaseStorageUrl,
  normalizeGalleryImages,
} from '../utils/hostImageUrls';
import { CREATOR_PRICE_TIERS, normalizeCreatorPriceTier } from '../constants/creatorPriceTiers';

type Props = {
  row: CreatorPerformance;
  onClose: () => void;
  onSaved: () => void;
  /** Inline page layout (no overlay) for admin host detail. */
  variant?: 'modal' | 'page';
};

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

const GalleryContentType = 'image/jpeg' as const;

const CreatorEditModal: React.FC<Props> = ({
  row,
  onClose,
  onSaved,
  variant = 'modal',
}) => {
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);

  const [agenciesLoading, setAgenciesLoading] = useState(false);
  const [agenciesError, setAgenciesError] = useState('');
  const [agencies, setAgencies] = useState<{ id: string; label: string }[]>([]);
  const [targetAgencyId, setTargetAgencyId] = useState<string>(row.assignedAgencyId || '');
  const [transferReason, setTransferReason] = useState('');

  const [name, setName] = useState(row.name);
  const [about, setAbout] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [price, setPrice] = useState(() => normalizeCreatorPriceTier(row.price));
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [legacyPhotoOnly, setLegacyPhotoOnly] = useState(false);
  const [username, setUsername] = useState(row.username || '');
  const [categoriesStr, setCategoriesStr] = useState(categoriesToString(row.categories));
  const [galleryImages, setGalleryImages] = useState<GalleryImageDto[]>([]);

  const load = useCallback(async () => {
    setLoadError('');
    setLoading(true);
    try {
      setAgenciesError('');
      setAgenciesLoading(true);
      const agencyRows = await adminService.listAgenciesBrief().catch((e: unknown) => {
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setAgenciesError(err.response?.data?.error || err.message || 'Failed to load agencies');
        return [];
      });
      setAgencies(
        (agencyRows || []).map((a) => ({
          id: a.id,
          label: a.displayName || a.email || a.id,
        }))
      );
      setAgenciesLoading(false);

      const detail = await adminService.getCreatorDetail(row.creatorId);
      const c = detail.creator;
      setName(c.name);
      setAbout(c.about || '');
      setAvatarPreviewUrl(hostAvatarPreviewUrl(c));
      setLegacyPhotoOnly(hasLegacyFirebaseAvatarOnly(c));
      setPrice(normalizeCreatorPriceTier(c.price));
      setAge(c.age !== undefined && c.age !== null ? c.age : '');
      setCategoriesStr(categoriesToString(c.categories));
      setGalleryImages(normalizeGalleryImages(c.galleryImages));
      setUsername(detail.user?.username || row.username || '');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setLoadError(err.response?.data?.error || err.message || 'Failed to load creator');
    } finally {
      setLoading(false);
      setAgenciesLoading(false);
    }
  }, [row.creatorId, row.username, row.avatarUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTransferAgency = async () => {
    if (!targetAgencyId) {
      alert('Select a target agency');
      return;
    }
    if (targetAgencyId === row.assignedAgencyId) {
      alert('Creator is already assigned to this agency');
      return;
    }
    const reason = transferReason.trim();
    if (reason.length < 3) {
      alert('Reason is required (min 3 characters)');
      return;
    }
    if (
      !confirm(
        `Transfer this creator to the selected agency?\n\nCurrent: ${row.assignedAgencyLabel || row.assignedAgencyId || 'Unassigned'}\nTarget: ${
          agencies.find((a) => a.id === targetAgencyId)?.label || targetAgencyId
        }\n\nThis will retroactively change referral attribution.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await adminService.transferCreatorToAgency(row.creatorId, {
        targetAgencyId,
        reason,
      });
      onSaved();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      alert(err.response?.data?.error || err.message || 'Transfer failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    const cats = parseCategories(categoriesStr);
    if (name.trim().length < 2) {
      alert('Name must be at least 2 characters');
      return;
    }
    if (about.trim().length < 10 || about.trim().length > 1000) {
      alert('About must be between 10 and 1000 characters');
      return;
    }
    if (!avatarPreviewUrl) {
      alert('Profile photo is required — upload an image (saved via Cloudflare)');
      return;
    }
    if (username.trim().length < 4 || username.trim().length > 10) {
      alert('Username must be between 4 and 10 characters');
      return;
    }

    setSaving(true);
    try {
      await creatorService.update(row.creatorId, {
        name: name.trim(),
        about: about.trim(),
        categories: cats,
        price: Number(price),
        age: age === '' ? undefined : Number(age),
      });

      await adminService.patchCreatorLinkedUser(row.creatorId, {
        username: username.trim(),
        categories: cats,
      });

      onSaved();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      alert(err.response?.data?.error || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleMainPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setSaving(true);
      const b64 = await compressImage(file, 1024, 1024, 0.82, 350);
      const blob = await dataUrlToBlob(b64);
      const session = await uploadImageViaDirectSession(api, {
        purpose: 'creator-avatar',
        blob,
        contentType: 'image/jpeg',
        filename: 'profile.jpg',
      });
      const result = await adminService.creatorAvatarCommit(row.creatorId, session.sessionId);
      const nextUrl =
        result.avatarUrl ?? result.avatar?.avatarUrls?.md ?? null;
      if (!nextUrl || isLegacyFirebaseStorageUrl(nextUrl)) {
        alert('Photo upload did not return a Cloudflare URL. Check API image settings.');
        await load();
        return;
      }
      setAvatarPreviewUrl(nextUrl);
      setLegacyPhotoOnly(false);
      setGalleryImages(normalizeGalleryImages(result.galleryImages));
      await load();
      onSaved();
    } catch (err: unknown) {
      alert(formatCloudflareApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setGalleryBusy(true);
    try {
      const b64 = await compressImage(file, 1200, 1200, 0.82, 400);
      const blob = await dataUrlToBlob(b64);
      const { sessionId } = await uploadImageViaDirectSession(api, {
        purpose: 'creator-gallery',
        blob,
        contentType: GalleryContentType,
        filename: `gallery-${Date.now()}.jpg`,
      });
      const imgs = await adminService.creatorGalleryCommit(row.creatorId, sessionId);
      setGalleryImages(normalizeGalleryImages(imgs));
      onSaved();
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Gallery upload failed';
      alert(m);
    } finally {
      setGalleryBusy(false);
    }
  };

  const handleGalleryDelete = async (imageId: string) => {
    if (!confirm('Remove this gallery image?')) return;
    setGalleryBusy(true);
    try {
      const imgs = await adminService.creatorGalleryDelete(row.creatorId, imageId);
      setGalleryImages(normalizeGalleryImages(imgs));
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      alert(e.response?.data?.error || e.message || 'Delete failed');
    } finally {
      setGalleryBusy(false);
    }
  };

  const moveGallery = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= galleryImages.length) return;
    const ids = galleryImages.map((g) => g.id);
    const t = ids[index];
    ids[index] = ids[next];
    ids[next] = t;
    setGalleryBusy(true);
    try {
      const imgs = await adminService.creatorGalleryReorder(row.creatorId, ids);
      setGalleryImages(normalizeGalleryImages(imgs));
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      alert(e.response?.data?.error || e.message || 'Reorder failed');
    } finally {
      setGalleryBusy(false);
    }
  };

  const shellClass =
    variant === 'page'
      ? 'w-full max-w-3xl'
      : 'fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto';

  const panelClass =
    variant === 'page'
      ? 'bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-xl w-full overflow-hidden flex flex-col'
      : 'bg-zinc-900 border border-zinc-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col';

  return (
    <div className={shellClass}>
      <div
        className={panelClass}
        role="dialog"
        aria-labelledby="creator-edit-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <h2 id="creator-edit-title" className="text-lg font-semibold text-white">
            {variant === 'page' ? 'View / Edit host' : 'Edit creator'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white rounded-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div
          className={
            variant === 'page'
              ? 'px-4 py-4 space-y-5'
              : 'overflow-y-auto flex-1 px-4 py-4 space-y-5'
          }
        >
          {loading && <p className="text-sm text-zinc-400">Loading profile…</p>}
          {loadError && (
            <p className="text-sm text-red-400">
              {loadError}{' '}
              <button type="button" className="underline" onClick={load}>
                Retry
              </button>
            </p>
          )}

          {!loading && !loadError && (
            <>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Creator profile
                </h3>
                <label className="block text-xs text-zinc-500">Display name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
                />
                <label className="block text-xs text-zinc-500">About (10–1000 chars)</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm resize-y min-h-[100px]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500">Age</label>
                    <input
                      type="number"
                      min={18}
                      max={100}
                      value={age}
                      onChange={(e) =>
                        setAge(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500">Price / min (coins)</label>
                    <select
                      value={price}
                      onChange={(e) =>
                        setPrice(normalizeCreatorPriceTier(Number(e.target.value)))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
                    >
                      {CREATOR_PRICE_TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t} coins/min
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="block text-xs text-zinc-500">Categories (comma, max 4)</label>
                <input
                  value={categoriesStr}
                  onChange={(e) => setCategoriesStr(e.target.value)}
                  placeholder="e.g. lifestyle, gaming"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
                />
                <p className="text-xs text-zinc-500">
                  Profile photo is stored on Cloudflare Images and synced to the user avatar for
                  chat and the app.
                </p>
                {legacyPhotoOnly ? (
                  <p className="text-xs text-amber-400/90 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2">
                    Legacy Firebase photo on file — upload again to store on Cloudflare.
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer min-h-[44px]">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleMainPhotoFile}
                    />
                    <span className="px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-200">
                      Upload profile photo
                    </span>
                  </label>
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt=""
                      className="h-14 w-14 rounded-xl object-cover border border-zinc-700"
                    />
                  ) : (
                    <span className="text-xs text-amber-400/90">No photo yet</span>
                  )}
                </div>
              </section>

              <section className="space-y-3 border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  User identity
                </h3>
                <label className="block text-xs text-zinc-500">Username (4–10)</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
                />
                <p className="text-xs text-zinc-500">
                  User avatar is updated automatically when you upload the profile photo above.
                </p>
              </section>

              <section className="space-y-3 border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Agency assignment
                </h3>
                <p className="text-xs text-zinc-500">
                  Current: {row.assignedAgencyLabel || row.assignedAgencyId || 'Unassigned'}
                </p>

                {agenciesError ? (
                  <p className="text-xs text-red-400">{agenciesError}</p>
                ) : null}

                <label className="block text-xs text-zinc-500">Transfer to agency</label>
                <select
                  value={targetAgencyId}
                  onChange={(e) => setTargetAgencyId(e.target.value)}
                  disabled={agenciesLoading || saving || loading}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>

                <label className="block text-xs text-zinc-500">Reason (required)</label>
                <input
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. moved to new agency team"
                  disabled={saving || loading}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={
                      saving ||
                      loading ||
                      !!loadError ||
                      agenciesLoading ||
                      !targetAgencyId ||
                      targetAgencyId === (row.assignedAgencyId || '')
                    }
                    onClick={handleTransferAgency}
                    className="min-h-[44px] px-4 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-200 font-medium disabled:opacity-50"
                  >
                    Transfer agency
                  </button>
                </div>
              </section>

              <section className="space-y-3 border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Gallery
                </h3>
                <p className="text-xs text-zinc-500">
                  Images save immediately. Order changes apply on tap.
                </p>
                <label className={`inline-flex items-center gap-2 text-sm text-zinc-300 min-h-[44px] ${galleryBusy ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={galleryBusy}
                    onChange={handleGalleryAdd}
                  />
                  <span className="px-3 py-2 rounded-xl bg-emerald-900/30 border border-emerald-700/50 text-emerald-200">
                    {galleryBusy ? 'Working…' : '+ Add image'}
                  </span>
                </label>
                <ul className="space-y-2">
                  {galleryImages.map((img, i) => (
                    <li
                      key={img.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80"
                    >
                      {galleryThumbUrl(img) ? (
                        <img
                          src={galleryThumbUrl(img)!}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg border border-dashed border-zinc-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 text-xs text-zinc-500 truncate">{img.id}</div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={galleryBusy || i === 0}
                          onClick={() => moveGallery(i, -1)}
                          className="px-2 py-1 text-xs rounded-lg bg-zinc-700 text-zinc-200 disabled:opacity-30 min-h-[36px] min-w-[36px]"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={galleryBusy || i === galleryImages.length - 1}
                          onClick={() => moveGallery(i, 1)}
                          className="px-2 py-1 text-xs rounded-lg bg-zinc-700 text-zinc-200 disabled:opacity-30 min-h-[36px] min-w-[36px]"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={galleryBusy}
                          onClick={() => handleGalleryDelete(img.id)}
                          className="px-2 py-1 text-xs rounded-lg bg-red-900/40 text-red-300 min-h-[36px]"
                        >
                          Del
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>

        <div className="flex gap-2 justify-end px-4 py-3 border-t border-zinc-800 bg-zinc-900/95 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700"
          >
            {variant === 'page' ? 'Back' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={saving || loading || !!loadError}
            onClick={handleSaveProfile}
            className="min-h-[44px] px-4 rounded-xl bg-violet-600 text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatorEditModal;
