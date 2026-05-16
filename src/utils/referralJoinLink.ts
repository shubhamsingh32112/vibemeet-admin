const JOIN_BASE =
  import.meta.env.VITE_REFERRAL_JOIN_BASE ?? 'https://matchvibe.co.in/join';
const PLAY_STORE_BASE =
  'https://play.google.com/store/apps/details?id=com.matchvibe.app';

export function buildReferralJoinUrl(referralCode: string): string {
  const code = referralCode.trim().toUpperCase();
  return `${JOIN_BASE}?ref=${encodeURIComponent(code)}`;
}

export function buildPlayStoreReferralUrl(referralCode: string): string {
  const code = referralCode.trim().toUpperCase();
  const referrer = encodeURIComponent(`ref=${code}`);
  return `${PLAY_STORE_BASE}&referrer=${referrer}`;
}

export function buildReferralShareMessage(referralCode: string): string {
  const joinUrl = buildReferralJoinUrl(referralCode);
  return `Join MatchVibe as a host using my referral link:\n${joinUrl}`;
}

export function buildWhatsAppShareUrl(referralCode: string): string {
  const text = buildReferralShareMessage(referralCode);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildTelegramShareUrl(referralCode: string): string {
  const joinUrl = buildReferralJoinUrl(referralCode);
  const text = 'Join MatchVibe as a host using my referral link';
  return `https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${encodeURIComponent(text)}`;
}
