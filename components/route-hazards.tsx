'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Flame, Zap, Activity, RefreshCcw, Map } from 'lucide-react';
import type { RouteWeatherPoint, RoutePoint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip } from 'recharts';
import { useRouteHazards } from '@/hooks/use-route-hazards';

interface RouteHazardsProps {
  weatherPoints: RouteWeatherPoint[];
  allPoints?: RoutePoint[];
  onSelectSegment?: (range: { start: number; end: number } | null) => void;
  onSelectPoint?: (point: RoutePoint | null) => void;
  setActiveFilter?: (
    filter: { key: 'pathType' | 'surface' | 'hazard'; value: string } | null,
  ) => void;
  onClearSelection?: () => void;
}

const segmentIcons: Record<string, React.ReactNode> = {
  steepClimb: <TrendingUp className="h-4 w-4" />,
  steepDescent: <TrendingDown className="h-4 w-4" />,
  heatStress: <Flame className="h-4 w-4" />,
  effort: <Activity className="h-4 w-4" />,
};

const segmentColors: Record<string, string> = {
  steepClimb: 'text-red-600 bg-red-500/10 border-red-200',
  steepDescent: 'text-orange-600 bg-orange-500/10 border-orange-200',
  heatStress: 'text-amber-600 bg-amber-500/10 border-amber-200',
  effort: 'text-blue-600 bg-blue-500/10 border-blue-200',
};

export function RouteHazards({
  weatherPoints,
  allPoints = [],
  onSelectSegment,
  onSelectPoint,
  setActiveFilter,
  onClearSelection,
}: RouteHazardsProps) {
  const t = useTranslations('Hazards');
  const tRouteMap = useTranslations('RouteMap');

  const { sortedSegments, buildChartData, handleMouseMove, handleMouseLeave } = useRouteHazards(weatherPoints);

  if (weatherPoints.length === 0) return null;

  const handleCardClick = (seg: any) => {
    onSelectSegment?.({ start: seg.startDist, end: seg.endDist });
    setActiveFilter?.({ key: 'hazard', value: `${seg.startDist}-${seg.endDist}` });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          className="bg-card/90 hover:bg-card h-8 gap-2 shadow-md"
          onClick={() => {
            onClearSelection?.();
            setActiveFilter?.(null);
            onSelectPoint?.(null);
          }}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {tRouteMap('resetView')}
          </span>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sortedSegments.map((seg, idx) => {
          const densePoints =
            allPoints.length > 0
              ? allPoints.filter(
                  (p) => p.distanceFromStart >= seg.startDist && p.distanceFromStart <= seg.endDist,
                )
              : seg.points.map((wp) => wp.point);

          const chartData = buildChartData(densePoints);

          const minEle = Math.min(...chartData.map((d) => d.ele));
          const maxEle = Math.max(...chartData.map((d) => d.ele));
          const distance = seg.endDist - seg.startDist;

          const maxSlopePoint = chartData.reduce(
            (prev, current) => (current.slope > prev.slope ? current : prev),
            chartData[0],
          );

          return (
            <Card
              key={idx}
              className="border-border/50 bg-card hover:border-primary/50 cursor-pointer overflow-hidden transition-all hover:shadow-md active:scale-[0.98]"
              onClick={() => handleCardClick(seg)}
            >
              <CardContent className="p-0">
                <div className="border-border/50 bg-muted/30 flex items-start justify-between border-b p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${segmentColors[seg.type]}`}>
                      {segmentIcons[seg.type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-foreground text-sm leading-tight font-bold">
                          {t(seg.type)}
                        </h4>
                        {seg.climbCategory && seg.climbCategory !== 'none' && (
                          <Badge
                            variant="outline"
                            className="bg-primary/5 border-primary/20 text-primary h-4 px-1 text-[8px] font-bold"
                          >
                            CAT {seg.climbCategory}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                        km {seg.startDist.toFixed(1)} - {distance.toFixed(1)} km {t('distance')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className="bg-background/50 gap-1 font-mono text-[10px]"
                    >
                      <Activity className="h-3 w-3" />
                      {Math.round(seg.avgSlope)}% {t('avg')}
                    </Badge>
                    <span className="text-muted-foreground text-[9px] font-bold tabular-nums">
                      {Math.round(minEle)}m - {Math.round(maxEle)}m
                    </span>
                  </div>
                </div>

                <div className="bg-secondary/5 group relative h-28 w-full cursor-crosshair">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                      onMouseMove={(e) => handleMouseMove(e, densePoints, onSelectPoint ?? (() => {}))}
                      onMouseLeave={() => handleMouseLeave(onSelectPoint)}
                    >
                      <defs>
                        <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                          {chartData.length > 1 &&
                            chartData.map((d, i) => (
                              <stop
                                key={i}
                                offset={`${(i / (chartData.length - 1)) * 100}%`}
                                stopColor={d.color}
                              />
                            ))}
                        </linearGradient>
                        <linearGradient id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="border-border bg-background/95 animate-in fade-in zoom-in rounded-lg border p-2 shadow-xl backdrop-blur-sm duration-200">
                                <div className="flex min-w-[60px] flex-col gap-0.5">
                                  <span className="text-foreground flex items-center justify-between font-mono text-[10px] font-black">
                                    {Math.round(data.ele)}m
                                    <span className="bg-secondary text-primary ml-2 rounded px-1">
                                      {Math.round(data.slope)}%
                                    </span>
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{
                          stroke: 'currentColor',
                          strokeWidth: 1,
                          strokeOpacity: 0.2,
                          strokeDasharray: '3 3',
                        }}
                      />
                      <Area
                        type="linear"
                        dataKey="ele"
                        stroke={`url(#grad-${idx})`}
                        strokeWidth={3}
                        fill={`url(#fill-${idx})`}
                        isAnimationActive={false}
                        connectNulls
                      />
                      <ReferenceLine
                        x={maxSlopePoint.dist}
                        stroke="#991b1b"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                        label={{
                          value: 'MAX',
                          position: 'top',
                          fill: '#991b1b',
                          fontSize: 8,
                          fontWeight: 'black',
                        }}
                      />
                      <XAxis
                        type="number"
                        dataKey="dist"
                        hide
                        domain={[seg.startDist, seg.endDist]}
                      />
                      <YAxis hide domain={[minEle - 1, maxEle + 1]} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-muted/10 border-border/30 flex items-center justify-between border-t px-4 py-2">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[9px] font-bold uppercase">
                        {t('slope')}
                      </span>
                      <span className="text-xs font-bold">
                        {Math.round(seg.maxSlope)}% {t('max')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[9px] font-bold uppercase">
                        {t('danger')}
                      </span>
                      <span className={`text-xs font-bold uppercase ${seg.dangerColor}`}>
                        {t(`levels.${seg.dangerLevel}`)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-primary hover:text-primary-foreground h-7 gap-1.5 px-2 text-[10px] font-bold uppercase transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(seg);
                    }}
                  >
                    <Map className="h-3 w-3" />
                    {t('showOnMap')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedSegments.length === 0 && (
        <div className="border-border rounded-xl border-2 border-dashed p-12 text-center">
          <Zap className="text-muted-foreground mx-auto mb-3 h-8 w-8 opacity-20" />
          <p className="text-muted-foreground text-sm italic">{t('noSegments')}</p>
        </div>
      )}
    </div>
  );
}
