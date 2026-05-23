import type { HostGalleryImageDto, HostProfileCreator } from '../types/hostProfile';
import type { GalleryImageDto } from '../services/adminService';

/** Gallery row from API — flat staff DTO or nested serialize shape. */
export type GalleryImageLike =
  | GalleryImageDto
  | HostGalleryImageDto
  | {
      id: string;
      url?: string;
      position?: number;
      createdAt?: string;
      image?: {
        galleryUrls?: {
          thumb?: string;
          md?: string;
          xl?: string;
        };
      };
    };

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
  const legacy =
    creator.photo?.trim() ||
    creator.avatarUrl?.trim() ||
    null;
  return isLegacyFirebaseStorageUrl(legacy);
}

export function galleryThumbUrl(item: GalleryImageLike | null | undefined): string | null {
  if (!item) return null;
  const flat = typeof item.url === 'string' ? item.url.trim() : '';
  if (flat) return flat;
  const nested = item.image?.galleryUrls;
  return nested?.md ?? nested?.xl ?? nested?.thumb ?? null;
}

export function normalizeGalleryImages(
  items: GalleryImageLike[] | null | undefined,
): GalleryImageDto[] {
  if (!items?.length) return [];
  return items
    .map((item, index) => {
      const url = galleryThumbUrl(item);
      if (!url) return null;
      return {
        id: item.id,
        url,
        position: item.position ?? index,
        createdAt:
          typeof item.createdAt === 'string'
            ? item.createdAt
            : new Date().toISOString(),
        storagePath: 'storagePath' in item && typeof item.storagePath === 'string'
          ? item.storagePath
          : '',
      };
    })
    .filter((x): x is GalleryImageDto => x !== null)
    .sort((a, b) => a.position - b.position);
}
