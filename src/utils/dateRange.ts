export type DateRangePreset = 'today' | 'yesterday' | 'today_yesterday' | 'last7d' | 'last30d' | 'custom';

export type AdminDateRange = {
  preset: DateRangePreset;
  /** ISO string in UTC; inclusive lower bound */
  from?: string;
  /** ISO string in UTC; exclusive upper bound */
  to?: string;
};

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

export function computePresetRange(preset: Exclude<DateRangePreset, 'custom'>, now = new Date()): {
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

