import * as React from 'react';
import { cn } from '../../../lib/utils';

type HeatmapChartProps = {
  cells: Array<{ day: number; hour: number; intensity: number }>;
  isDemo?: boolean;
  className?: string;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ cells, isDemo, className }) => {
  const grid = React.useMemo(() => {
    const m: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const c of cells) {
      if (c.day >= 0 && c.day < 7 && c.hour >= 0 && c.hour < 24) m[c.day][c.hour] = c.intensity;
    }
    return m;
  }, [cells]);

  const intColor = (i: number) => {
    const v = Math.min(4, Math.max(0, i));
    const op = [0.08, 0.15, 0.28, 0.42, 0.6][v];
    return `rgba(139, 92, 246, ${op})`;
  };

  return (
    <div className={cn('glass-panel rounded-2xl p-4', className)}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Platform activity</h3>
        {isDemo ? <span className="text-[10px] text-amber-400/90 uppercase tracking-wider">Demo</span> : null}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[48px_repeat(24,minmax(0,1fr))] gap-px text-[9px] text-zinc-500 mb-1">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center">
                {h % 4 === 0 ? h : ''}
              </div>
            ))}
          </div>
          {grid.map((row, di) => (
            <div key={di} className="grid grid-cols-[48px_repeat(24,minmax(0,1fr))] gap-px mb-px">
              <div className="text-[10px] text-zinc-500 pr-1 flex items-center">{DAYS[di]}</div>
              {row.map((v, hi) => (
                <div
                  key={hi}
                  title={`${DAYS[di]} ${hi}:00 · intensity ${v}`}
                  className="h-4 rounded-sm border border-white/5"
                  style={{ backgroundColor: intColor(v) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
