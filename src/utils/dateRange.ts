export type DateRangePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'today_yesterday'
  | 'last7d'
  | 'last30d'
  | 'custom';

export type DateRangePresetButton = Exclude<DateRangePreset, 'custom'>;

export type AdminDateRange = {
  preset: DateRangePreset;
  /** ISO string in UTC; inclusive lower bound */
  from?: string;
  /** ISO string in UTC; exclusive upper bound */
  to?: string;
};

const PRESET_BUTTON_IDS: DateRangePresetButton[] = [
  'all',
  'today',
  'yesterday',
  'today_yesterday',
  'last7d',
  'last30d',
];

export function isDateRangePresetButton(value: string | null | undefined): value is DateRangePresetButton {
  return typeof value === 'string' && PRESET_BUTTON_IDS.includes(value as DateRangePresetButton);
}

export function normalizeDateRangePreset(
  raw: string | null | undefined,
  fallback: DateRangePresetButton
): DateRangePresetButton {
  return isDateRangePresetButton(raw) ? raw : fallback;
}

/** Query params for admin APIs — omit bounds when "All time" is selected. */
export function adminDateRangeQueryParams(range: AdminDateRange): { from?: string; to?: string } {
  if (range.preset === 'all') return {};
  if (range.from && range.to) return { from: range.from, to: range.to };
  return {};
}

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePresetButton, string> = {
  all: 'All time',
  today: 'Today',
  yesterday: 'Yesterday',
  today_yesterday: 'Today + Yesterday',
  last7d: 'Last 7d',
  last30d: 'Last 30d',
};

export function dateRangePresetLabel(preset: DateRangePreset): string {
  if (preset === 'custom') return 'Custom range';
  return DATE_RANGE_PRESET_LABELS[preset];
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addLocalDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function computePresetRange(preset: Exclude<DateRangePreset, 'custom' | 'all'>, now = new Date()): {
  from: Date;
  to: Date;
} {
  const todayStart = startOfLocalDay(now);
  switch (preset) {
    case 'today': {
      return { from: todayStart, to: addLocalDays(todayStart, 1) };
    }
    case 'yesterday': {
      const y = addLocalDays(todayStart, -1);
      return { from: y, to: todayStart };
    }
    case 'today_yesterday': {
      const y = addLocalDays(todayStart, -1);
      return { from: y, to: addLocalDays(todayStart, 1) };
    }
    case 'last7d': {
      const from = addLocalDays(todayStart, -6);
      return { from, to: addLocalDays(todayStart, 1) };
    }
    case 'last30d': {
      const from = addLocalDays(todayStart, -29);
      return { from, to: addLocalDays(todayStart, 1) };
    }
    default: {
      return { from: todayStart, to: addLocalDays(todayStart, 1) };
    }
  }
}

export function toIsoUtc(d: Date): string {
  return d.toISOString();
}

export function fromDatetimeLocal(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDatetimeLocalInputValue(isoUtc?: string): string {
  if (!isoUtc) return '';
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

