'use client';

import { useTranslations } from 'next-intl';

interface WindArrowProps {
  direction: number;
  travelBearing: number;
  effect: 'tailwind' | 'headwind' | 'crosswind-left' | 'crosswind-right';
  size?: number;
}

export function WindArrow({ direction, effect, size = 40 }: WindArrowProps) {
  const t = useTranslations('WeatherTimeline');
  const color = effect === 'tailwind' ? '#10b981' : effect === 'headwind' ? '#ef4444' : '#f59e0b';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="shrink-0"
      aria-label={t('windFrom', { direction: Math.round(direction) })}
    >
      <g transform={`rotate(${direction}, 20, 20)`}>
        <path d="M20 6 L26 24 L20 20 L14 24 Z" fill={color} opacity="0.9" />
      </g>
    </svg>
  );
}
