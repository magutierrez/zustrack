'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeatherSummary } from '@/components/weather-timeline/weather-summary';
import { WeatherList } from '@/components/weather-timeline/weather-list';
import { RouteAdvice } from '@/components/route-advice';
import { WeatherPointDetail } from '@/components/weather-timeline/weather-point-detail';
import { RouteHazards } from '@/components/route-hazards';
import { BestDepartureFinder } from '@/components/best-departure-finder';
import { Progress } from '@/components/ui/progress';

import { useRouteStore } from '@/store/route-store';
import { useAnalysisMetrics } from '@/hooks/use-analysis-metrics';

interface AnalysisResultsProps {
  onFindBestWindow: () => void;
  onSelectBestWindow: (time: string) => void;
  onAnalyzeBestWindow: (time: string) => void;
}

export function AnalysisResults({
  onFindBestWindow,
  onSelectBestWindow,
  onAnalyzeBestWindow,
}: AnalysisResultsProps) {
  const t = useTranslations('HomePage');
  const th = useTranslations('Hazards');

  // Read all state from store
  const weatherPoints = useRouteStore((s) => s.weatherPoints);
  const gpxData = useRouteStore((s) => s.gpxData);
  const activeFilter = useRouteStore((s) => s.activeFilter);
  const setActiveFilter = useRouteStore((s) => s.setActiveFilter);
  const selectedPointIndex = useRouteStore((s) => s.selectedPointIndex);
  const setSelectedPointIndex = useRouteStore((s) => s.setSelectedPointIndex);
  const setSelectedRange = useRouteStore((s) => s.setSelectedRange);
  const setChartHoverPoint = useRouteStore((s) => s.setChartHoverPoint);
  const activityType = useRouteStore((s) => s.fetchedActivityType);
  const showWaterSources = useRouteStore((s) => s.showWaterSources);
  const setShowWaterSources = useRouteStore((s) => s.setShowWaterSources);
  const showNoCoverageZones = useRouteStore((s) => s.showNoCoverageZones);
  const setShowNoCoverageZones = useRouteStore((s) => s.setShowNoCoverageZones);
  const showEscapePoints = useRouteStore((s) => s.showEscapePoints);
  const setShowEscapePoints = useRouteStore((s) => s.setShowEscapePoints);
  const bestWindows = useRouteStore((s) => s.bestWindows);
  const isFindingWindow = useRouteStore((s) => s.isFindingWindow);
  const setFocusPoint = useRouteStore((s) => s.setFocusPoint);
  const clearSelection = useRouteStore((s) => s.clearSelection);

  const allPoints = gpxData?.points || [];

  const [tab, setTab] = useState('weather');

  const { totalSegments, highDangerSegments, mediumDangerSegments, lowDangerSegments } =
    useAnalysisMetrics();

  useEffect(() => {
    // Ensure no point is pre-selected on mount
    setSelectedPointIndex(null);
  }, [setSelectedPointIndex]);

  useEffect(() => {
    const resultsContainer = document.getElementById('analysis-results-container');
    if (resultsContainer) {
      resultsContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tab]);

  return (
    <div id="analysis-results-container">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="custom-scrollbar bg-secondary/50 mb-8 flex w-full items-center justify-start overflow-x-auto overflow-y-hidden md:grid md:grid-cols-3 md:justify-center">
          <TabsTrigger value="weather" className="min-w-fit md:w-full">
            {t('sections.weatherAnalysis')}
          </TabsTrigger>
          <TabsTrigger value="advice" className="min-w-fit md:w-full">
            {t('sections.advice')}
          </TabsTrigger>
          <TabsTrigger value="hazards" className="min-w-fit md:w-full">
            {t('sections.hazards')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="mt-6 flex flex-col gap-6">
          <WeatherSummary weatherPoints={weatherPoints} />
          <WeatherList
            weatherPoints={weatherPoints}
            selectedIndex={selectedPointIndex}
            onSelect={setSelectedPointIndex}
          />
          {selectedPointIndex !== null &&
            (() => {
              const selectedWeatherPoint = weatherPoints[selectedPointIndex];
              if (selectedWeatherPoint) {
                return (
                  <WeatherPointDetail
                    weatherPoint={selectedWeatherPoint}
                    activityType={activityType ?? 'cycling'}
                    onShowOnMap={(lat, lon, name) => setFocusPoint({ lat, lon, name })}
                  />
                );
              }
              return null;
            })()}
          <BestDepartureFinder
            windows={bestWindows}
            isLoading={isFindingWindow}
            onFind={onFindBestWindow}
            onSelect={onSelectBestWindow}
            onAnalyze={onAnalyzeBestWindow}
          />{' '}
        </TabsContent>

        <TabsContent value="advice" className="mt-6 flex flex-col gap-6">
          <RouteAdvice
            weatherPoints={weatherPoints}
            activityType={activityType ?? 'cycling'}
            showWaterSources={showWaterSources}
            onToggleWaterSources={() => setShowWaterSources(!showWaterSources)}
            showNoCoverageZones={showNoCoverageZones}
            onToggleNoCoverageZones={() => setShowNoCoverageZones(!showNoCoverageZones)}
            showEscapePoints={showEscapePoints}
            onToggleEscapePoints={() => setShowEscapePoints(!showEscapePoints)}
          />
        </TabsContent>

        <TabsContent value="hazards" className="mt-6 flex flex-col gap-6">
          <RouteHazards
            weatherPoints={weatherPoints}
            allPoints={allPoints}
            onSelectSegment={(segment) =>
              segment && setSelectedRange({ start: segment?.start, end: segment?.end })
            }
            onSelectPoint={setChartHoverPoint}
            setActiveFilter={setActiveFilter}
            onClearSelection={clearSelection}
          />

          {totalSegments > 0 && (
            <div className="border-border bg-card/50 flex flex-col gap-4 rounded-xl border p-6">
              <div className="border-border flex items-center gap-2 border-b pb-2">
                <div className="bg-primary h-4 w-1 rounded-full" />
                <h3 className="text-foreground/80 text-sm font-bold tracking-wider uppercase">
                  {th('effortLevel')}
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-foreground flex items-center justify-between text-sm">
                  <p>{th('levels.high')}</p>
                  <p>{highDangerSegments}</p>
                </div>
                <Progress
                  value={(highDangerSegments / totalSegments) * 100}
                  className="h-2 bg-red-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-foreground flex items-center justify-between text-sm">
                  <p>{th('levels.medium')}</p>
                  <p>{mediumDangerSegments}</p>
                </div>
                <Progress
                  value={(mediumDangerSegments / totalSegments) * 100}
                  className="h-2 bg-orange-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-foreground flex items-center justify-between text-sm">
                  <p>{th('levels.low')}</p>
                  <p>{lowDangerSegments}</p>
                </div>
                <Progress
                  value={(lowDangerSegments / totalSegments) * 100}
                  className="h-2 bg-amber-500"
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
