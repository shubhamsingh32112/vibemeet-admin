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

const SLICE_COLORS: Record<string, string> = {
  host: '#34d399',
  bd: '#60a5fa',
  agency: '#a78bfa',
  platform: '#52525b',
};

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

/** Derive gross % slices: staff bps apply to host earnings, not gross. */
export function buildSplitWithAgencyAndBd(
  hostSharePct: number,
  bdBps: number,
  agencyBps: number
): SplitSlice[] {
  const host = hostSharePct;
  const bd = (host * bdBps) / 10000;
  const agency = (host * agencyBps) / 10000;
  const platform = Math.max(0, 100 - host - bd - agency);
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return [
    { key: 'host', label: 'Host', pct: round(host), color: SLICE_COLORS.host },
    { key: 'bd', label: 'BD', pct: round(bd), color: SLICE_COLORS.bd },
    { key: 'agency', label: 'Agency', pct: round(agency), color: SLICE_COLORS.agency },
    { key: 'platform', label: 'Platform', pct: round(platform), color: SLICE_COLORS.platform },
  ];
}

/** Host with no agency / BD — host share + remainder platform. */
export function buildSplitIndependentHost(hostSharePct: number): SplitSlice[] {
  const platform = Math.max(0, 100 - hostSharePct);
  return [
    { key: 'host', label: 'Host', pct: hostSharePct, color: SLICE_COLORS.host },
    { key: 'platform', label: 'Platform', pct: platform, color: SLICE_COLORS.platform },
  ];
}

/** Defaults: 25% host, 500/1500 bps on host earnings → ~1.25% BD, ~3.75% agency, ~70% platform. */
export const SPLIT_WITH_AGENCY_AND_BD = buildSplitWithAgencyAndBd(25, 500, 1500);
export const SPLIT_INDEPENDENT_HOST = buildSplitIndependentHost(25);

export function formatSplitSubtitle(slices: SplitSlice[]): string {
  const parts = slices.map((s) => `${s.pct}% ${s.label.toLowerCase()}`);
  return `${parts.join(' · ')} — coin amounts from total revenue`;
}

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
