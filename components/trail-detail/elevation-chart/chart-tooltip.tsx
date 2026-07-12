import { TooltipState, Labels, Margin } from './types';

interface ChartTooltipProps {
  activeTooltip: TooltipState;
  labels: Labels;
  margin: Margin;
  size: { w: number; h: number };
}

export function ChartTooltip({ activeTooltip, labels, margin, size }: ChartTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute top-1 z-10"
      style={
        activeTooltip.x + margin.left < size.w / 2
          ? { left: activeTooltip.x + margin.left + 10 }
          : { right: size.w - activeTooltip.x - margin.left + 10 }
      }
    >
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95">
        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
          {Math.round(activeTooltip.ele)} {labels.meters}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <span className="text-xs text-zinc-500">
          {activeTooltip.dist.toFixed(1)} {labels.km}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <div className="flex items-center gap-1">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: activeTooltip.color }}
          />
          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
            {activeTooltip.slope}%
          </span>
        </div>
      </div>
    </div>
  );
}
