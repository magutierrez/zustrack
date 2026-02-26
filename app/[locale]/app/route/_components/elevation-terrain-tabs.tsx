'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisChart } from '@/components/weather-timeline/elevation-profile';
import { RouteSegments } from '@/components/weather-timeline/route-segments';

export function ElevationTerrainTabs() {
  const twt = useTranslations('WeatherTimeline');

  return (
    <Tabs defaultValue="elevation" className="w-full">
      <TabsList className="custom-scrollbar bg-secondary/50 mb-4 flex h-auto w-full flex-col items-center justify-start overflow-x-auto overflow-y-hidden md:grid md:grid-cols-2 md:justify-center lg:flex-row">
        <TabsTrigger value="elevation" className="w-full min-w-fit">
          {twt('elevationTitle')}
        </TabsTrigger>
        <TabsTrigger value="terrain" className="w-full min-w-fit">
          {twt('segmentsTitle')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="elevation" className="mt-0">
        <AnalysisChart />
      </TabsContent>
      <TabsContent value="terrain" className="mt-0">
        <RouteSegments />
      </TabsContent>
    </Tabs>
  );
}
