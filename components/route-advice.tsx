'use client';

import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAdviceMetrics } from '@/hooks/use-advice-metrics';
import { ViabilityCard } from '@/components/route-advice/viability-card';
import { MudRiskCard } from '@/components/route-advice/mud-risk-card';
import { SnowshoeCard } from '@/components/route-advice/snowshoe-card';
import { PhysiologySummary } from '@/components/route-advice/physiology-summary';
import { AdviceGrid } from '@/components/route-advice/advice-grid';

interface RouteAdviceProps {
  weatherPoints: RouteWeatherPoint[];
  activityType: 'cycling' | 'walking';
  showWaterSources?: boolean;
  onToggleWaterSources?: () => void;
  showNoCoverageZones?: boolean;
  onToggleNoCoverageZones?: () => void;
  showEscapePoints?: boolean;
  onToggleEscapePoints?: () => void;
}

export function RouteAdvice({
  weatherPoints,
  activityType,
  showWaterSources,
  onToggleWaterSources,
  showNoCoverageZones,
  onToggleNoCoverageZones,
  showEscapePoints,
  onToggleEscapePoints,
}: RouteAdviceProps) {
  const { viability, physiologyNeeds, mudMetrics, snowMetrics, uniqueEscapePoints } =
    useAdviceMetrics(weatherPoints, activityType);

  if (weatherPoints.length === 0 || !viability || !physiologyNeeds) return null;

  const { durationHours, needs } = physiologyNeeds;
  const { mudSegments, overallMudRisk, hasMudData, mudInputs } = mudMetrics;
  const { snowSegments, overallSnowCondition, hasSnow, maxSnowDepthCm } = snowMetrics;

  return (
    <div className="flex flex-col gap-6">
      {/* Viability Score */}
      <ViabilityCard viability={viability} />

      {/* Physiology Summary */}
      <PhysiologySummary needs={needs} durationHours={durationHours} />

      <div
        className={cn(
          'grid grid-cols-1 gap-3',
          hasSnow && hasMudData && mudInputs && 'sm:grid-cols-2',
        )}
      >
        {/* Snow / Snowshoe Card — only rendered when there is meaningful snow */}
        {hasSnow && (
          <SnowshoeCard
            overallCondition={overallSnowCondition}
            segments={snowSegments}
            activityType={activityType}
            maxSnowDepthCm={maxSnowDepthCm}
          />
        )}

        {/* Mud Risk Card */}
        {hasMudData && mudInputs && (
          <MudRiskCard
            overallRisk={overallMudRisk}
            segments={mudSegments}
            activityType={activityType}
            inputs={mudInputs}
          />
        )}
      </div>

      <AdviceGrid
        weatherPoints={weatherPoints}
        activityType={activityType}
        uniqueEscapePoints={uniqueEscapePoints}
        showWaterSources={showWaterSources}
        onToggleWaterSources={onToggleWaterSources}
        showNoCoverageZones={showNoCoverageZones}
        onToggleNoCoverageZones={onToggleNoCoverageZones}
        showEscapePoints={showEscapePoints}
        onToggleEscapePoints={onToggleEscapePoints}
      />
    </div>
  );
}
