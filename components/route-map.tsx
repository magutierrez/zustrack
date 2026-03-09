'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import Map, { NavigationControl, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2, Maximize2, Mountain, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

import { useMapLayers } from './route-map/use-map-layers';
import { MapMarkers } from './route-map/map-markers';
import { findNightPointIndex } from '@/lib/utils';
import { MapPopup } from './route-map/map-popup';
import { MapLegend } from './route-map/map-legend';
import { RouteLayers } from './route-map/route-layers';
import { LayerControl } from './route-map/layer-control';
import { useMapStyle, MapLayerType } from './route-map/use-map-style';
import { useMapView } from './route-map/use-map-view';
import { useMapTerrain } from './route-map/use-map-terrain';
import { RoutePlayer } from './route-map/route-player';
import { MapOverlayControls } from './route-map/map-overlay-controls';
import { useRouteStore } from '@/store/route-store';
import { useAnnotations } from '@/hooks/use-annotations';
import { findClosestPointIndex, projectOntoSegment, interpolatePointOnRoute } from '@/lib/geometry';
import { cn } from '@/lib/utils';

/**
 * Draws a chevron onto a canvas and registers it as an SDF image named
 * 'route-arrow'. SDF allows MapLibre to colourise the icon via `icon-color`
 * without needing a glyphs/font endpoint — works on all map styles.
 * Must be called on initial load and again after every style swap.
 */
function addArrowImage(map: maplibregl.Map) {
  const size = 35;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.11;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Chevron pointing right — MapLibre rotates it to follow the line
  ctx.beginPath();
  ctx.moveTo(size * 0.26, size * 0.18);
  ctx.lineTo(size * 0.68, size * 0.5);
  ctx.lineTo(size * 0.26, size * 0.82);
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  if (map.hasImage('route-arrow')) map.removeImage('route-arrow');
  map.addImage('route-arrow', imageData, { sdf: true });
}

interface RouteMapProps {
  onResetToFullRouteView?: (func: () => void) => void;
  isMobileFullscreen?: boolean;
  onToggleMobileFullscreen?: () => void;
}

export default function RouteMap({
  onResetToFullRouteView,
  isMobileFullscreen,
  onToggleMobileFullscreen,
}: RouteMapProps) {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const tMap = useTranslations('HomePage');
  const isMobile = useIsMobile();
  const mapRef = useRef<MapRef>(null);

  // Read all state from the store
  const gpxData = useRouteStore((s) => s.gpxData);
  const weatherPoints = useRouteStore((s) => s.weatherPoints);
  const selectedPointIndex = useRouteStore((s) => s.selectedPointIndex);
  const exactSelectedPoint = useRouteStore((s) => s.exactSelectedPoint);
  const chartHoverPoint = useRouteStore((s) => s.chartHoverPoint);
  const activeFilter = useRouteStore((s) => s.activeFilter);
  const selectedRange = useRouteStore((s) => s.selectedRange);
  const routeInfoData = useRouteStore((s) => s.routeInfoData);
  const activityType = useRouteStore((s) => s.fetchedActivityType);
  const showWaterSources = useRouteStore((s) => s.showWaterSources);
  const showNoCoverageZones = useRouteStore((s) => s.showNoCoverageZones);
  const showEscapePoints = useRouteStore((s) => s.showEscapePoints);
  const showMountainPeaks = useRouteStore((s) => s.showMountainPeaks);
  const mountainPeaks = useRouteStore((s) => s.mountainPeaks);
  const mountainPeaksLoaded = useRouteStore((s) => s.mountainPeaksLoaded);
  const mountainPeaksLoading = useRouteStore((s) => s.mountainPeaksLoading);
  const focusPoint = useRouteStore((s) => s.focusPoint);
  const clickedChartPointDist = useRouteStore((s) => s.clickedChartPointDist);
  const mapResetRequested = useRouteStore((s) => s.mapResetRequested);
  const savedRouteId = useRouteStore((s) => s.savedRouteId);
  const {
    setSelectedPointIndex,
    setExactSelectedPoint,
    clearSelection,
    setShowMountainPeaks,
    setMountainPeaks,
    setMountainPeaksLoading,
  } = useRouteStore();

  const { annotations, addAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations();

  const points = gpxData?.points || [];

  // When a range is selected (hazard segment or elevation zoom), play only that slice
  const playerPoints = useMemo(() => {
    if (!selectedRange || points.length === 0) return points;
    const filtered = points.filter(
      (p) => p.distanceFromStart >= selectedRange.start && p.distanceFromStart <= selectedRange.end,
    );
    return filtered.length >= 2 ? filtered : points;
  }, [points, selectedRange]);

  const nightPointIndex = useMemo(
    () => (weatherPoints.length > 0 ? findNightPointIndex(weatherPoints).index : null),
    [weatherPoints],
  );

  const noCoverageData = useMemo((): FeatureCollection | null => {
    if (!showNoCoverageZones || weatherPoints.length === 0 || points.length === 0) return null;

    // Build distance ranges from the sparse weather points.
    // Each weather point "owns" from the midpoint with its predecessor to the midpoint with its successor.
    const ranges: { start: number; end: number; weight: number }[] = [];
    for (let i = 0; i < weatherPoints.length; i++) {
      const wp = weatherPoints[i];
      if (wp.mobileCoverage !== 'none' && wp.mobileCoverage !== 'low') continue;
      const d = wp.point.distanceFromStart;
      const prev = i > 0 ? weatherPoints[i - 1].point.distanceFromStart : d;
      const next = i < weatherPoints.length - 1 ? weatherPoints[i + 1].point.distanceFromStart : d;
      ranges.push({
        start: (d + prev) / 2,
        end: (d + next) / 2,
        weight: wp.mobileCoverage === 'none' ? 1.0 : 0.5,
      });
    }
    if (ranges.length === 0) return null;

    // Merge overlapping / adjacent ranges
    ranges.sort((a, b) => a.start - b.start);
    const merged: typeof ranges = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
        last.weight = Math.max(last.weight, r.weight);
      } else {
        merged.push({ ...r });
      }
    }

    // Use the dense GPX points so the heatmap flows continuously along the route shape.
    const features: Feature[] = [];
    for (const p of points) {
      const range = merged.find(
        (r) => p.distanceFromStart >= r.start && p.distanceFromStart <= r.end,
      );
      if (!range) continue;
      features.push({
        type: 'Feature',
        properties: { weight: range.weight },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      });
    }

    return features.length > 0 ? { type: 'FeatureCollection', features } : null;
  }, [showNoCoverageZones, weatherPoints, points]);

  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapType, setMapType] = useState<MapLayerType>('standard');
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const geolocateControlRef = useRef<maplibregl.GeolocateControl | null>(null);

  const mapStyle = useMapStyle(mapType, resolvedTheme);

  // During playback switch to MapTiler satellite for the Strava-like 3-D flyover.
  // When the player stops, mapStyle reverts to the user's selected layer.
  const effectiveMapStyle = isPlayerActive
    ? `https://api.maptiler.com/maps/satellite/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
    : mapStyle;

  const { syncTerrain } = useMapTerrain(mapRef, effectiveMapStyle, isPlayerActive);

  const { routeData, highlightedData, rangeHighlightData } = useMapLayers(
    points,
    weatherPoints.length > 0 ? weatherPoints : undefined,
    activeFilter,
    selectedRange,
    routeInfoData,
  );

  const { resetToFullRouteView } = useMapView(mapRef, points, selectedRange);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (onResetToFullRouteView) {
      onResetToFullRouteView(resetToFullRouteView);
    }
  }, [onResetToFullRouteView, resetToFullRouteView]);

  // Reset map to full-route view when requested from the store (e.g. mobile "show on map" buttons)
  useEffect(() => {
    if (mapResetRequested > 0) resetToFullRouteView();
  }, [mapResetRequested, resetToFullRouteView]);

  // Fetch mountain peaks lazily when the toggle is first activated
  useEffect(() => {
    if (!showMountainPeaks || mountainPeaksLoaded || mountainPeaksLoading || points.length === 0)
      return;

    let north = -Infinity, south = Infinity, east = -Infinity, west = Infinity;
    for (const p of points) {
      if (p.lat > north) north = p.lat;
      if (p.lat < south) south = p.lat;
      if (p.lon > east) east = p.lon;
      if (p.lon < west) west = p.lon;
    }
    // Add ~3 km padding so peaks just outside the track are also shown
    const PAD = 0.03;
    const bbox = { north: north + PAD, south: south - PAD, east: east + PAD, west: west - PAD };

    setMountainPeaksLoading(true);
    fetch('/api/mountain-peaks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bbox }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMountainPeaks(data.peaks ?? []);
      })
      .catch(() => {
        setMountainPeaksLoading(false);
      });
  }, [showMountainPeaks, mountainPeaksLoaded, mountainPeaksLoading, points, setMountainPeaks, setMountainPeaksLoading]);

  const handleStopPlayer = useCallback(() => {
    setIsPlayerActive(false);
    const map = mapRef.current?.getMap();
    if (map) {
      map.jumpTo({ pitch: 0, bearing: 0 });
    }
    resetToFullRouteView();
  }, [resetToFullRouteView]);

  // Build locale-aware name expression for MapLibre symbol layers.
  // Kept in a ref so the stable applyMapLanguage callback always reads the latest value.
  const langExpression = useMemo(() => {
    if (locale === 'ca')
      return [
        'coalesce',
        ['get', 'name:ca'],
        ['get', 'name:es'],
        ['get', 'name:latin'],
        ['get', 'name'],
      ];
    if (locale === 'es')
      return ['coalesce', ['get', 'name:es'], ['get', 'name:latin'], ['get', 'name']];
    return ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
  }, [locale]);
  const langExpressionRef = useRef(langExpression);
  useEffect(() => {
    langExpressionRef.current = langExpression;
  }, [langExpression]);

  const applyMapLanguage = useCallback((map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) return;
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'symbol' && (layer.layout as any)?.['text-field']) {
        try {
          map.setLayoutProperty(layer.id, 'text-field', langExpressionRef.current);
        } catch {
          /* layer may not support text-field */
        }
      }
    }
  }, []);

  const onMapLoad = useCallback(
    (event: any) => {
      const map: maplibregl.Map = event.target;
      addArrowImage(map);
      syncTerrain();
      applyMapLanguage(map);
      map.on('styledata', syncTerrain);
      map.on('style.load', () => {
        addArrowImage(map);
        applyMapLanguage(map);
      });

      // Add native GeolocateControl so it integrates directly with the maplibre-gl instance
      if (!geolocateControlRef.current) {
        geolocateControlRef.current = new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showAccuracyCircle: true,
          showUserLocation: true,
        });
        map.addControl(geolocateControlRef.current, 'bottom-right');
      }

      resetToFullRouteView();
    },
    [syncTerrain, applyMapLanguage, resetToFullRouteView],
  );

  const [manualPopupInfo, setManualPopupInfo] = useState<any>(null);

  const onMapClick = useCallback(
    (event: any) => {
      const feature = event.features?.[0];
      if (feature) {
        setSelectedPointIndex(feature.properties.index);
        setManualPopupInfo(null); // Let the store selection handle it
        return;
      }

      const { lng, lat } = event.lngLat;
      if (points.length === 0) return;

      let minDist = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const d = (p.lon - lng) ** 2 + (p.lat - lat) ** 2;
        if (d < minDist) {
          minDist = d;
          closestIdx = i;
        }
      }

      const projectOntoSegment = (i: number) => {
        if (i < 0 || i >= points.length - 1) return null;
        const p1 = points[i];
        const p2 = points[i + 1];
        const dx = p2.lon - p1.lon;
        const dy = p2.lat - p1.lat;
        const lenSq = dx * dx + dy * dy;
        const t =
          lenSq > 0
            ? Math.max(0, Math.min(1, ((lng - p1.lon) * dx + (lat - p1.lat) * dy) / lenSq))
            : 0;

        const distDiff = (p2.distanceFromStart - p1.distanceFromStart) * 1000;
        const eleDiff = (p2.ele || 0) - (p1.ele || 0);
        const slope = distDiff > 0.1 ? (eleDiff / distDiff) * 100 : 0;

        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const toDeg = (rad: number) => (rad * 180) / Math.PI;
        const lat1 = toRad(p1.lat);
        const lat2 = toRad(p2.lat);
        const dLon = toRad(p2.lon - p1.lon);
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x =
          Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

        return {
          point: {
            lat: p1.lat + t * dy,
            lon: p1.lon + t * dx,
            ele: (p1.ele || 0) + t * ((p2.ele || 0) - (p1.ele || 0)),
            distanceFromStart:
              p1.distanceFromStart + t * (p2.distanceFromStart - p1.distanceFromStart),
            estimatedTime:
              p1.estimatedTime && p2.estimatedTime
                ? new Date(
                    p1.estimatedTime.getTime() +
                      t * (p2.estimatedTime.getTime() - p1.estimatedTime.getTime()),
                  )
                : undefined,
            slope: slope,
          },
          bearing: bearing,
        };
      };

      const segBefore = projectOntoSegment(closestIdx - 1);
      const segAfter = projectOntoSegment(closestIdx);
      const interpolated = (segBefore ?? segAfter)?.point ?? points[closestIdx];

      const weatherIdx = Math.min(
        Math.floor(
          (interpolated.distanceFromStart / points[points.length - 1].distanceFromStart) *
            weatherPoints.length,
        ),
        weatherPoints.length - 1,
      );

      const weatherInfo = weatherPoints[weatherIdx] || {
        weather: { temperature: 0, weatherCode: 0, windSpeed: 0, time: new Date().toISOString() },
        windEffect: 'tailwind',
        solarIntensity: 'moderate',
      };

      // Clear selection first
      setSelectedPointIndex(null);

      setManualPopupInfo({
        point: interpolated,
        weather: weatherInfo.weather,
        index: -1, // Custom point
        bearing: (segBefore ?? segAfter)?.bearing || 0,
        windEffect: weatherInfo.windEffect,
        solarIntensity: weatherInfo.solarIntensity,
      });
    },
    [points, weatherPoints, setSelectedPointIndex],
  );

  const onMapMouseMove = useCallback(
    (e: any) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const activeLayers = ['route-hover-target', 'highlight-line', 'range-line'].filter((id) =>
        map.getLayer(id),
      );

      if (activeLayers.length === 0) {
        setExactSelectedPoint(null);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: activeLayers });

      if (features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';

        const { lng, lat } = e.lngLat;

        if (points.length === 0) return;

        // 1. Find closest point index (O(n) pass)
        const closestIdx = findClosestPointIndex(points, lat, lng);

        // 2. Project mouse onto the two segments adjacent to closestIdx
        //    and pick the projection with smallest distance to mouse
        const segBefore = projectOntoSegment(points, closestIdx - 1, lat, lng);
        const segAfter = projectOntoSegment(points, closestIdx, lat, lng);

        let interpolated;
        if (segBefore && segAfter) {
          interpolated = segBefore.distSq <= segAfter.distSq ? segBefore.point : segAfter.point;
        } else {
          interpolated = (segBefore ?? segAfter)?.point ?? points[closestIdx];
        }

        setExactSelectedPoint(interpolated);
      } else {
        map.getCanvas().style.cursor = '';
        setExactSelectedPoint(null);
      }
    },
    [setExactSelectedPoint, points],
  );

  const onMapMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = '';
    setExactSelectedPoint(null);
  }, [setExactSelectedPoint]);

  const popupInfo = useMemo(() => {
    const idx = hoveredPointIdx !== null ? hoveredPointIdx : selectedPointIndex;
    if (idx !== null && weatherPoints?.[idx]) return { ...weatherPoints[idx], index: idx };
    return null;
  }, [hoveredPointIdx, selectedPointIndex, weatherPoints]);

  useEffect(() => {
    if (focusPoint) {
      const map = mapRef.current?.getMap();
      if (map) {
        map.flyTo({ center: [focusPoint.lon, focusPoint.lat], zoom: 14, duration: 2000 });
        if (focusPoint.silent) return;

        const weatherIdx = weatherPoints.findIndex(
          (wp) =>
            Math.abs(wp.point.lat - focusPoint.lat) < 0.0001 &&
            Math.abs(wp.point.lon - focusPoint.lon) < 0.0001,
        );

        if (weatherIdx !== -1) {
          const wp = weatherPoints[weatherIdx];

          let bearing = 0;
          if (weatherIdx < weatherPoints.length - 1) {
            const p1 = wp.point;
            const p2 = weatherPoints[weatherIdx + 1].point;
            const toRad = (deg: number) => (deg * Math.PI) / 180;
            const toDeg = (rad: number) => (rad * 180) / Math.PI;
            const lat1 = toRad(p1.lat);
            const lat2 = toRad(p2.lat);
            const dLon = toRad(p2.lon - p1.lon);
            const y = Math.sin(dLon) * Math.cos(lat2);
            const x =
              Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
            bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
          }

          let slope = 0;
          if (weatherIdx > 0) {
            const prev = weatherPoints[weatherIdx - 1];
            const distDiff = (wp.point.distanceFromStart - prev.point.distanceFromStart) * 1000;
            const eleDiff = (wp.point.ele || 0) - (prev.point.ele || 0);
            if (distDiff > 0.1) slope = (eleDiff / distDiff) * 100;
          }

          // eslint-disable-next-line react-hooks/set-state-in-effect
          setManualPopupInfo({
            point: { ...wp.point, slope },
            weather: wp.weather,
            index: weatherIdx,
            bearing: bearing,
            windEffect: wp.windEffect,
            solarIntensity: wp.solarIntensity,
          });
          setHoveredPointIdx(null);
        }
      }
    }
  }, [focusPoint, weatherPoints]);

  // Handle chart click exact point popup
  useEffect(() => {
    if (clickedChartPointDist !== null && points.length > 0) {
      const interpolatedPoint = interpolatePointOnRoute(points, clickedChartPointDist);
      if (!interpolatedPoint) return;

      // Find closest segment for bearing and slope
      let closestIdx = 0;
      for (let i = 0; i < points.length - 1; i++) {
        if (
          points[i].distanceFromStart <= clickedChartPointDist &&
          points[i + 1].distanceFromStart >= clickedChartPointDist
        ) {
          closestIdx = i;
          break;
        }
      }

      const p1 = points[closestIdx];
      const p2 = points[closestIdx + 1] || p1;

      const distDiff = (p2.distanceFromStart - p1.distanceFromStart) * 1000;
      const eleDiff = (p2.ele || 0) - (p1.ele || 0);
      const slope = distDiff > 0.1 ? (eleDiff / distDiff) * 100 : 0;

      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const toDeg = (rad: number) => (rad * 180) / Math.PI;
      const lat1 = toRad(p1.lat);
      const lat2 = toRad(p2.lat);
      const dLon = toRad(p2.lon - p1.lon);
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

      const weatherIdx = Math.min(
        Math.floor(
          (interpolatedPoint.distanceFromStart / points[points.length - 1].distanceFromStart) *
            weatherPoints.length,
        ),
        weatherPoints.length - 1,
      );

      const weatherInfo = weatherPoints[weatherIdx] || {
        weather: { temperature: 0, weatherCode: 0, windSpeed: 0, time: new Date().toISOString() },
        windEffect: 'tailwind',
        solarIntensity: 'moderate',
      };

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setManualPopupInfo({
        point: { ...interpolatedPoint, slope },
        weather: weatherInfo.weather,
        index: -1,
        bearing: bearing,
        windEffect: weatherInfo.windEffect,
        solarIntensity: weatherInfo.solarIntensity,
      });
      setHoveredPointIdx(null);
    }
  }, [clickedChartPointDist, points, weatherPoints]);

  // On mobile fullscreen, pan (no zoom change) to track the chart-hover point
  useEffect(() => {
    if (!isMobileFullscreen || !chartHoverPoint) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({ center: [chartHoverPoint.lon, chartHoverPoint.lat], duration: 150 });
  }, [chartHoverPoint, isMobileFullscreen]);

  const activePopupData = useMemo(() => {
    if (manualPopupInfo) return manualPopupInfo;
    return popupInfo;
  }, [manualPopupInfo, popupInfo]);

  const activePopupAnnotation = useMemo(() => {
    if (!activePopupData || annotations.length === 0) return null;
    const { lat, lon } = activePopupData.point;
    return (
      annotations.find(
        (a) => Math.abs(a.lat - lat) < 0.00001 && Math.abs(a.lon - lon) < 0.00001,
      ) ?? null
    );
  }, [activePopupData, annotations]);

  const handleClosePopup = useCallback(() => {
    setManualPopupInfo(null);
    setHoveredPointIdx(null);
    setSelectedPointIndex(null);
  }, [setSelectedPointIndex]);

  const initialViewState = useMemo(() => {
    if (points && points.length > 0) {
      return { longitude: points[0].lon, latitude: points[0].lat, zoom: 10 };
    }
    return { longitude: -3.7038, latitude: 40.4168, zoom: 5 };
  }, [points]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        'border-border relative h-full w-full overflow-hidden border',
        isMobileFullscreen && 'mobile-fullscreen-map',
      )}
    >
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={effectiveMapStyle as any}
        onClick={onMapClick}
        onLoad={onMapLoad}
        onMouseMove={onMapMouseMove}
        onMouseLeave={onMapMouseLeave}
        dragRotate={true}
        touchZoomRotate={true}
      >
        <NavigationControl position="bottom-right" />

        <RouteLayers
          mapType={mapType}
          routeData={routeData}
          highlightedData={highlightedData}
          rangeHighlightData={rangeHighlightData}
          activeFilter={activeFilter}
          selectedRange={selectedRange}
          noCoverageData={noCoverageData}
        />

        <MapMarkers
          points={points}
          weatherPoints={weatherPoints.length > 0 ? weatherPoints : undefined}
          selectedPointIndex={selectedPointIndex}
          fullSelectedPointIndex={null}
          exactSelectedPoint={chartHoverPoint || exactSelectedPoint}
          activeFilter={activeFilter}
          onPointSelect={setSelectedPointIndex}
          onHoverPoint={setHoveredPointIdx}
          activityType={activityType ?? undefined}
          showWaterSources={showWaterSources}
          showEscapePoints={showEscapePoints}
          showMountainPeaks={showMountainPeaks}
          mountainPeaks={mountainPeaks}
          focusPoint={focusPoint}
          nightPointIndex={nightPointIndex}
          annotations={annotations}
          onAnnotationEdit={updateAnnotation}
          onAnnotationDelete={deleteAnnotation}
        />

        {activePopupData && !isMobile && (
          <MapPopup
            key={`popup-${activePopupData.index}-${activePopupData.point.lat}-${activePopupData.point.lon}`}
            popupInfo={activePopupData}
            onClose={handleClosePopup}
            savedRouteId={savedRouteId}
            currentAnnotation={activePopupAnnotation}
            onSaveAnnotation={(text) =>
              addAnnotation(
                activePopupData.point.lat,
                activePopupData.point.lon,
                activePopupData.point.distanceFromStart,
                text,
              )
            }
            onUpdateAnnotation={updateAnnotation}
            onDeleteAnnotation={deleteAnnotation}
          />
        )}

        {isPlayerActive && (
          <RoutePlayer points={playerPoints} mapRef={mapRef} onStop={handleStopPlayer} />
        )}
      </Map>

      <MapOverlayControls
        isPlayerActive={isPlayerActive}
        pointsCount={points.length}
        selectedRange={selectedRange}
        activeFilter={activeFilter}
        onStartPlayer={() => setIsPlayerActive(true)}
        onClearSelection={() => {
          clearSelection();
          resetToFullRouteView();
        }}
      />

      {/* Mobile: popup fixed at top */}
      {activePopupData && isMobile && (
        <MapPopup
          key={`popup-mobile-${activePopupData.index}-${activePopupData.point.lat}-${activePopupData.point.lon}`}
          popupInfo={activePopupData}
          onClose={handleClosePopup}
          mobileMode
          savedRouteId={savedRouteId}
          currentAnnotation={activePopupAnnotation}
          onSaveAnnotation={(text) =>
            addAnnotation(
              activePopupData.point.lat,
              activePopupData.point.lon,
              activePopupData.point.distanceFromStart,
              text,
            )
          }
          onUpdateAnnotation={updateAnnotation}
          onDeleteAnnotation={deleteAnnotation}
        />
      )}

      {/* Fullscreen toggle button — mobile only, hidden when popup active */}
      {onToggleMobileFullscreen && !(isMobile && activePopupData) && (
        <button
          onClick={onToggleMobileFullscreen}
          className="border-border bg-background/80 absolute top-3 right-3 z-20 rounded-lg border p-2 shadow-md backdrop-blur-sm lg:hidden"
          aria-label={isMobileFullscreen ? tMap('collapseMap') : tMap('expandMap')}
        >
          {isMobileFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}

      {/* Layer selector — shifted below fullscreen button on mobile, hidden when popup active */}
      {!(isMobile && activePopupData) && <LayerControl mapType={mapType} setMapType={setMapType} />}

      {/* Mountain peaks toggle — only for hiking, positioned below layer control */}
      {!(isMobile && activePopupData) && points.length > 0 && activityType === 'walking' && (
        <div className="absolute top-[calc(3.5rem+2.75rem+0.25rem)] right-3 z-10 lg:top-[calc(3rem+2.75rem+0.25rem)]">
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              'h-10 w-10 shadow-md',
              showMountainPeaks && !mountainPeaksLoading && 'ring-primary ring-2',
            )}
            onClick={() => setShowMountainPeaks(!showMountainPeaks)}
            disabled={mountainPeaksLoading}
            aria-label={tMap(showMountainPeaks ? 'mountainPeaksHide' : 'mountainPeaksShow')}
            title={tMap(showMountainPeaks ? 'mountainPeaksHide' : 'mountainPeaksShow')}
          >
            {mountainPeaksLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Mountain className="h-5 w-5" />
            )}
          </Button>
        </div>
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
        .weather-popup .maplibregl-popup-content {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          color: var(--foreground) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
        }
      `}</style>

      {weatherPoints && weatherPoints.length > 0 && !(isMobile && activePopupData) && <MapLegend />}
    </div>
  );
}
