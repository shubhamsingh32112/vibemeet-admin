/** Must match backend `ALLOWED_CREATOR_PRICES` */
export const CREATOR_PRICE_TIERS = [1800, 2700, 3600] as const;

export type CreatorPriceTier = (typeof CREATOR_PRICE_TIERS)[number];

export function normalizeCreatorPriceTier(p: number): CreatorPriceTier {
  return CREATOR_PRICE_TIERS.includes(p as CreatorPriceTier)
    ? (p as CreatorPriceTier)
    : 1800;
}
