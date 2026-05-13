/**
 * Dashboard-only display: convert wallet/creator coins to INR preview when
 * `VITE_DASHBOARD_INR_PER_COIN` is set (INR per one coin). Not used for billing.
 */
const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const coinsFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function parseInrPerCoinFromEnv(): number | null {
  const raw = import.meta.env.VITE_DASHBOARD_INR_PER_COIN;
  if (raw === undefined || raw === '') return null;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export type DashboardMoneyFormat = 'inr' | 'coins';

/** Human-readable amount for leaderboard cells. */
export function formatDashboardMoneyFromCoins(coins: number): { text: string; format: DashboardMoneyFormat } {
  const rate = parseInrPerCoinFromEnv();
  if (rate != null) {
    return { text: inrFmt.format(coins * rate), format: 'inr' };
  }
  return { text: `${coinsFmt.format(coins)} coins`, format: 'coins' };
}
