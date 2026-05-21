/** Cloudflare avatar payload from staff portal APIs. */
export type HostAvatarDto = {
  imageId: string;
  blurhash: string | null;
  width: number | null;
  height: number | null;
  avatarUrls: { sm: string; md: string; lg: string };
};

export type HostGalleryImageDto = {
  id: string;
  url: string;
  position: number;
  createdAt: string;
};

export type HostProfileCreator = {
  id: string;
  userId: string;
  name: string;
  about: string;
  photo: string | null;
  avatarUrl: string | null;
  avatar: HostAvatarDto | null;
  galleryImages: HostGalleryImageDto[];
  galleryCount: number;
  categories: string[];
  price: number;
  age?: number;
  location?: string;
  earningsCoins: number;
  isOnline?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type HostProfileUser = {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  coins?: number;
  avatarUrl: string | null;
  avatar?: HostAvatarDto | null;
  profileRevision?: number;
};

export type HostProfileMediaProps = {
  creator: Pick<
    HostProfileCreator,
    'name' | 'photo' | 'avatarUrl' | 'avatar' | 'galleryImages' | 'galleryCount'
  >;
  user?: Pick<HostProfileUser, 'avatarUrl' | 'avatar'> | null;
};

/** URL string for edit forms (legacy photo field or resolved avatar URL). */
export function hostPhotoEditUrl(
  photo: string | null | undefined,
  avatarUrl?: string | null
): string {
  const p = photo?.trim();
  return p || avatarUrl || '';
}

export function hostAvatarEditUrl(
  avatar: HostAvatarDto | string | null | undefined,
  avatarUrl?: string | null
): string {
  if (typeof avatar === 'string') return avatar.trim();
  return avatarUrl || avatar?.avatarUrls?.md || '';
}
