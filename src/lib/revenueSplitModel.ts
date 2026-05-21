/** Display policy for revenue split charts (% of each call's coin spend). */

export type SplitSlice = {
  key: string;
  label: string;
  pct: number;
  color: string;
  coins?: number;
};

/** ₹0.80 per coin (80 paise) — display only. */
export const REVENUE_SPLIT_INR_PER_COIN = 0.8;

const coinsFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function coinsToInr(coins: number): number {
  return coins * REVENUE_SPLIT_INR_PER_COIN;
}

export function formatCoinsAndInr(coins: number): { coins: string; inr: string } {
  return {
    coins: `${coinsFmt.format(coins)} coins`,
    inr: inrFmt.format(coinsToInr(coins)),
  };
}

/** Host under agency + BD — 25 + 5 + 15 = 45%, platform 55%. */
export const SPLIT_WITH_AGENCY_AND_BD: SplitSlice[] = [
  { key: 'host', label: 'Host', pct: 25, color: '#34d399' },
  { key: 'bd', label: 'BD', pct: 5, color: '#60a5fa' },
  { key: 'agency', label: 'Agency', pct: 15, color: '#a78bfa' },
  { key: 'platform', label: 'Platform', pct: 55, color: '#52525b' },
];

/** Host with no agency / BD assignment — 25% host, remainder platform. */
export const SPLIT_INDEPENDENT_HOST: SplitSlice[] = [
  { key: 'host', label: 'Host', pct: 25, color: '#34d399' },
  { key: 'platform', label: 'Platform', pct: 75, color: '#52525b' },
];

export function applyCoinsToSlices(
  baseSlices: SplitSlice[],
  totalCoins: number
): SplitSlice[] {
  return baseSlices.map((s) => ({
    ...s,
    coins: Math.floor((totalCoins * s.pct) / 100),
  }));
}

export function slicesForChart(slices: SplitSlice[]): Array<{
  name: string;
  value: number;
  fill: string;
  coins: number;
}> {
  return slices.map((s) => ({
    name: s.coins != null ? `${s.label} (${s.pct}%)` : `${s.label} (${s.pct}%)`,
    value: s.pct,
    fill: s.color,
    coins: s.coins ?? 0,
  }));
}
