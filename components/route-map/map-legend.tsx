'use client';

import { useTranslations } from 'next-intl';

export function MapLegend() {
  const t = useTranslations('RouteMap');

  return (
    <div className="border-border bg-card/95 absolute top-6 left-3 z-10 rounded-lg border p-3 shadow-xl backdrop-blur-sm">
      <p className="text-foreground mb-2 text-xs font-semibold">{t('legend.title')}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
          <span className="text-muted-foreground text-xs">{t('legend.tailwind')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-muted-foreground text-xs">{t('legend.headwind')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
          <span className="text-muted-foreground text-xs">{t('legend.crosswind')}</span>
        </div>
      </div>
    </div>
  );
}
