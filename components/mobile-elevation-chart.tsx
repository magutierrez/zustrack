'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { RouteOff } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { formatElevation, formatDistance } from '@/lib/utils';
import { useElevationChart } from '@/hooks/use-elevation-chart';
import { useRouteStore } from '@/store/route-store';
import { getSlopeColorHex } from '@/lib/slope-colors';

export function MobileElevationChart() {
  const t = useTranslations('WeatherTimeline');
  const tHazards = useTranslations('Hazards');
  const { unitSystem } = useSettings();

  const mobileHazardRange = useRouteStore((s) => s.mobileHazardRange);
  const setMobileHazardRange = useRouteStore((s) => s.setMobileHazardRange);
  const elevationData = useRouteStore((s) => s.elevationData);
  const setClickedChartPointDist = useRouteStore((s) => s.setClickedChartPointDist);

  const { chartData, selectedPoint, handleMouseMove, handleMouseLeave } = useElevationChart();

  // Filtered chart data for the active hazard segment
  const hazardChartData = useMemo(() => {
    if (!mobileHazardRange || !elevationData.length) return null;
    const filtered = elevationData.filter(
      (d) => d.distance >= mobileHazardRange.startDist && d.distance <= mobileHazardRange.endDist,
    );
    return filtered.map((d, idx) => {
      let slope = 0;
      if (idx > 0) {
        const prev = filtered[idx - 1];
        const distDiff = (d.distance - prev.distance) * 1000;
        const eleDiff = d.elevation - prev.elevation;
        if (distDiff > 0.1) slope = (eleDiff / distDiff) * 100;
      }
      return {
        distance: d.distance,
        elevation: Math.round(d.elevation),
        slope: Math.round(slope * 10) / 10,
        color: getSlopeColorHex(slope),
      };
    });
  }, [mobileHazardRange, elevationData]);

  const activeData = hazardChartData ?? chartData;

  if (!activeData.length) return null;

  const isHazardView = !!hazardChartData;

  return (
    <div className="bg-background border-border relative w-full shrink-0 border-t">
      {isHazardView && (
        <div className="border-border/50 flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-muted-foreground text-[9px] font-black tracking-wider uppercase">
            {activeData[0] &&
              `km ${activeData[0].distance.toFixed(1)} – ${activeData[activeData.length - 1].distance.toFixed(1)}`}
          </span>
          <button
            onClick={() => setMobileHazardRange(null)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-[9px] font-black tracking-wider uppercase"
          >
            <RouteOff className="h-3 w-3" />
            {tHazards('showFullRoute')}
          </button>
        </div>
      )}

      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={activeData}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload.length) {
                setClickedChartPointDist(e.activePayload[0].payload.distance);
              }
            }}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="mobile-elev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0.03} />
              </linearGradient>
              {isHazardView && (
                <linearGradient id="mobile-hazard-stroke" x1="0" y1="0" x2="1" y2="0">
                  {activeData.length > 1 &&
                    activeData.map((d, i) => (
                      <stop
                        key={i}
                        offset={`${(i / (activeData.length - 1)) * 100}%`}
                        stopColor={d.color}
                      />
                    ))}
                </linearGradient>
              )}
            </defs>
            <XAxis dataKey="distance" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              position={{ y: 4 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const currentDist = data.distance;
                  const displayEle =
                    selectedPoint && Math.abs(selectedPoint.distanceFromStart - currentDist) < 0.05
                      ? selectedPoint.ele
                      : data.elevation;

                  return (
                    <div className="border-border bg-background/90 flex items-center gap-1.5 rounded-md border px-2 py-1 shadow-md backdrop-blur-sm">
                      <span className="text-foreground font-mono text-[10px] font-black">
                        {formatElevation(displayEle, unitSystem)}
                      </span>
                      <span className="text-muted-foreground text-[8px]">·</span>
                      <span className="text-muted-foreground text-[9px] font-bold">
                        {formatDistance(currentDist, unitSystem)}
                      </span>
                      <span className="text-muted-foreground text-[8px]">·</span>
                      <div className="flex items-center gap-0.5">
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="text-foreground font-mono text-[9px] font-black">
                          {data.slope}%
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="linear"
              dataKey="elevation"
              stroke={isHazardView ? 'url(#mobile-hazard-stroke)' : 'currentColor'}
              strokeWidth={isHazardView ? 2.5 : 1.5}
              fillOpacity={1}
              fill="url(#mobile-elev-fill)"
              isAnimationActive={false}
              connectNulls
            />
            {selectedPoint && (
              <ReferenceLine
                x={selectedPoint.distanceFromStart}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
