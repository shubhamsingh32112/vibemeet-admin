const PLAY_STORE_BASE =
  'https://play.google.com/store/apps/details?id=com.matchvibe.app&pcampaignid=web_share';

/** Google Play install-referrer payload (`ref=CODE`) read by the Android app on first launch. */
export function buildReferralJoinUrl(referralCode: string): string {
  const code = referralCode.trim().toUpperCase();
  const referrer = encodeURIComponent(`ref=${code}`);
  return `${PLAY_STORE_BASE}&referrer=${referrer}`;
}

/** @deprecated Use {@link buildReferralJoinUrl} — agency links now point to the Play Store. */
export function buildPlayStoreReferralUrl(referralCode: string): string {
  return buildReferralJoinUrl(referralCode);
}

export function buildReferralShareMessage(referralCode: string): string {
  const downloadUrl = buildReferralJoinUrl(referralCode);
  return `Download MatchVibe and join as a host using my referral link:\n${downloadUrl}`;
}

export function buildWhatsAppShareUrl(referralCode: string): string {
  const text = buildReferralShareMessage(referralCode);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildTelegramShareUrl(referralCode: string): string {
  const downloadUrl = buildReferralJoinUrl(referralCode);
  const text = 'Download MatchVibe and join as a host using my referral link';
  return `https://t.me/share/url?url=${encodeURIComponent(downloadUrl)}&text=${encodeURIComponent(text)}`;
}
