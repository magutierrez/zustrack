'use client';

import { Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouteSegments } from '@/hooks/use-route-segments';

export function RouteSegments() {
  const t = useTranslations('WeatherTimeline');
  const { pathBreakdown, surfaceBreakdown, handleSegmentClick, activeFilter } = useRouteSegments();

  const hasMeaningfulData = (data: { name: string; percent: number; color: string }[]) => {
    return data.length > 0 && !(data.length === 1 && data[0].name === 'unknown');
  };

  const SegmentBar = ({
    title,
    data,
    translationNamespace,
    typeKey,
  }: {
    title: string;
    data: { name: string; percent: number; color: string }[];
    translationNamespace: string;
    typeKey: 'pathType' | 'surface';
  }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{title}</span>
      </div>

      {!hasMeaningfulData(data) ? (
        <div className="bg-secondary/30 flex h-20 items-center justify-center rounded-lg border border-dashed p-2">
          <span className="text-muted-foreground text-xs">{t('noData')}</span>
        </div>
      ) : (
        <>
          <div className="bg-secondary ring-border flex h-3 w-full overflow-hidden rounded-full ring-1">
            {data.map((item, idx) => {
              const isActive = activeFilter?.key === typeKey && activeFilter.value === item.name;
              const isFilteringOther =
                activeFilter && (activeFilter.key !== typeKey || activeFilter.value !== item.name);

              return (
                <button
                  key={idx}
                  onClick={() => handleSegmentClick(typeKey, item.name)}
                  style={{
                    width: `${item.percent}%`,
                    backgroundColor: item.color,
                    opacity: isFilteringOther ? 0.3 : 1,
                  }}
                  className={`h-full transition-all hover:brightness-110 ${isActive ? 'ring-2 ring-white ring-inset' : ''}`}
                  title={`${item.name}: ${item.percent.toFixed(0)}%`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {data.map((item, idx) => {
              const isActive = activeFilter?.key === typeKey && activeFilter.value === item.name;
              return (
                <button
                  key={idx}
                  onClick={() => handleSegmentClick(typeKey, item.name)}
                  className={`flex items-center gap-1.5 rounded border px-1.5 py-0.5 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'bg-secondary/50 text-foreground hover:border-border border-transparent'
                  }`}
                >
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-medium">
                    {t(`${translationNamespace}.${item.name}` as any)}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {item.percent.toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="mb-4 flex items-center gap-2">
        <MapIcon className="text-primary h-4 w-4" />
        <h3 className="text-foreground text-sm font-semibold">{t('segmentsTitle')}</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SegmentBar
          title={t('pathTypes.title')}
          data={pathBreakdown}
          translationNamespace="pathTypes"
          typeKey="pathType"
        />
        <SegmentBar
          title={t('surfaces.title')}
          data={surfaceBreakdown}
          translationNamespace="surfaces"
          typeKey="surface"
        />
      </div>
    </div>
  );
}
