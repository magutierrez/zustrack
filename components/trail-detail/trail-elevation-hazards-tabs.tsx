'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrailElevationChart } from './trail-elevation-chart';
import { TrailHazards } from './trail-hazards';

type Range = { start: number; end: number; color?: string };

interface TrailElevationHazardsTabsProps {
  trackProfile: any[];
  hasHazards: boolean;
  hoverDist: number | null;
  setHoverDist: (d: number | null) => void;
  selectedRange: Range | null;
  setSelectedRange: (r: Range | null) => void;
}

export function TrailElevationHazardsTabs({
  trackProfile,
  hasHazards,
  hoverDist,
  setHoverDist,
  selectedRange,
  setSelectedRange,
}: TrailElevationHazardsTabsProps) {
  const t = useTranslations('TrailPage');

  if (trackProfile.length <= 1) return null;

  const chartLabels = {
    elevationProfile: t('elevationProfile'),
    slope: t('slope'),
    flat: t('flat'),
    gentle: t('gentle'),
    steep: t('steep'),
    extreme: t('extreme'),
    km: t('km'),
    meters: t('meters'),
    resetZoom: t('resetZoom'),
  };

  if (!hasHazards) {
    return (
      <div className="hidden lg:block">
        <TrailElevationChart
          trackProfile={trackProfile}
          labels={chartLabels}
          externalHoverDist={hoverDist}
          onHoverDist={setHoverDist}
          onRangeSelect={(s, e) => setSelectedRange({ start: s, end: e })}
          onRangeReset={() => setSelectedRange(null)}
        />
      </div>
    );
  }

  return (
    <div className="hidden lg:block">
      <Tabs defaultValue="elevation">
        <TabsList className="mb-3">
          <TabsTrigger value="elevation">{t('elevationProfileTab')}</TabsTrigger>
          <TabsTrigger value="hazards">{t('criticalSections')}</TabsTrigger>
        </TabsList>
        <TabsContent value="elevation">
          <TrailElevationChart
            trackProfile={trackProfile}
            labels={chartLabels}
            externalHoverDist={hoverDist}
            onHoverDist={setHoverDist}
            onRangeSelect={(s, e) => setSelectedRange({ start: s, end: e })}
            onRangeReset={() => setSelectedRange(null)}
          />
        </TabsContent>
        <TabsContent value="hazards">
          <TrailHazards
            trackProfile={trackProfile}
            selectedRange={selectedRange}
            onSegmentSelect={(start, end, color) => setSelectedRange({ start, end, color })}
            onReset={() => setSelectedRange(null)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
