/**
 * @deprecated Profile and avatar uploads use Cloudflare Images via
 * `uploadImageViaDirectSession` in `cloudflareImageUpload.ts`.
 * Firebase Storage is no longer used for creator media in admin/agency portals.
 */

export function uploadCreatorProfileImage(): never {
  throw new Error(
    'Firebase Storage uploads are disabled. Use Cloudflare direct-upload + avatar commit instead.'
  );
}

export function deleteCreatorProfileImage(): never {
  throw new Error('Firebase Storage uploads are disabled.');
}

export function generateTempCreatorId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
