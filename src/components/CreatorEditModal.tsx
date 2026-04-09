import React, { useCallback, useEffect, useState } from 'react';
import { creatorService } from '../services/creatorService';
import { adminService, type CreatorPerformance, type GalleryImageDto } from '../services/adminService';
import { uploadCreatorProfileImage } from '../utils/firebaseStorage';
import { compressImage } from '../utils/imageCompression';
import { CREATOR_PRICE_TIERS, normalizeCreatorPriceTier } from '../constants/creatorPriceTiers';

type Props = {
  row: CreatorPerformance;
  onClose: () => void;
  onSaved: () => void;
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

const CreatorEditModal: React.FC<Props> = ({ row, onClose, onSaved }) => {
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);

  const [name, setName] = useState(row.name);
  const [about, setAbout] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [price, setPrice] = useState(() => normalizeCreatorPriceTier(row.price));
  const [photo, setPhoto] = useState(row.photo);
  const [username, setUsername] = useState(row.username || '');
  const [avatar, setAvatar] = useState(row.avatar || '');
  const [syncAvatarWithPhoto, setSyncAvatarWithPhoto] = useState(true);
  const [categoriesStr, setCategoriesStr] = useState(categoriesToString(row.categories));
  const [galleryImages, setGalleryImages] = useState<GalleryImageDto[]>([]);

  const load = useCallback(async () => {
    setLoadError('');
    setLoading(true);
    try {
      const c = await creatorService.getById(row.creatorId);
      setName(c.name);
      setAbout(c.about || '');
      setPhoto(c.photo);
      setPrice(normalizeCreatorPriceTier(c.price));
      setAge(c.age !== undefined && c.age !== null ? c.age : '');
      setCategoriesStr(categoriesToString(c.categories));
      setGalleryImages(
        [...(c.galleryImages || [])].sort((a, b) => a.position - b.position)
      );
      setUsername(row.username || '');
      setAvatar(row.avatar || '');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setLoadError(err.response?.data?.error || err.message || 'Failed to load creator');
    } finally {
      setLoading(false);
    }
  }, [row.creatorId, row.username, row.avatar]);

  useEffect(() => {
    load();
  }, [load]);

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
    if (!photo.trim()) {
      alert('Main photo URL is required');
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
        photo: photo.trim(),
        categories: cats,
        price: Number(price),
        age: age === '' ? undefined : Number(age),
      });

      const avatarVal = syncAvatarWithPhoto ? photo.trim() : avatar.trim();
      await adminService.patchCreatorLinkedUser(row.creatorId, {
        username: username.trim(),
        avatar: avatarVal || undefined,
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
      const jpeg = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const url = await uploadCreatorProfileImage(jpeg, row.creatorId);
      setPhoto(url);
      if (syncAvatarWithPhoto) setAvatar(url);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Upload failed';
      alert(m);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setSaving(true);
      const b64 = await compressImage(file, 512, 512, 0.82, 200);
      const blob = await dataUrlToBlob(b64);
      const jpeg = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const url = await uploadCreatorProfileImage(jpeg, `${row.creatorId}-avatar`);
      setSyncAvatarWithPhoto(false);
      setAvatar(url);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Upload failed';
      alert(m);
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
      const { uploadUrl, imageId, storagePath, contentType } =
        await adminService.creatorGalleryUploadUrl(row.creatorId, GalleryContentType);
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
      });
      if (!put.ok) {
        throw new Error(`Storage upload failed (${put.status})`);
      }
      const imgs = await adminService.creatorGalleryCommit(row.creatorId, imageId, storagePath);
      setGalleryImages(imgs);
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
      setGalleryImages(imgs);
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
      setGalleryImages(imgs);
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      alert(e.response?.data?.error || e.message || 'Reorder failed');
    } finally {
      setGalleryBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div
        className="bg-zinc-900 border border-zinc-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="creator-edit-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <h2 id="creator-edit-title" className="text-lg font-semibold text-white">
            Edit creator
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

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">
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
                <label className="block text-xs text-zinc-500">Main photo URL</label>
                <input
                  value={photo}
                  onChange={(e) => {
                    setPhoto(e.target.value);
                    if (syncAvatarWithPhoto) setAvatar(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-mono"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer min-h-[44px]">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleMainPhotoFile}
                    />
                    <span className="px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-200">
                      Upload main photo
                    </span>
                  </label>
                  {photo ? (
                    <img src={photo} alt="" className="h-14 w-14 rounded-xl object-cover border border-zinc-700" />
                  ) : null}
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
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer min-h-[44px]">
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
                  <>
                    <label className="block text-xs text-zinc-500">Avatar URL</label>
                    <input
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-mono"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer min-h-[44px]">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleAvatarFile}
                      />
                      <span className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200">
                        Upload avatar
                      </span>
                    </label>
                  </>
                )}
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
                      <img
                        src={img.url}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover shrink-0"
                      />
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
            Cancel
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
