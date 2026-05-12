import { RefreshCcw } from 'lucide-react';
import { TooltipState, Labels } from './types';

interface CompactInfoBarProps {
  activeTooltip: TooltipState | null;
  dragPreview: any;
  labels: Labels;
  zoomRange: { start: number; end: number } | null;
  onResetZoom: () => void;
}

export function CompactInfoBar({
  activeTooltip,
  dragPreview,
  labels,
  zoomRange,
  onResetZoom,
}: CompactInfoBarProps) {
  return (
    <div className="flex min-h-5 items-center justify-between px-3 pb-1">
      <div className="flex items-center gap-2">
        {activeTooltip && !dragPreview ? (
          <>
            <span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-100">
              {Math.round(activeTooltip.ele)} {labels.meters}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {activeTooltip.dist.toFixed(1)} {labels.km}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <div className="flex items-center gap-1">
              <div
                className="size-2 rounded-full"
                style={{ backgroundColor: activeTooltip.color }}
              />
              <span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-100">
                {activeTooltip.slope > 0 ? '+' : ''}
                {activeTooltip.slope}%
              </span>
            </div>
          </>
        ) : null}
      </div>
      {zoomRange && (
        <button
          onClick={onResetZoom}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-tight text-zinc-400 uppercase hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
        >
          <RefreshCcw className="size-2.5" />
          {labels.resetZoom}
        </button>
      )}
    </div>
  );
}
