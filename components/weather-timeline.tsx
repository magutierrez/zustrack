'use client';

import type { RouteWeatherPoint } from '@/lib/types';
import { WeatherSummary } from './weather-timeline/weather-summary';
import { WeatherList } from './weather-timeline/weather-list';
import { AnalysisChart as ElevationProfile } from './weather-timeline/elevation-profile';
import { WeatherPointDetail } from './weather-timeline/weather-point-detail';
import { RouteSegments } from './weather-timeline/route-segments';

interface WeatherTimelineProps {
  weatherPoints: RouteWeatherPoint[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function WeatherTimeline({ weatherPoints, selectedIndex, onSelect }: WeatherTimelineProps) {
  if (weatherPoints.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Summary Stats */}
      <WeatherSummary weatherPoints={weatherPoints} />

      {/* 2. Horizontal Points List */}
      <WeatherList weatherPoints={weatherPoints} selectedIndex={selectedIndex} onSelect={onSelect} />

      {/* 3. Route Segments (Path types & Surfaces) */}
      <RouteSegments />

      {/* 4. Elevation Chart */}
      <ElevationProfile />

      {/* 5. Selected Point Detail */}
      {selectedIndex !== null && weatherPoints[selectedIndex] && (
        <WeatherPointDetail weatherPoint={weatherPoints[selectedIndex]} activityType="cycling" />
      )}
    </div>
  );
}
