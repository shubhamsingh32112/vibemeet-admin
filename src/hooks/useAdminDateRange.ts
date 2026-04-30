import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AdminDateRange, DateRangePreset } from '../utils/dateRange';
import { computePresetRange, toIsoUtc } from '../utils/dateRange';

const QS_PRESET = 'drPreset';
const QS_FROM = 'drFrom';
const QS_TO = 'drTo';

export function useAdminDateRange(defaultPreset: Exclude<DateRangePreset, 'custom'> = 'today') {
  const [params, setParams] = useSearchParams();

  const value: AdminDateRange = useMemo(() => {
    const preset = (params.get(QS_PRESET) as DateRangePreset | null) ?? defaultPreset;
    const from = params.get(QS_FROM) ?? undefined;
    const to = params.get(QS_TO) ?? undefined;

    if (preset === 'custom') {
      return { preset, from, to };
    }

    const computed = computePresetRange(preset as Exclude<DateRangePreset, 'custom'>);
    return { preset, from: toIsoUtc(computed.from), to: toIsoUtc(computed.to) };
  }, [params, defaultPreset]);

  const setPreset = (preset: Exclude<DateRangePreset, 'custom'>) => {
    const computed = computePresetRange(preset);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(QS_PRESET, preset);
      next.set(QS_FROM, toIsoUtc(computed.from));
      next.set(QS_TO, toIsoUtc(computed.to));
      return next;
    }, { replace: true });
  };

  const setCustom = (fromIsoUtc?: string, toIsoUtcStr?: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(QS_PRESET, 'custom');
      if (fromIsoUtc) next.set(QS_FROM, fromIsoUtc);
      else next.delete(QS_FROM);
      if (toIsoUtcStr) next.set(QS_TO, toIsoUtcStr);
      else next.delete(QS_TO);
      return next;
    }, { replace: true });
  };

  const clear = () => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(QS_PRESET);
      next.delete(QS_FROM);
      next.delete(QS_TO);
      return next;
    }, { replace: true });
  };

  return { dateRange: value, setPreset, setCustom, clear };
}

