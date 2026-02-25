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
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const currentDist = data.distance;
                const displayEle =
                  selectedPoint && Math.abs(selectedPoint.distanceFromStart - currentDist) < 0.05
                    ? selectedPoint.ele
                    : data.elevation;

                return (
                  <div className="border-border bg-background/95 flex items-center gap-2 rounded-lg border p-1.5 shadow-lg backdrop-blur-sm">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-muted-foreground text-[8px] font-black tracking-widest uppercase">
                        {formatDistance(currentDist, unitSystem)}
                      </p>
                      <span className="text-foreground text-xs font-black">
                        {formatElevation(displayEle, unitSystem)}
                      </span>
                    </div>
                    <div className="border-border flex flex-col items-center gap-0.5 border-l pl-2">
                      <span className="text-muted-foreground text-[7px] font-bold tracking-tighter uppercase">
                        {t('slope')}
                      </span>
                      <span className="text-foreground font-mono text-[10px] font-black">
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
