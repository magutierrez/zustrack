import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';
import { TooltipState, Labels } from './types';

interface CompactInfoBarProps {
  labels: Labels;
  zoomRange: { start: number; end: number } | null;
  onResetZoom: () => void;
}

export interface CompactInfoBarHandle {
  update(t: TooltipState | null): void;
}

export const CompactInfoBar = forwardRef<CompactInfoBarHandle, CompactInfoBarProps>(
  function CompactInfoBar({ labels, zoomRange, onResetZoom }, ref) {
    const contentRef = useRef<HTMLDivElement>(null);
    const eleRef = useRef<HTMLSpanElement>(null);
    const distRef = useRef<HTMLSpanElement>(null);
    const dotColorRef = useRef<HTMLDivElement>(null);
    const slopeRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      update(t: TooltipState | null) {
        if (!contentRef.current) return;
        if (!t) {
          contentRef.current.style.visibility = 'hidden';
          return;
        }
        contentRef.current.style.visibility = '';
        if (eleRef.current) eleRef.current.textContent = `${Math.round(t.ele)} ${labels.meters}`;
        if (distRef.current) distRef.current.textContent = `${t.dist.toFixed(1)} ${labels.km}`;
        if (dotColorRef.current) dotColorRef.current.style.backgroundColor = t.color;
        if (slopeRef.current)
          slopeRef.current.textContent = `${t.slope > 0 ? '+' : ''}${t.slope}%`;
      },
    }));

    return (
      <div className="flex min-h-5 items-center justify-between px-3 pb-1">
        <div ref={contentRef} className="flex items-center gap-2" style={{ visibility: 'hidden' }}>
          <span
            ref={eleRef}
            className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-100"
          />
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span ref={distRef} className="text-[11px] text-zinc-500 dark:text-zinc-400" />
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <div className="flex items-center gap-1">
            <div ref={dotColorRef} className="size-2 rounded-full" />
            <span
              ref={slopeRef}
              className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-100"
            />
          </div>
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
  },
);
