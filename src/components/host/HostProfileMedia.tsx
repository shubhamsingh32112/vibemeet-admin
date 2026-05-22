import React from 'react';
import { ImageIcon, User } from 'lucide-react';
import type { HostProfileMediaProps } from '../../types/hostProfile';

function pickDisplayUrl(
  creator: HostProfileMediaProps['creator'],
  user?: HostProfileMediaProps['user'] | null
): string | null {
  return (
    creator.avatar?.avatarUrls?.md ||
    creator.avatarUrl ||
    creator.photo ||
    creator.avatar?.avatarUrls?.sm ||
    user?.avatarUrl ||
    user?.avatar?.avatarUrls?.md ||
    user?.avatar?.avatarUrls?.sm ||
    null
  );
}

export const HostProfileMedia: React.FC<HostProfileMediaProps> = ({ creator, user }) => {
  const dpUrl = pickDisplayUrl(creator, user);
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
            {gallery.map((img, idx) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden border border-admin-border bg-admin-base"
              >
                <img
                  src={img.url}
                  alt={`${creator.name} gallery ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 text-[10px] rounded bg-black/60 px-1.5 py-0.5 text-zinc-300">
                  {idx + 1}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HostProfileMedia;
