/** Must match backend `ALLOWED_CREATOR_PRICES` */
export const CREATOR_PRICE_TIERS = [60, 90, 120] as const;

export type CreatorPriceTier = (typeof CREATOR_PRICE_TIERS)[number];

export function normalizeCreatorPriceTier(p: number): CreatorPriceTier {
  return CREATOR_PRICE_TIERS.includes(p as CreatorPriceTier)
    ? (p as CreatorPriceTier)
    : 60;
}
