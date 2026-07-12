import { TrendingUp, RefreshCcw } from 'lucide-react';
import { Labels } from './types';

interface ChartHeaderProps {
  labels: Labels;
  zoomRange: { start: number; end: number } | null;
  onResetZoom: () => void;
}

export function ChartHeader({ labels, zoomRange, onResetZoom }: ChartHeaderProps) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="rounded-lg bg-zinc-100 p-1.5 dark:bg-zinc-800">
        <TrendingUp className="size-4 text-zinc-600 dark:text-zinc-300" />
      </div>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
        {labels.elevationProfile}
      </h2>
      {zoomRange && (
        <button
          onClick={onResetZoom}
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold tracking-tight text-zinc-500 uppercase hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <RefreshCcw className="size-3" />
          {labels.resetZoom}
        </button>
      )}
    </div>
  );
}
