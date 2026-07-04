import { useEffect, useMemo, useState } from 'react';
import type { AdminDateRange, DateRangePresetButton } from '../../utils/dateRange';
import { DATE_RANGE_PRESET_LABELS, toIsoUtc } from '../../utils/dateRange';
import {
  formatIstDateTime,
  fromDatetimeLocalAsIst,
  toDatetimeLocalInputValueFromIst,
} from '../../utils/istTime';

type Props = {
  value: AdminDateRange;
  onPresetChange: (preset: DateRangePresetButton) => void;
  onCustomChange: (fromIsoUtc?: string, toIsoUtc?: string) => void;
  className?: string;
};

const PRESET_IDS: DateRangePresetButton[] = [
  'all',
  'today',
  'yesterday',
  'today_yesterday',
  'last7d',
  'last30d',
];

export default function DateRangeFilter({ value, onPresetChange, onCustomChange, className }: Props) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  useEffect(() => {
    if (value.preset === 'custom') setShowCustom(true);
    if (value.preset !== 'custom' && value.preset !== 'all') setShowCustom(false);
  }, [value.preset]);

  const summary = useMemo(() => {
    if (value.preset === 'all') return 'All time (no date filter)';
    const from = value.from ? new Date(value.from) : null;
    const to = value.to ? new Date(value.to) : null;
    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '—';
    return `${formatIstDateTime(from)} → ${formatIstDateTime(to)} IST`;
  }, [value.preset, value.from, value.to]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 inline-flex items-center gap-1">
          Date:
          <span className="rounded bg-violet-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
            IST
          </span>
        </span>
        {PRESET_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setShowCustom(false);
              onPresetChange(id);
            }}
            className={`px-3 py-1.5 text-xs rounded border transition ${
              value.preset === id
                ? 'bg-blue-900/40 border-blue-700 text-blue-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {DATE_RANGE_PRESET_LABELS[id]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setShowCustom((v) => !v);
            if (value.preset !== 'custom') {
              onCustomChange(value.from, value.to);
            }
          }}
          className={`px-3 py-1.5 text-xs rounded border transition ${
            value.preset === 'custom' || showCustom
              ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          Custom
        </button>
        <span className="text-[11px] text-gray-500">{summary}</span>
      </div>

      {showCustom && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">From (IST)</label>
            <input
              type="datetime-local"
              value={toDatetimeLocalInputValueFromIst(value.from)}
              onChange={(e) => {
                const d = fromDatetimeLocalAsIst(e.target.value);
                onCustomChange(d ? toIsoUtc(d) : undefined, value.to);
              }}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">To (IST)</label>
            <input
              type="datetime-local"
              value={toDatetimeLocalInputValueFromIst(value.to)}
              onChange={(e) => {
                const d = fromDatetimeLocalAsIst(e.target.value);
                onCustomChange(value.from, d ? toIsoUtc(d) : undefined);
              }}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => onCustomChange(value.from, value.to)}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
