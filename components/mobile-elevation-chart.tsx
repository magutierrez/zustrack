'use client';

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
import { useSettings } from '@/hooks/use-settings';
import { formatElevation, formatDistance } from '@/lib/utils';
import { useElevationChart } from '@/hooks/use-elevation-chart';

export function MobileElevationChart() {
  const t = useTranslations('WeatherTimeline');
  const { unitSystem } = useSettings();

  const { chartData, selectedPoint, handleMouseMove, handleMouseLeave } = useElevationChart();

  if (!chartData.length) return null;

  return (
    <div className="bg-background border-border text-primary h-28 w-full shrink-0 border-t">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="mobile-elev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.03} />
            </linearGradient>
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
            stroke="currentColor"
            strokeWidth={1.5}
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
  );
}
