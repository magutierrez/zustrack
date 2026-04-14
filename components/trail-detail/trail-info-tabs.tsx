'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EscapePointsSection } from './escape-points-section';
import { WaterSourcesSection, type WaterSource } from './water-sources-section';
import { TrailEquipmentCard } from './trail-equipment-card';
import type { Trail } from '@/lib/trails';

type TrackPoint = { lat: number; lng: number; d: number; e: number | null };

interface Labels {
  escapePoints: string;
  town: string;
  road: string;
  shelter: string;
  waterSources: string;
  natural: string;
  urban: string;
  reliable: string;
  seasonal: string;
  unreliable: string;
  kmAway: string;
  showOnMap: string;
  waterGapMax: string;
  waterCarryRecommendation: string;
  liters: string;
  equipmentTitle: string;
  equipmentFootwear: string;
  equipmentPoles: string;
  equipmentWater: string;
  equipmentLayers: string;
  equipmentSun: string;
  equipmentCrampons: string;
  equipmentFirstAid: string;
  equipmentNavigation: string;
  essential: string;
  recommended: string;
  equipmentFootwearVibram: string;
  equipmentFootwearTrail: string;
  equipmentFootwearLight: string;
  equipmentPolesHighly: string;
  equipmentPolesRecommended: string;
  equipmentWaterAmount: string;
  equipmentWaterWithSources: string;
  equipmentWaterNoSources: string;
  equipmentLayersWaterproof: string;
  equipmentLayersFleece: string;
  equipmentSunHigh: string;
  equipmentSunBasic: string;
  equipmentCramponsNote: string;
  equipmentFirstAidFull: string;
  equipmentFirstAidBasic: string;
  equipmentNavigationGps: string;
  equipmentNavigationOffline: string;
}

export function TrailInfoTabs({
  trail,
  trackProfile,
  activePOI,
  onShowOnMap,
  labels,
}: {
  trail: Trail;
  trackProfile: TrackPoint[];
  activePOI?: { lat: number; lng: number } | null;
  onShowOnMap?: (lat: number, lng: number) => void;
  labels: Labels;
}) {
  const hasEscape = (trail.escape_points?.length ?? 0) > 0;
  const hasWater = (trail.water_sources?.length ?? 0) > 0;

  const defaultTab = hasEscape ? 'escape' : hasWater ? 'water' : 'equipment';

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="custom-scrollbar bg-secondary/50 mb-4 flex h-auto w-full items-center justify-start overflow-x-auto overflow-y-hidden">
        {hasEscape && (
          <TabsTrigger value="escape" className="h-8 w-full min-w-fit">
            {labels.escapePoints}
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {trail.escape_points!.length}
            </span>
          </TabsTrigger>
        )}
        {hasWater && (
          <TabsTrigger value="water" className="h-8 w-full min-w-fit">
            {labels.waterSources}
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {trail.water_sources!.length}
            </span>
          </TabsTrigger>
        )}
        <TabsTrigger value="equipment" className="h-8 w-full min-w-fit">
          {labels.equipmentTitle}
        </TabsTrigger>
      </TabsList>

      {hasEscape && (
        <TabsContent value="escape">
          <EscapePointsSection
            escapePoints={trail.escape_points!}
            labels={{
              escapePoints: labels.escapePoints,
              town: labels.town,
              road: labels.road,
              shelter: labels.shelter,
              kmAway: labels.kmAway,
              showOnMap: labels.showOnMap,
            }}
            activePOI={activePOI}
            onShowOnMap={onShowOnMap}
          />
        </TabsContent>
      )}

      {hasWater && (
        <TabsContent value="water">
          <WaterSourcesSection
            waterSources={trail.water_sources as WaterSource[]}
            trackProfile={trackProfile}
            distanceKm={trail.distance_km}
            estimatedDurationMin={trail.estimated_duration_min}
            labels={{
              waterSources: labels.waterSources,
              natural: labels.natural,
              urban: labels.urban,
              reliable: labels.reliable,
              seasonal: labels.seasonal,
              unreliable: labels.unreliable,
              kmAway: labels.kmAway,
              showOnMap: labels.showOnMap,
              waterGapMax: labels.waterGapMax,
              waterCarryRecommendation: labels.waterCarryRecommendation,
              liters: labels.liters,
            }}
            activePOI={activePOI}
            onShowOnMap={onShowOnMap}
          />
        </TabsContent>
      )}

      <TabsContent value="equipment">
        <TrailEquipmentCard
          trail={{
            distance_km: trail.distance_km,
            elevation_gain_m: trail.elevation_gain_m,
            elevation_max_m: trail.elevation_max_m,
            avg_elevation_m: trail.avg_elevation_m,
            max_slope_pct: trail.max_slope_pct,
            effort_level: trail.effort_level,
            season_best: trail.season_best,
            dominant_surface: trail.dominant_surface,
            water_sources: trail.water_sources,
          }}
          labels={{
            equipmentTitle: labels.equipmentTitle,
            equipmentFootwear: labels.equipmentFootwear,
            equipmentPoles: labels.equipmentPoles,
            equipmentWater: labels.equipmentWater,
            equipmentLayers: labels.equipmentLayers,
            equipmentSun: labels.equipmentSun,
            equipmentCrampons: labels.equipmentCrampons,
            equipmentFirstAid: labels.equipmentFirstAid,
            equipmentNavigation: labels.equipmentNavigation,
            essential: labels.essential,
            recommended: labels.recommended,
            equipmentFootwearVibram: labels.equipmentFootwearVibram,
            equipmentFootwearTrail: labels.equipmentFootwearTrail,
            equipmentFootwearLight: labels.equipmentFootwearLight,
            equipmentPolesHighly: labels.equipmentPolesHighly,
            equipmentPolesRecommended: labels.equipmentPolesRecommended,
            equipmentWaterAmount: labels.equipmentWaterAmount,
            equipmentWaterWithSources: labels.equipmentWaterWithSources,
            equipmentWaterNoSources: labels.equipmentWaterNoSources,
            equipmentLayersWaterproof: labels.equipmentLayersWaterproof,
            equipmentLayersFleece: labels.equipmentLayersFleece,
            equipmentSunHigh: labels.equipmentSunHigh,
            equipmentSunBasic: labels.equipmentSunBasic,
            equipmentCramponsNote: labels.equipmentCramponsNote,
            equipmentFirstAidFull: labels.equipmentFirstAidFull,
            equipmentFirstAidBasic: labels.equipmentFirstAidBasic,
            equipmentNavigationGps: labels.equipmentNavigationGps,
            equipmentNavigationOffline: labels.equipmentNavigationOffline,
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
