import { computeIstPresetRange, type IstDateRangePreset } from './istTime';

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
  /** ISO string in UTC; inclusive lower bound (IST preset midnight) */
  from?: string;
  /** ISO string in UTC; exclusive upper bound (IST preset midnight) */
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
  today: 'Today (IST)',
  yesterday: 'Yesterday (IST)',
  today_yesterday: 'Today + Yesterday (IST)',
  last7d: 'Last 7d (IST)',
  last30d: 'Last 30d (IST)',
};

export function dateRangePresetLabel(preset: DateRangePreset): string {
  if (preset === 'custom') return 'Custom range';
  return DATE_RANGE_PRESET_LABELS[preset];
}

/** Preset ranges use Asia/Kolkata calendar days (00:00–23:59 IST). */
export function computePresetRange(preset: Exclude<DateRangePreset, 'custom' | 'all'>, now = new Date()): {
  from: Date;
  to: Date;
} {
  return computeIstPresetRange(preset as IstDateRangePreset, now);
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
