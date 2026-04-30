import { useMemo, useState } from 'react';
import type { AdminDateRange, DateRangePreset } from '../../utils/dateRange';
import { fromDatetimeLocal, toDatetimeLocalInputValue, toIsoUtc } from '../../utils/dateRange';
import { formatDateTime } from '../../utils/dateTime';

type Props = {
  value: AdminDateRange;
  onPresetChange: (preset: Exclude<DateRangePreset, 'custom'>) => void;
  onCustomChange: (fromIsoUtc?: string, toIsoUtc?: string) => void;
  className?: string;
};

const PRESETS: Array<{ id: Exclude<DateRangePreset, 'custom'>; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'today_yesterday', label: 'Today + Yesterday' },
  { id: 'last7d', label: 'Last 7d' },
  { id: 'last30d', label: 'Last 30d' },
];

export default function DateRangeFilter({ value, onPresetChange, onCustomChange, className }: Props) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  const summary = useMemo(() => {
    const from = value.from ? new Date(value.from) : null;
    const to = value.to ? new Date(value.to) : null;
    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '—';
    return `${formatDateTime(from)} → ${formatDateTime(to)}`;
  }, [value.from, value.to]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400">Date:</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setShowCustom(false);
              onPresetChange(p.id);
            }}
            className={`px-3 py-1.5 text-xs rounded border transition ${
              value.preset === p.id
                ? 'bg-blue-900/40 border-blue-700 text-blue-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {p.label}
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
            <label className="text-xs text-gray-400">From</label>
            <input
              type="datetime-local"
              value={toDatetimeLocalInputValue(value.from)}
              onChange={(e) => {
                const d = fromDatetimeLocal(e.target.value);
                onCustomChange(d ? toIsoUtc(d) : undefined, value.to);
              }}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">To</label>
            <input
              type="datetime-local"
              value={toDatetimeLocalInputValue(value.to)}
              onChange={(e) => {
                const d = fromDatetimeLocal(e.target.value);
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

