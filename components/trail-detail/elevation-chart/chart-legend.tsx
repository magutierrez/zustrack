import { Labels } from './types';
import {
  SLOPE_COLOR_FLAT,
  SLOPE_COLOR_GENTLE,
  SLOPE_COLOR_STEEP,
  SLOPE_COLOR_EXTREME,
} from '@/lib/slope-colors';

interface ChartLegendProps {
  labels: Labels;
}

export function ChartLegend({ labels }: ChartLegendProps) {
  const legendItems = [
    { color: SLOPE_COLOR_FLAT, label: labels.flat },
    { color: SLOPE_COLOR_GENTLE, label: labels.gentle },
    { color: SLOPE_COLOR_STEEP, label: labels.steep },
    { color: SLOPE_COLOR_EXTREME, label: labels.extreme },
  ];

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      {/* Mobile: gradient bar with labels */}
      <div className="lg:hidden">
        <div className="flex h-3 overflow-hidden rounded-full">
          {legendItems.map((item) => (
            <div key={item.color} className="flex-1" style={{ backgroundColor: item.color }} />
          ))}
        </div>
        <div className="mt-1.5 flex text-[11px] font-medium">
          {legendItems.map((item, i) => (
            <span
              key={item.color}
              className={
                i === 0 ? 'flex-1' : i === 3 ? 'flex-1 text-right' : 'flex-1 text-center'
              }
              style={{ color: item.color }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Desktop: dots */}
      <div className="hidden flex-wrap gap-3 lg:flex">
        {legendItems.map((item) => (
          <div key={item.color} className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
