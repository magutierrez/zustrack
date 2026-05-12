import { useState, useEffect, RefObject } from 'react';
import { Margin } from './types';

export const MARGIN_DESKTOP: Margin = { top: 8, right: 16, bottom: 28, left: 50 };
export const MARGIN_MOBILE: Margin = { top: 8, right: 8, bottom: 24, left: 6 };
export const MARGIN_COMPACT: Margin = { top: 0, right: 0, bottom: 0, left: 0 };

export function useChartDimensions(
  outerRef: RefObject<HTMLDivElement | null>,
  compact: boolean
) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [outerRef]);

  const isMobile = compact || (size.w > 0 && size.w < 520);
  const margin = compact ? MARGIN_COMPACT : isMobile ? MARGIN_MOBILE : MARGIN_DESKTOP;

  const innerW = Math.max(0, size.w - margin.left - margin.right);
  const innerH = Math.max(0, size.h - margin.top - margin.bottom);

  return {
    size,
    margin,
    innerW,
    innerH,
    isMobile,
  };
}
