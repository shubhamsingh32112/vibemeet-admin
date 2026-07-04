export const IST_TIMEZONE = 'Asia/Kolkata';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const istDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Format instant as IST wall-clock for display. */
export function formatIstDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/** Parse datetime-local input value as IST wall-clock → UTC instant. */
export function fromDatetimeLocalAsIst(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return null;
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  const utcMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0) - IST_OFFSET_MS;
  const parsed = new Date(utcMs);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Format UTC instant as datetime-local input value in IST wall-clock. */
export function toDatetimeLocalInputValueFromIst(isoUtc?: string): string {
  if (!isoUtc) return '';
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const y = get('year');
  const mo = get('month');
  const da = get('day');
  const hh = get('hour');
  const mi = get('minute');
  return `${y}-${mo}-${da}T${hh}:${mi}`;
}

/** Calendar date `YYYY-MM-DD` in IST for the given instant. */
export function istDateKey(date = new Date()): string {
  return istDateKeyFormatter.format(date);
}

/** Half-open `[start, end)` bounds for one IST calendar day. */
export function istDayBounds(dateKey: string): { start: Date; end: Date } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Add calendar days to an IST date key. */
export function addIstDays(dateKey: string, days: number): string {
  const { start } = istDayBounds(dateKey);
  return istDateKey(new Date(start.getTime() + days * 24 * 60 * 60 * 1000));
}

/** IST calendar date key for yesterday relative to `now`. */
export function istYesterdayKey(now = new Date()): string {
  return addIstDays(istDateKey(now), -1);
}

/** IST calendar date key for today. */
export function istTodayKey(now = new Date()): string {
  return istDateKey(now);
}

export type IstDateRangePreset =
  | 'today'
  | 'yesterday'
  | 'today_yesterday'
  | 'last7d'
  | 'last30d';

/** Admin header presets using IST midnight boundaries (half-open `[from, to)`). */
export function computeIstPresetRange(
  preset: IstDateRangePreset,
  now = new Date()
): { from: Date; to: Date } {
  const todayKey = istDateKey(now);
  const { start: todayStart, end: todayEnd } = istDayBounds(todayKey);

  switch (preset) {
    case 'today':
      return { from: todayStart, to: todayEnd };
    case 'yesterday': {
      const yKey = addIstDays(todayKey, -1);
      const { start, end } = istDayBounds(yKey);
      return { from: start, to: end };
    }
    case 'today_yesterday': {
      const yStart = istDayBounds(addIstDays(todayKey, -1)).start;
      return { from: yStart, to: todayEnd };
    }
    case 'last7d': {
      const from = istDayBounds(addIstDays(todayKey, -6)).start;
      return { from, to: todayEnd };
    }
    case 'last30d': {
      const from = istDayBounds(addIstDays(todayKey, -29)).start;
      return { from, to: todayEnd };
    }
    default:
      return { from: todayStart, to: todayEnd };
  }
}
