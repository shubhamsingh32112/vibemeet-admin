import React from 'react';
import { ImageIcon, User } from 'lucide-react';
import type { HostProfileMediaProps } from '../../types/hostProfile';
import {
  galleryThumbUrl,
  hasLegacyFirebaseAvatarOnly,
  hostAvatarPreviewUrl,
} from '../../utils/hostImageUrls';

export const HostProfileMedia: React.FC<HostProfileMediaProps> = ({ creator, user }) => {
  const dpUrl = hostAvatarPreviewUrl(creator) ?? hostAvatarPreviewUrl({
    avatar: user?.avatar ?? null,
    avatarUrl: user?.avatarUrl ?? null,
    photo: null,
  });
  const legacyOnly = hasLegacyFirebaseAvatarOnly(creator);
  const gallery = [...(creator.galleryImages || [])].sort((a, b) => a.position - b.position);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        {dpUrl ? (
          <a
            href={dpUrl}
            target="_blank"
            rel="noreferrer"
            className="block shrink-0 rounded-2xl overflow-hidden border border-admin-border ring-1 ring-white/5"
          >
            <img
              src={dpUrl}
              alt={`${creator.name} profile`}
              className="w-28 h-28 sm:w-32 sm:h-32 object-cover"
            />
          </a>
        ) : (
          <div className="flex w-28 h-28 sm:w-32 sm:h-32 shrink-0 items-center justify-center rounded-2xl border border-dashed border-zinc-600 bg-zinc-900/80 text-zinc-500">
            <User className="h-10 w-10" aria-hidden />
          </div>
        )}
        <div className="text-sm text-zinc-400 space-y-1 min-w-[140px]">
          <p>
            <span className="text-zinc-500">Profile photo:</span>{' '}
            {dpUrl ? (
              <span className="text-emerald-400/90">Uploaded</span>
            ) : legacyOnly ? (
              <span className="text-amber-400/90">Legacy — re-upload</span>
            ) : (
              <span className="text-amber-400/90">Not set</span>
            )}
          </p>
          <p>
            <span className="text-zinc-500">Gallery:</span>{' '}
            <span className="text-zinc-200 tabular-nums">
              {gallery.length} / {creator.galleryCount ?? gallery.length} image
              {gallery.length === 1 ? '' : 's'}
            </span>
          </p>
        </div>
      </div>

      {legacyOnly ? (
        <p className="text-xs text-amber-400/90 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2">
          Legacy Firebase profile photo — edit the host and upload again to migrate to Cloudflare.
        </p>
      ) : null}

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          Additional photos
        </h2>
        {gallery.length === 0 ? (
          <p className="text-sm text-zinc-500 rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center">
            No gallery images uploaded yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {gallery.map((img, idx) => {
              const thumb = galleryThumbUrl(img);
              return (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-admin-border bg-admin-base"
                >
                  {thumb ? (
                    <a href={thumb} target="_blank" rel="noreferrer" className="block w-full h-full">
                      <img
                        src={thumb}
                        alt={`${creator.name} gallery ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-full border border-dashed border-zinc-600" />
                  )}
                  <span className="absolute bottom-1 right-1 text-[10px] rounded bg-black/60 px-1.5 py-0.5 text-zinc-300">
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HostProfileMedia;
