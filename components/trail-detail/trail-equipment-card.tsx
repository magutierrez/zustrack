'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentItem {
  icon: string;
  text: string;
  level: 'essential' | 'recommended';
  category: string;
}

interface Labels {
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
  // Item texts
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

interface TrailData {
  distance_km: number;
  elevation_gain_m: number;
  elevation_max_m: number | null;
  avg_elevation_m: number | null;
  max_slope_pct: number;
  effort_level: string;
  season_best: string;
  dominant_surface: string | null;
  water_sources: { lat: number; lng: number }[] | null;
}

function buildEquipmentList(trail: TrailData, labels: Labels): EquipmentItem[] {
  const items: EquipmentItem[] = [];
  const slope = trail.max_slope_pct;
  const gain = trail.elevation_gain_m;
  const maxEl = trail.elevation_max_m ?? 0;
  const avgEl = trail.avg_elevation_m ?? 0;
  const dist = trail.distance_km;
  const surface = trail.dominant_surface ?? '';
  const hardSurfaces = ['rock', 'dirt', 'earth', 'ground', 'mud'];

  // Footwear
  if (slope > 30 || (hardSurfaces.includes(surface) && slope > 20)) {
    items.push({ icon: '🥾', text: labels.equipmentFootwearVibram, level: 'essential', category: labels.equipmentFootwear });
  } else if (hardSurfaces.includes(surface) || slope > 15) {
    items.push({ icon: '👟', text: labels.equipmentFootwearTrail, level: 'recommended', category: labels.equipmentFootwear });
  } else {
    items.push({ icon: '👟', text: labels.equipmentFootwearLight, level: 'recommended', category: labels.equipmentFootwear });
  }

  // Poles
  if (gain > 1000 || slope > 30) {
    items.push({ icon: '🪄', text: labels.equipmentPolesHighly, level: 'essential', category: labels.equipmentPoles });
  } else if (gain > 500 || slope > 20) {
    items.push({ icon: '🪄', text: labels.equipmentPolesRecommended, level: 'recommended', category: labels.equipmentPoles });
  }

  // Water
  const durationH = dist / 4 + gain / 600;
  const litersBase = Math.ceil(durationH * 0.5);
  const hasWater = (trail.water_sources?.length ?? 0) > 0;
  const liters = hasWater ? litersBase : litersBase + 1;
  const waterAmount = labels.equipmentWaterAmount
    .replace('{min}', String(liters))
    .replace('{max}', String(liters + 1));
  items.push({
    icon: '💧',
    text: `${waterAmount} ${hasWater ? labels.equipmentWaterWithSources : labels.equipmentWaterNoSources}`,
    level: hasWater ? 'recommended' : 'essential',
    category: labels.equipmentWater,
  });

  // Layers
  if (maxEl > 2500 || trail.season_best === 'avoid_winter') {
    items.push({ icon: '🧥', text: labels.equipmentLayersWaterproof, level: 'essential', category: labels.equipmentLayers });
  } else if (maxEl > 1500) {
    items.push({ icon: '🧣', text: labels.equipmentLayersFleece, level: 'recommended', category: labels.equipmentLayers });
  }

  // Sun protection
  if (avgEl > 1500 || maxEl > 2000) {
    items.push({ icon: '🧴', text: labels.equipmentSunHigh, level: 'essential', category: labels.equipmentSun });
  } else {
    items.push({ icon: '🧴', text: labels.equipmentSunBasic, level: 'recommended', category: labels.equipmentSun });
  }

  // Crampons
  if (maxEl > 2000 && trail.season_best === 'avoid_winter') {
    items.push({ icon: '⛰️', text: labels.equipmentCramponsNote, level: 'recommended', category: labels.equipmentCrampons });
  }

  // First aid
  if (trail.effort_level === 'very_hard' || dist > 20) {
    items.push({ icon: '🩹', text: labels.equipmentFirstAidFull, level: 'essential', category: labels.equipmentFirstAid });
  } else if (trail.effort_level === 'hard') {
    items.push({ icon: '🩹', text: labels.equipmentFirstAidBasic, level: 'recommended', category: labels.equipmentFirstAid });
  }

  // Navigation
  if (dist > 15) {
    items.push({ icon: '🗺️', text: labels.equipmentNavigationGps, level: 'essential', category: labels.equipmentNavigation });
  } else if (dist > 8) {
    items.push({ icon: '🗺️', text: labels.equipmentNavigationOffline, level: 'recommended', category: labels.equipmentNavigation });
  }

  return items;
}

export function TrailEquipmentCard({
  trail,
  labels,
}: {
  trail: TrailData;
  labels: Labels;
}) {
  const [open, setOpen] = useState(true);
  const items = buildEquipmentList(trail, labels);
  const essentialCount = items.filter((i) => i.level === 'essential').length;

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{labels.equipmentTitle}</h2>
          {essentialCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
              {essentialCount} {labels.essential.toLowerCase()}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl leading-none">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900 dark:text-white">
                  {item.text}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{item.category}</span>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  item.level === 'essential'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                )}
              >
                {item.level === 'essential' ? labels.essential : labels.recommended}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
