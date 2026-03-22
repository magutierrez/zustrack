'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Activity, Zap, Flame } from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { getSlopeColorHex } from '@/lib/slope-colors';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrackPoint = { lat: number; lng: number; d: number; e: number | null };

type TrailSegment = {
  type: 'steepClimb' | 'steepDescent' | 'effort';
  dangerLevel: 'low' | 'medium' | 'high';
  dangerColor: string;
  startDist: number;
  endDist: number;
  points: TrackPoint[];
  maxSlope: number;
  avgSlope: number;
  lengthKm: number;
  climbCategory?: 'HC' | '1' | '2' | '3' | '4' | 'none';
};

type ChartPoint = { dist: number; ele: number; slope: number; color: string };

// ---------------------------------------------------------------------------
// Segment analysis — adapted from lib/utils.ts analyzeRouteSegments
// Works with track_profile points {d, e} instead of RouteWeatherPoint[]
// ---------------------------------------------------------------------------

function analyzeTrackSegments(pts: TrackPoint[]): TrailSegment[] {
  if (pts.length < 2) return [];

  // 1. Raw slopes
  const rawSlopes = new Array<number>(pts.length).fill(0);
  for (let i = 1; i < pts.length; i++) {
    const distKm = pts[i].d - pts[i - 1].d;
    const eleDiff = (pts[i].e ?? 0) - (pts[i - 1].e ?? 0);
    rawSlopes[i] = distKm > 0.01 ? (eleDiff / (distKm * 1000)) * 100 : 0;
  }

  // 2. 3-point weighted smooth (25-50-25)
  const slopes = rawSlopes.map((s, i) => {
    if (i === 0 || i === rawSlopes.length - 1) return s;
    return rawSlopes[i - 1] * 0.25 + s * 0.5 + rawSlopes[i + 1] * 0.25;
  });

  // 3. Classify each point (no heatStress — needs live weather)
  const pointTypes = pts.map((_, i): TrailSegment['type'] | null => {
    if (i === 0) return null;
    const s = slopes[i];
    if (s >= 3) return 'steepClimb';
    if (s <= -5) return 'steepDescent';
    if (s >= 1.5) return 'effort';
    return null;
  });

  // 4. Bridge single neutral gaps between matching types
  for (let i = 1; i < pointTypes.length - 1; i++) {
    if (
      pointTypes[i] === null &&
      pointTypes[i - 1] !== null &&
      pointTypes[i + 1] === pointTypes[i - 1]
    ) {
      pointTypes[i] = pointTypes[i - 1];
    }
  }

  // 5. Build + validate segments
  const getClimbCategory = (score: number): TrailSegment['climbCategory'] => {
    if (score >= 80000) return 'HC';
    if (score >= 64000) return '1';
    if (score >= 32000) return '2';
    if (score >= 16000) return '3';
    if (score >= 8000) return '4';
    return 'none';
  };

  type Accum = {
    type: TrailSegment['type'];
    startDist: number;
    endDist: number;
    points: TrackPoint[];
    maxSlope: number;
  };

  const segments: TrailSegment[] = [];
  let cur: Accum | null = null;

  const pushSeg = (acc: Accum) => {
    const lengthKm = acc.endDist - acc.startDist;
    const lengthM = lengthKm * 1000;
    const firstPt = acc.points[0];
    const lastPt = acc.points[acc.points.length - 1];
    const totalEleDiff = (lastPt.e ?? 0) - (firstPt.e ?? 0);
    const avgSlope = lengthM > 0 ? Math.abs((totalEleDiff / lengthM) * 100) : 0;
    const score = lengthM * avgSlope;

    let result: TrailSegment | null = null;

    if (acc.type === 'steepClimb') {
      if (lengthM < 500 || avgSlope < 3 || score < 3500) return;
      const cat = getClimbCategory(score);
      let dangerLevel: TrailSegment['dangerLevel'];
      let dangerColor: string;
      if (cat === 'HC' || cat === '1' || avgSlope > 12) {
        dangerLevel = 'high';
        dangerColor = 'text-red-600';
      } else if (cat === '2' || cat === '3' || avgSlope > 8) {
        dangerLevel = 'medium';
        dangerColor = 'text-orange-500';
      } else {
        dangerLevel = 'low';
        dangerColor = 'text-amber-500';
      }
      result = {
        type: 'steepClimb',
        dangerLevel,
        dangerColor,
        climbCategory: cat,
        startDist: acc.startDist,
        endDist: acc.endDist,
        points: acc.points,
        maxSlope: acc.maxSlope,
        avgSlope,
        lengthKm,
      };
    } else if (acc.type === 'steepDescent') {
      if (lengthM < 300 || avgSlope < 5) return;
      let dangerLevel: TrailSegment['dangerLevel'];
      let dangerColor: string;
      if (avgSlope > 15 || (avgSlope > 10 && lengthM > 2000)) {
        dangerLevel = 'high';
        dangerColor = 'text-red-600';
      } else if (avgSlope > 10 || (avgSlope > 7 && lengthM > 1000)) {
        dangerLevel = 'medium';
        dangerColor = 'text-orange-500';
      } else {
        dangerLevel = 'low';
        dangerColor = 'text-blue-400';
      }
      result = {
        type: 'steepDescent',
        dangerLevel,
        dangerColor,
        startDist: acc.startDist,
        endDist: acc.endDist,
        points: acc.points,
        maxSlope: acc.maxSlope,
        avgSlope,
        lengthKm,
      };
    } else if (acc.type === 'effort') {
      if (lengthM < 2000 || avgSlope < 1.5) return;
      let dangerLevel: TrailSegment['dangerLevel'];
      let dangerColor: string;
      if (lengthM >= 8000) {
        dangerLevel = 'high';
        dangerColor = 'text-orange-500';
      } else if (lengthM >= 4000) {
        dangerLevel = 'medium';
        dangerColor = 'text-amber-500';
      } else {
        dangerLevel = 'low';
        dangerColor = 'text-yellow-500';
      }
      result = {
        type: 'effort',
        dangerLevel,
        dangerColor,
        startDist: acc.startDist,
        endDist: acc.endDist,
        points: acc.points,
        maxSlope: acc.maxSlope,
        avgSlope,
        lengthKm,
      };
    }

    if (result) segments.push(result);
  };

  for (let i = 1; i < pts.length; i++) {
    const type = pointTypes[i];
    if (type !== null) {
      if (cur && cur.type === type) {
        cur.points.push(pts[i]);
        cur.endDist = pts[i].d;
        cur.maxSlope = Math.max(cur.maxSlope, Math.abs(slopes[i]));
      } else {
        if (cur) pushSeg(cur);
        cur = {
          type,
          startDist: pts[i - 1].d,
          endDist: pts[i].d,
          points: [pts[i - 1], pts[i]],
          maxSlope: Math.abs(slopes[i]),
        };
      }
    } else {
      if (cur) {
        pushSeg(cur);
        cur = null;
      }
    }
  }
  if (cur) pushSeg(cur);

  return segments
    .sort((a, b) => {
      const levels = ['low', 'medium', 'high'];
      return (
        levels.indexOf(b.dangerLevel) - levels.indexOf(a.dangerLevel) || b.maxSlope - a.maxSlope
      );
    })
    .slice(0, 8);
}

// ---------------------------------------------------------------------------
// Chart data — adapted from use-route-hazards.ts buildChartData
// ---------------------------------------------------------------------------

function buildChartData(points: TrackPoint[]): ChartPoint[] {
  const n = points.length;
  if (n === 0) return [];

  const rawSlopes = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    const distDiff = (points[i].d - points[i - 1].d) * 1000;
    const eleDiff = (points[i].e ?? 0) - (points[i - 1].e ?? 0);
    if (distDiff > 0.1) rawSlopes[i] = (eleDiff / distDiff) * 100;
  }

  // 400 m sliding window average
  const halfWindowKm = 0.2;
  const smoothSlopes = new Array<number>(n).fill(0);
  let left = 0,
    right = -1,
    wSum = 0,
    wCount = 0;
  for (let i = 0; i < n; i++) {
    const center = points[i].d;
    while (right + 1 < n && points[right + 1].d <= center + halfWindowKm) {
      right++;
      wSum += rawSlopes[right];
      wCount++;
    }
    while (left <= right && points[left].d < center - halfWindowKm) {
      wSum -= rawSlopes[left];
      left++;
      wCount--;
    }
    smoothSlopes[i] = wCount > 0 ? wSum / wCount : 0;
  }

  // Subsample to ≤100 points
  const maxPts = 100;
  const step = n <= maxPts ? 1 : Math.ceil(n / maxPts);
  const indices: number[] = [];
  for (let i = 0; i < n; i += step) indices.push(i);
  if (indices[indices.length - 1] !== n - 1) indices.push(n - 1);

  return indices.map((i) => ({
    dist: points[i].d,
    ele: points[i].e ?? 0,
    slope: Math.abs(smoothSlopes[i]),
    color: getSlopeColorHex(smoothSlopes[i]),
  }));
}

// ---------------------------------------------------------------------------
// Icons + styles
// ---------------------------------------------------------------------------

const SEGMENT_ICONS: Record<string, React.ReactNode> = {
  steepClimb: <TrendingUp className="h-4 w-4" />,
  steepDescent: <TrendingDown className="h-4 w-4" />,
  effort: <Activity className="h-4 w-4" />,
};

const SEGMENT_COLORS: Record<string, string> = {
  steepClimb: 'text-red-600 bg-red-500/10 border-red-200',
  steepDescent: 'text-orange-600 bg-orange-500/10 border-orange-200',
  effort: 'text-blue-600 bg-blue-500/10 border-blue-200',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrailHazards({
  trackProfile,
}: {
  trackProfile: TrackPoint[];
}) {
  const t = useTranslations('Hazards');

  const segments = useMemo(() => analyzeTrackSegments(trackProfile), [trackProfile]);

  if (segments.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
          <Zap className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-700" />
          <p className="text-sm italic text-slate-400 dark:text-slate-500">{t('noSegments')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {segments.map((seg, idx) => {
          const chartData = buildChartData(seg.points);
          if (chartData.length === 0) return null;

          const minEle = Math.min(...chartData.map((d) => d.ele));
          const maxEle = Math.max(...chartData.map((d) => d.ele));
          const eleRange = Math.max(maxEle - minEle, 1);
          const yMin = minEle - Math.max(10, eleRange * 0.12);
          const yMax = maxEle + Math.max(5, eleRange * 0.08);

          const maxSlopePoint = chartData.reduce(
            (prev, cur) => (cur.slope > prev.slope ? cur : prev),
            chartData[0],
          );

          const fillColor = seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b';

          return (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg border p-2 ${SEGMENT_COLORS[seg.type]}`}>
                    {SEGMENT_ICONS[seg.type]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                        {t(seg.type)}
                      </h4>
                      {seg.climbCategory && seg.climbCategory !== 'none' && (
                        <Badge variant="outline" className="h-4 px-1 text-[8px] font-bold">
                          CAT {seg.climbCategory}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                      km {seg.startDist.toFixed(1)} · {seg.lengthKm.toFixed(1)} km {t('distance')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="gap-1 font-mono text-[10px]">
                    <Activity className="h-3 w-3" />
                    {Math.round(seg.avgSlope)}% {t('avg')}
                  </Badge>
                  <span className="text-[9px] font-bold tabular-nums text-slate-400 dark:text-slate-500">
                    {Math.round(minEle)}m – {Math.round(maxEle)}m
                  </span>
                </div>
              </div>

              {/* Elevation mini-chart */}
              <div className="h-28 w-full cursor-crosshair">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id={`trail-grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                        {chartData.map((d, i) => (
                          <stop
                            key={i}
                            offset={`${(i / (chartData.length - 1)) * 100}%`}
                            stopColor={d.color}
                          />
                        ))}
                      </linearGradient>
                      <linearGradient id={`trail-fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={fillColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as ChartPoint;
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
                            <div className="flex min-w-[70px] flex-col gap-0.5">
                              <span className="font-mono text-[9px] text-slate-400">
                                km {d.dist.toFixed(2)}
                              </span>
                              <span className="flex items-center justify-between font-mono text-[10px] font-black text-slate-900 dark:text-white">
                                {Math.round(d.ele)}m
                                <span className="ml-2 rounded bg-slate-100 px-1 dark:bg-slate-800">
                                  {Math.round(d.slope)}%
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      }}
                      cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeOpacity: 0.2, strokeDasharray: '3 3' }}
                    />
                    <Area
                      type="linear"
                      dataKey="ele"
                      stroke={`url(#trail-grad-${idx})`}
                      strokeWidth={3}
                      fill={`url(#trail-fill-${idx})`}
                      isAnimationActive={false}
                      connectNulls
                    />
                    {(seg.type === 'steepClimb' || seg.type === 'steepDescent') && (
                      <ReferenceLine
                        x={maxSlopePoint.dist}
                        stroke="#991b1b"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                        label={{
                          value: `${Math.round(maxSlopePoint.slope)}%`,
                          position: 'top',
                          fill: '#991b1b',
                          fontSize: 8,
                          fontWeight: 'black',
                        }}
                      />
                    )}
                    <XAxis type="number" dataKey="dist" hide domain={[seg.startDist, seg.endDist]} />
                    <YAxis hide domain={[yMin, yMax]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">
                      {t('slope')}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {Math.round(seg.maxSlope)}% {t('max')}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">
                      {t('danger')}
                    </span>
                    <span className={`text-xs font-bold uppercase ${seg.dangerColor}`}>
                      {t(`levels.${seg.dangerLevel}`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
