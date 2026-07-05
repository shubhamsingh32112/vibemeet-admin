import type { QueryClient } from '@tanstack/react-query';
import type { DashboardSection, StaleMap } from '../types/dashboardStale';

const DASH = 'dashboard' as const;

/** Maps stale dashboard sections to React Query key suffixes under [DASH, …]. */
const SECTION_QUERY_SUFFIXES: Partial<Record<DashboardSection, string[]>> = {
  overview: ['overview', 'call-analytics'],
  revenue: ['revenue', 'razorpay-balance'],
  realtime: ['live-calls'],
  calls: ['live-calls', 'call-analytics'],
  creators: ['top-hosts'],
  bds: ['top-bds', 'top-agencies'],
  withdrawals: ['payouts'],
  support: ['alerts'],
  fraud: ['alerts'],
};

export function sectionsNewlyStale(prev: StaleMap, next: StaleMap): DashboardSection[] {
  return (Object.keys(next) as DashboardSection[]).filter((s) => next[s] && !prev[s]);
}

export function invalidateDashboardSections(
  queryClient: QueryClient,
  sections: DashboardSection[],
): void {
  const suffixes = new Set<string>();
  for (const section of sections) {
    for (const suffix of SECTION_QUERY_SUFFIXES[section] ?? []) {
      suffixes.add(suffix);
    }
  }
  for (const suffix of suffixes) {
    void queryClient.invalidateQueries({ queryKey: [DASH, suffix] });
  }
}
