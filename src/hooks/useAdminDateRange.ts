import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AdminDateRange, DateRangePresetButton } from '../utils/dateRange';
import { computePresetRange, normalizeDateRangePreset, toIsoUtc } from '../utils/dateRange';

const QS_PRESET = 'drPreset';
const QS_FROM = 'drFrom';
const QS_TO = 'drTo';

export function useAdminDateRange(defaultPreset: DateRangePresetButton = 'today') {
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();

  const value: AdminDateRange = useMemo(() => {
    const rawPreset = params.get(QS_PRESET);
    const from = params.get(QS_FROM) ?? undefined;
    const to = params.get(QS_TO) ?? undefined;

    if (rawPreset === 'custom') {
      return { preset: 'custom', from, to };
    }

    const preset = normalizeDateRangePreset(rawPreset, defaultPreset);

    if (preset === 'all') {
      return { preset: 'all', from: undefined, to: undefined };
    }

    const computed = computePresetRange(preset);
    return { preset, from: toIsoUtc(computed.from), to: toIsoUtc(computed.to) };
  }, [paramsKey, defaultPreset]);

  const setPreset = useCallback(
    (preset: DateRangePresetButton) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(QS_PRESET, preset);
          if (preset === 'all') {
            next.delete(QS_FROM);
            next.delete(QS_TO);
            return next;
          }
          const computed = computePresetRange(preset);
          next.set(QS_FROM, toIsoUtc(computed.from));
          next.set(QS_TO, toIsoUtc(computed.to));
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const setCustom = useCallback(
    (fromIsoUtc?: string, toIsoUtcStr?: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(QS_PRESET, 'custom');
          if (fromIsoUtc) next.set(QS_FROM, fromIsoUtc);
          else next.delete(QS_FROM);
          if (toIsoUtcStr) next.set(QS_TO, toIsoUtcStr);
          else next.delete(QS_TO);
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const clear = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(QS_PRESET);
        next.delete(QS_FROM);
        next.delete(QS_TO);
        return next;
      },
      { replace: true }
    );
  }, [setParams]);

  return { dateRange: value, setPreset, setCustom, clear };
}
