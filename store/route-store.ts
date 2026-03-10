import { create } from 'zustand';
import type { Annotation, GPXData, MountainPeak, RouteConfig, RouteWeatherPoint } from '@/lib/types';

export type ActiveFilter = {
  key: 'pathType' | 'surface' | 'hazard';
  value: string;
} | null;

interface RouteState {
  // ── UI / Map state ──────────────────────────────────────────────────────────
  activeFilter: ActiveFilter;
  selectedRange: { start: number; end: number } | null;
  /** Set by map hover → chart reads it to show the reference line */
  exactSelectedPoint: any | null;
  /** Set by chart hover → map reads it to show the cursor dot */
  chartHoverPoint: any | null;
  /** Set by chart click → map reads it to show the exact popup */
  clickedChartPointDist: number | null;
  focusPoint: { lat: number; lon: number; name?: string; silent?: boolean } | null;
  showWaterSources: boolean;
  showNoCoverageZones: boolean;
  showEscapePoints: boolean;
  showMountainPeaks: boolean;
  mountainPeaks: MountainPeak[];
  mountainPeaksLoaded: boolean;
  mountainPeaksLoading: boolean;
  show3DTerrain: boolean;
  selectedPointIndex: number | null;
  isMobileFullscreen: boolean;
  /** When set, mobile elevation chart shows only this hazard segment */
  mobileHazardRange: { startDist: number; endDist: number } | null;
  /** Incremented to request that the map resets to full-route view */
  mapResetRequested: number;
  config: RouteConfig;

  // ── Fetched route data (set by home-page-client from DB) ────────────────────
  savedRouteId: string | null;
  fetchedRawGpxContent: string | null;
  fetchedGpxFileName: string | null;
  fetchedActivityType: 'cycling' | 'walking' | null;
  initialDistance: number;
  initialElevationGain: number;
  initialElevationLoss: number;
  /** When set, prevents the pipeline from recalculating these metrics (used for shared routes) */
  lockedMetrics: { distance: number; gain: number; loss: number } | null;

  // ── Analysis results (managed by useRouteAnalysis hook) ─────────────────────
  gpxData: GPXData | null;
  gpxFileName: string | null;
  rawGPXContent: string | null;
  weatherPoints: RouteWeatherPoint[];
  elevationData: { distance: number; elevation: number }[];
  routeInfoData: any[];
  isLoading: boolean;
  isRouteInfoLoading: boolean;
  error: string | null;
  recalculatedElevationGain: number;
  recalculatedElevationLoss: number;
  recalculatedTotalDistance: number;
  isWeatherAnalyzed: boolean;
  bestWindows: any[];
  isFindingWindow: boolean;
  annotations: Annotation[];

  // ── Actions ─────────────────────────────────────────────────────────────────
  setActiveFilter: (filter: ActiveFilter) => void;
  setSelectedRange: (range: { start: number; end: number } | null) => void;
  setExactSelectedPoint: (point: any | null) => void;
  setChartHoverPoint: (point: any | null) => void;
  setClickedChartPointDist: (dist: number | null) => void;
  setFocusPoint: (
    point: { lat: number; lon: number; name?: string; silent?: boolean } | null,
  ) => void;
  setShowWaterSources: (show: boolean) => void;
  setShowNoCoverageZones: (show: boolean) => void;
  setShowEscapePoints: (show: boolean) => void;
  setShowMountainPeaks: (show: boolean) => void;
  setShow3DTerrain: (show: boolean) => void;
  setMountainPeaks: (peaks: MountainPeak[]) => void;
  setMountainPeaksLoading: (loading: boolean) => void;
  setSelectedPointIndex: (index: number | null) => void;
  setConfig: (config: RouteConfig) => void;
  setFetchedRoute: (data: {
    rawGpxContent: string;
    gpxFileName: string;
    activityType: 'cycling' | 'walking';
    distance: number;
    elevationGain: number;
    elevationLoss: number;
  }) => void;
  setSavedRouteId: (id: string | null) => void;
  setLockedMetrics: (metrics: { distance: number; gain: number; loss: number } | null) => void;
  setIsMobileFullscreen: (v: boolean) => void;
  setMobileHazardRange: (range: { startDist: number; endDist: number } | null) => void;
  requestMapReset: () => void;
  clearSelection: () => void;
  reset: () => void;

  // Analysis state setters (used internally by useRouteAnalysis hook)
  setGpxData: (data: GPXData | null) => void;
  setGpxFileName: (name: string | null) => void;
  setRawGPXContent: (content: string | null) => void;
  setWeatherPoints: (points: RouteWeatherPoint[]) => void;
  setElevationData: (data: { distance: number; elevation: number }[]) => void;
  setRouteInfoData: (data: any[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsRouteInfoLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRecalculatedElevationGain: (gain: number) => void;
  setRecalculatedElevationLoss: (loss: number) => void;
  setRecalculatedTotalDistance: (distance: number) => void;
  setIsWeatherAnalyzed: (analyzed: boolean) => void;
  setBestWindows: (windows: any[]) => void;
  setIsFindingWindow: (finding: boolean) => void;
  setAnnotations: (annotations: Annotation[]) => void;
}

function getDefaultDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

const initialState = {
  activeFilter: null as ActiveFilter,
  selectedRange: null as { start: number; end: number } | null,
  exactSelectedPoint: null,
  chartHoverPoint: null,
  clickedChartPointDist: null as number | null,
  focusPoint: null as { lat: number; lon: number; name?: string; silent?: boolean } | null,
  showWaterSources: false,
  showNoCoverageZones: false,
  showEscapePoints: false,
  showMountainPeaks: false,
  show3DTerrain: false,
  mountainPeaks: [] as MountainPeak[],
  mountainPeaksLoaded: false,
  mountainPeaksLoading: false,
  selectedPointIndex: null as number | null,
  isMobileFullscreen: false,
  mobileHazardRange: null as { startDist: number; endDist: number } | null,
  mapResetRequested: 0,
  config: { date: getDefaultDate(), time: '08:00', speed: 25 } as RouteConfig,

  savedRouteId: null as string | null,
  fetchedRawGpxContent: null as string | null,
  fetchedGpxFileName: null as string | null,
  fetchedActivityType: null as 'cycling' | 'walking' | null,
  initialDistance: 0,
  initialElevationGain: 0,
  initialElevationLoss: 0,
  lockedMetrics: null as { distance: number; gain: number; loss: number } | null,

  gpxData: null as GPXData | null,
  gpxFileName: null as string | null,
  rawGPXContent: null as string | null,
  weatherPoints: [] as RouteWeatherPoint[],
  elevationData: [] as { distance: number; elevation: number }[],
  routeInfoData: [] as any[],
  isLoading: false,
  isRouteInfoLoading: false,
  error: null as string | null,
  recalculatedElevationGain: 0,
  recalculatedElevationLoss: 0,
  recalculatedTotalDistance: 0,
  isWeatherAnalyzed: false,
  bestWindows: [] as any[],
  isFindingWindow: false,
  annotations: [] as Annotation[],
};

const getSmartDefaultSpeed = (
  activity: 'cycling' | 'walking' | null,
  elevationGain: number,
  distance: number,
) => {
  if (activity === 'walking') {
    // Hiking logic
    const slope = distance > 0 ? (elevationGain / (distance * 1000)) * 100 : 0;
    if (slope > 8) return 2; // Very steep
    if (slope > 5) return 3; // Steep
    if (slope > 2) return 4; // Moderate
    return 5; // Flat/easy
  }

  // Cycling logic
  const slope = distance > 0 ? (elevationGain / (distance * 1000)) * 100 : 0;
  if (slope > 5) return 15; // Mountain/Steep
  if (slope > 2) return 20; // Hilly
  return 25; // Flat/Road
};

export const useRouteStore = create<RouteState>()((set) => ({
  ...initialState,

  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSelectedRange: (range) => set({ selectedRange: range }),
  setExactSelectedPoint: (point) => set({ exactSelectedPoint: point }),
  setChartHoverPoint: (point) => set({ chartHoverPoint: point }),
  setClickedChartPointDist: (dist) => set({ clickedChartPointDist: dist }),
  setFocusPoint: (point) => set({ focusPoint: point }),
  setShowWaterSources: (show) => set({ showWaterSources: show }),
  setShowNoCoverageZones: (show) => set({ showNoCoverageZones: show }),
  setShowEscapePoints: (show) => set({ showEscapePoints: show }),
  setShowMountainPeaks: (show) => set({ showMountainPeaks: show }),
  setShow3DTerrain: (show) => set({ show3DTerrain: show }),
  setMountainPeaks: (peaks) => set({ mountainPeaks: peaks, mountainPeaksLoaded: true, mountainPeaksLoading: false }),
  setMountainPeaksLoading: (loading) => set({ mountainPeaksLoading: loading }),
  setSelectedPointIndex: (index) => set({ selectedPointIndex: index }),
  setConfig: (config) => set({ config }),

  setFetchedRoute: ({
    rawGpxContent,
    gpxFileName,
    activityType,
    distance,
    elevationGain,
    elevationLoss,
  }) =>
    set((state) => {
      // Calculate smart speed based on activity and terrain
      const newSpeed = getSmartDefaultSpeed(activityType, elevationGain, distance);

      return {
        fetchedRawGpxContent: rawGpxContent,
        fetchedGpxFileName: gpxFileName,
        fetchedActivityType: activityType,
        initialDistance: distance,
        initialElevationGain: elevationGain,
        initialElevationLoss: elevationLoss,
        config: { ...state.config, speed: newSpeed },
      };
    }),

  setSavedRouteId: (id) => set({ savedRouteId: id }),
  setLockedMetrics: (metrics) => set({ lockedMetrics: metrics }),
  setIsMobileFullscreen: (v) => set({ isMobileFullscreen: v }),
  setMobileHazardRange: (range) => set({ mobileHazardRange: range }),
  requestMapReset: () => set((s) => ({ mapResetRequested: s.mapResetRequested + 1 })),
  clearSelection: () => set({ selectedRange: null, activeFilter: null }),
  reset: () =>
    set((state) => ({
      ...initialState,
      config: {
        ...initialState.config,
        date: getDefaultDate(),
        // Keep using smart speed if we have activity info, otherwise fallback to defaults
        speed: state.fetchedActivityType
          ? getSmartDefaultSpeed(
              state.fetchedActivityType,
              state.initialElevationGain,
              state.initialDistance,
            )
          : 25,
      },
    })),

  setGpxData: (data) => set({ gpxData: data }),
  setGpxFileName: (name) => set({ gpxFileName: name }),
  setRawGPXContent: (content) => set({ rawGPXContent: content }),
  setWeatherPoints: (points) => set({ weatherPoints: points }),
  setElevationData: (data) => set({ elevationData: data }),
  setRouteInfoData: (data) => set({ routeInfoData: data }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsRouteInfoLoading: (loading) => set({ isRouteInfoLoading: loading }),
  setError: (error) => set({ error }),
  setRecalculatedElevationGain: (gain) => set({ recalculatedElevationGain: gain }),
  setRecalculatedElevationLoss: (loss) => set({ recalculatedElevationLoss: loss }),
  setRecalculatedTotalDistance: (distance) => set({ recalculatedTotalDistance: distance }),
  setIsWeatherAnalyzed: (analyzed) => set({ isWeatherAnalyzed: analyzed }),
  setBestWindows: (windows) => set({ bestWindows: windows }),
  setIsFindingWindow: (finding) => set({ isFindingWindow: finding }),
  setAnnotations: (annotations) => set({ annotations }),
}));
