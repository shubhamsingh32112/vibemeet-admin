import type { HostGalleryImageDto, HostProfileCreator } from '../types/hostProfile';
import type { GalleryImageDto } from '../services/adminService';

/** Nested gallery row from some API paths before staff DTO mapping. */
export type GalleryImageNested = {
  id: string;
  url?: string;
  position?: number;
  createdAt?: string;
  storagePath?: string;
  image?: {
    galleryUrls?: {
      thumb?: string;
      md?: string;
      xl?: string;
    };
  };
};

/** Gallery row from API — flat staff DTO or nested serialize shape. */
export type GalleryImageLike = GalleryImageDto | HostGalleryImageDto | GalleryImageNested;

export function isLegacyFirebaseStorageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const u = url.toLowerCase();
  return u.includes('firebasestorage.googleapis.com') || u.includes('.appspot.com');
}

export function hostAvatarPreviewUrl(
  creator: Pick<HostProfileCreator, 'avatar' | 'avatarUrl' | 'photo'>,
): string | null {
  const fromAsset = creator.avatar?.avatarUrls?.md ?? creator.avatar?.avatarUrls?.sm ?? null;
  if (fromAsset) return fromAsset;
  const fromAvatarUrl = creator.avatarUrl?.trim() || null;
  if (fromAvatarUrl && !isLegacyFirebaseStorageUrl(fromAvatarUrl)) return fromAvatarUrl;
  const fromPhoto = creator.photo?.trim() || null;
  if (fromPhoto && !isLegacyFirebaseStorageUrl(fromPhoto)) return fromPhoto;
  return null;
}

export function hasLegacyFirebaseAvatarOnly(
  creator: Pick<HostProfileCreator, 'avatar' | 'avatarUrl' | 'photo'>,
): boolean {
  if (hostAvatarPreviewUrl(creator)) return false;
  const legacy = creator.photo?.trim() || creator.avatarUrl?.trim() || null;
  return isLegacyFirebaseStorageUrl(legacy);
}

export function galleryThumbUrl(item: GalleryImageLike | null | undefined): string | null {
  if (!item) return null;
  const flat = typeof item.url === 'string' ? item.url.trim() : '';
  if (flat) return flat;
  if ('image' in item && item.image?.galleryUrls) {
    const nested = item.image.galleryUrls;
    return nested.md ?? nested.xl ?? nested.thumb ?? null;
  }
  return null;
}

export function normalizeGalleryImages(
  items: GalleryImageLike[] | null | undefined,
): GalleryImageDto[] {
  if (!items?.length) return [];
  const out: GalleryImageDto[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const url = galleryThumbUrl(item);
    if (!url) continue;
    const dto: GalleryImageDto = {
      id: item.id,
      url,
      position: item.position ?? index,
      createdAt:
        typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    };
    if ('storagePath' in item && typeof item.storagePath === 'string') {
      dto.storagePath = item.storagePath;
    }
    if ('image' in item && item.image) {
      dto.image = item.image;
    }
    out.push(dto);
  }
  return out.sort((a, b) => a.position - b.position);
}
