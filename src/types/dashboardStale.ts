export type DashboardSection =
  | 'revenue'
  | 'calls'
  | 'creators'
  | 'withdrawals'
  | 'support'
  | 'bds'
  | 'overview'
  | 'realtime'
  | 'fraud'
  | 'moderation';

export type StaleMap = Record<DashboardSection, boolean>;

export type RefreshMode = 'manual' | 'live';

export const ALL_DASHBOARD_SECTIONS: DashboardSection[] = [
  'revenue',
  'calls',
  'creators',
  'withdrawals',
  'support',
  'bds',
  'overview',
  'realtime',
  'fraud',
  'moderation',
];

export const FRESH_STALE_MAP: StaleMap = {
  revenue: false,
  calls: false,
  creators: false,
  withdrawals: false,
  support: false,
  bds: false,
  overview: false,
  realtime: false,
  fraud: false,
  moderation: false,
};

export const ADMIN_VISIBLE_SECTIONS: DashboardSection[] = [
  'overview',
  'realtime',
  'revenue',
  'calls',
  'creators',
  'withdrawals',
  'support',
  'bds',
];

export const AGENCY_VISIBLE_SECTIONS: DashboardSection[] = [
  'revenue',
  'creators',
  'bds',
  'withdrawals',
  'overview',
];

export const BD_VISIBLE_SECTIONS: DashboardSection[] = [
  'creators',
  'revenue',
  'withdrawals',
  'overview',
];

export function anySectionStale(stale: StaleMap, sections: DashboardSection[]): boolean {
  return sections.some((s) => stale[s]);
}
