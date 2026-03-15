'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import Map, { NavigationControl, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2, Maximize2, Mountain, MountainSnow, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

import { useMapLayers } from './route-map/use-map-layers';
import { MapMarkers } from './route-map/map-markers';
import { findNightPointIndex } from '@/lib/utils';
import { MapPopup } from './route-map/map-popup';
import { MapLegend } from './route-map/map-legend';
import { RouteLayers } from './route-map/route-layers';
import { LayerControl } from './route-map/layer-control';
import { useMapStyle } from './route-map/use-map-style';
import { useMapView } from './route-map/use-map-view';
import { useMapTerrain } from './route-map/use-map-terrain';
import { RoutePlayer } from './route-map/route-player';
import { MapOverlayControls } from './route-map/map-overlay-controls';
import { useRouteStore } from '@/store/route-store';
import { useAnnotations } from '@/hooks/use-annotations';
import { cn } from '@/lib/utils';
import { useMountainPeaks } from './route-map/use-mountain-peaks';
import { useMapInteractions } from './route-map/use-map-interactions';

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
  const mountainPeaksLoading = useRouteStore((s) => s.mountainPeaksLoading);
  const show3DTerrain = useRouteStore((s) => s.show3DTerrain);
  const focusPoint = useRouteStore((s) => s.focusPoint);
  const mapResetRequested = useRouteStore((s) => s.mapResetRequested);
  const savedRouteId = useRouteStore((s) => s.savedRouteId);
  const mapType = useRouteStore((s) => s.mapLayerType);
  const {
    setSelectedPointIndex,
    setMapLayerType: setMapType,
    clearSelection,
    setShowMountainPeaks,
    setShow3DTerrain,
  } = useRouteStore();

  const { annotations, addAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations();

  const points = gpxData?.points || [];

  useMountainPeaks({ showMountainPeaks, points });

  const {
    onMapClick,
    onMapMouseMove,
    onMapMouseLeave,
    onHoverPoint,
    activePopupData,
    activePopupAnnotation,
    handleClosePopup,
  } = useMapInteractions({
    mapRef,
    points,
    weatherPoints,
    annotations,
    isMobileFullscreen,
  });

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

  const [mounted, setMounted] = useState(false);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const geolocateControlRef = useRef<maplibregl.GeolocateControl | null>(null);

  const mapStyle = useMapStyle(mapType, resolvedTheme);

  // During playback switch to MapTiler satellite for the Strava-like 3-D flyover.
  // When the player stops, mapStyle reverts to the user's selected layer.
  const effectiveMapStyle = isPlayerActive
    ? `https://api.maptiler.com/maps/satellite/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
    : mapStyle;

  const { syncTerrain, terrainLoading, terrainJustLoaded } = useMapTerrain(
    mapRef,
    effectiveMapStyle,
    isPlayerActive,
    show3DTerrain,
  );

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
      {/* Terrain loading overlay — scan effect from bottom while DEM tiles load */}
      {terrainLoading && (
        <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
          <div
            className="absolute inset-x-0 bottom-0 h-3/4 animate-[terrain-pulse_2s_ease-in-out_infinite]"
            style={{
              background:
                'linear-gradient(to top, rgba(34,197,94,0.18) 0%, rgba(234,179,8,0.08) 45%, transparent 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 h-[3px] animate-[terrain-scanline_2.2s_ease-in_infinite]"
            style={{
              background:
                'linear-gradient(to right, transparent 0%, rgba(34,197,94,0.7) 30%, rgba(234,179,8,0.9) 50%, rgba(34,197,94,0.7) 70%, transparent 100%)',
              boxShadow: '0 0 12px 3px rgba(34,197,94,0.4)',
            }}
          />
        </div>
      )}
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
          onHoverPoint={onHoverPoint}
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

      {/* 3D terrain + mountain peaks toggles */}
      {!(isMobile && activePopupData) && points.length > 0 && (
        <div className="absolute top-[calc(3.5rem+2.75rem+0.25rem)] right-3 z-10 lg:top-[calc(3rem+2.75rem+0.25rem)] flex flex-col gap-1">
          <Button
            variant={show3DTerrain ? 'default' : 'secondary'}
            size="icon"
            className="h-10 w-10 shadow-md"
            disabled={terrainLoading}
            onClick={() => {
              const next = !show3DTerrain;
              setShow3DTerrain(next);
              mapRef.current?.getMap()?.easeTo({ pitch: next ? 60 : 0, duration: 800 });
            }}
            aria-label={tMap(show3DTerrain ? 'terrain3DHide' : 'terrain3DShow')}
            title={tMap(show3DTerrain ? 'terrain3DHide' : 'terrain3DShow')}
          >
            {terrainLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MountainSnow
                className={cn(
                  'h-5 w-5',
                  terrainJustLoaded && 'animate-[pop-in_0.4s_cubic-bezier(0.16,1,0.3,1)_both]',
                )}
              />
            )}
          </Button>

          {activityType === 'walking' && (
            <Button
              variant={showMountainPeaks && !mountainPeaksLoading ? 'default' : 'secondary'}
              size="icon"
              className="h-10 w-10 shadow-md"
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
          )}
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
