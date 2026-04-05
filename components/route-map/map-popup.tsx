'use client';

import { Popup } from 'react-map-gl/maplibre';
import { useTranslations } from 'next-intl';
import type { Annotation, MapPopupInfo } from '@/lib/types';
import { WEATHER_CODES } from '@/lib/types';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Loader2,
  Map as MapIcon,
  MapPinned,
  MessageSquare,
  Pencil,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { WeatherIcon } from '@/components/weather-icon';

interface MapPopupProps {
  popupInfo: MapPopupInfo;
  onClose: () => void;
  mobileMode?: boolean;
  onSaveAnnotation?: (text: string) => void;
  onUpdateAnnotation?: (id: string, text: string) => void;
  onDeleteAnnotation?: (id: string) => void;
  savedRouteId?: string | null;
  currentAnnotation?: Annotation | null;
  hideNotes?: boolean;
}

function getWindEffectIcon(effect: string) {
  switch (effect) {
    case 'tailwind':
      return <ArrowDown className="h-3 w-3 text-emerald-500" />;
    case 'headwind':
      return <ArrowUp className="h-3 w-3 text-red-500" />;
    case 'crosswind-left':
      return <ArrowLeft className="h-3 w-3 text-amber-500" />;
    case 'crosswind-right':
      return <ArrowRight className="h-3 w-3 text-amber-500" />;
    default:
      return null;
  }
}

export function MapPopup({
  popupInfo,
  onClose,
  mobileMode,
  onSaveAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  savedRouteId,
  currentAnnotation,
  hideNotes = false,
}: MapPopupProps) {
  const [showStreetView, setShowStreetView] = useState(false);
  const [streetViewAvailable, setStreetViewAvailable] = useState<boolean | null>(null);
  const [showNote, setShowNote] = useState(!!currentAnnotation);
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('RouteMap');
  const tw = useTranslations('WeatherCodes');
  const tt = useTranslations('WeatherTimeline');
  const ta = useTranslations('Annotations');

  const isWeatherPoint = popupInfo.index !== -1;

  useEffect(() => {
    const checkStreetView = async () => {
      try {
        setStreetViewAvailable(true);
      } catch (e) {
        setStreetViewAvailable(true);
      }
    };
    checkStreetView();
  }, [popupInfo.point]);

  if (showStreetView) {
    return (
      <div className="bg-background animate-in fade-in absolute inset-0 z-[170] flex flex-col duration-200">
        <div className="border-border bg-card flex items-center justify-between border-b px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-bold tracking-wider uppercase"
              onClick={() => setShowStreetView(false)}
            >
              <MapIcon className="h-4 w-4" />
              {t('backToMap')}
            </Button>
            <div className="bg-border h-6 w-px" />
            <div className="text-muted-foreground flex items-center gap-4 text-xs font-medium tracking-wider uppercase">
              <span className="flex items-center gap-1">
                <span className="text-foreground font-bold">
                  {popupInfo.point.distanceFromStart.toFixed(1)}
                </span>{' '}
                km
              </span>
              <span className="flex items-center gap-1">
                <span className="text-foreground font-bold">
                  {Math.round(popupInfo.point.ele || 0)}
                </span>{' '}
                m
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive h-9 w-9 rounded-full transition-colors"
            onClick={() => {
              setShowStreetView(false);
              onClose();
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="bg-muted relative flex-1">
          <iframe
            src={`https://www.google.com/maps?layer=c&cbll=${popupInfo.point.lat},${popupInfo.point.lon}&cbp=12,${popupInfo.bearing || 0},0,0,0&output=svembed`}
            className="h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            title="Street View"
          />
        </div>
      </div>
    );
  }

  const hasTranslation = !!tw.raw(popupInfo.weather.weatherCode.toString());
  const weatherDescription = hasTranslation
    ? tw(popupInfo.weather.weatherCode.toString() as any)
    : WEATHER_CODES[popupInfo.weather.weatherCode]?.description || tt('unknownWeather');

  const noteSection = !hideNotes && showNote ? (
    currentAnnotation && !isEditing ? (
      // Display existing note inline
      <div className="bg-amber-500/10 mt-2 rounded-lg px-2.5 py-2">
        <p className="text-foreground mb-1.5 text-xs leading-relaxed">{currentAnnotation.text}</p>
        <div className="flex gap-1">
          <button
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
            onClick={() => {
              setIsEditing(true);
              setNoteText(currentAnnotation.text);
            }}
          >
            <Pencil className="h-2.5 w-2.5" />
            {ta('edit')}
          </button>
          <button
            className="text-muted-foreground hover:text-destructive flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
            onClick={() => {
              onDeleteAnnotation?.(currentAnnotation.id);
              setShowNote(false);
            }}
          >
            <Trash2 className="h-2.5 w-2.5" />
            {ta('delete')}
          </button>
        </div>
      </div>
    ) : (
      // Input for new note or editing existing
      <div className="mt-2">
        <textarea
          className="border-border bg-background text-foreground placeholder:text-muted-foreground w-full resize-none rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
          placeholder={ta('placeholder')}
          maxLength={500}
          rows={3}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          disabled={!savedRouteId}
          autoFocus
        />
        {!savedRouteId && (
          <p className="text-muted-foreground mt-0.5 text-[9px]">{ta('saveRouteFirst')}</p>
        )}
        <div className="mt-1.5 flex gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 flex-1 gap-1 text-[10px] font-bold uppercase"
            disabled={!savedRouteId || !noteText.trim() || isSaving}
            onClick={async () => {
              if (!noteText.trim()) return;
              setIsSaving(true);
              if (isEditing && currentAnnotation) {
                onUpdateAnnotation?.(currentAnnotation.id, noteText.trim());
                setIsEditing(false);
              } else {
                onSaveAnnotation?.(noteText.trim());
              }
              setNoteText('');
              setIsSaving(false);
              setShowNote(false);
            }}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            {ta('save')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px]"
            onClick={() => {
              setIsEditing(false);
              setNoteText('');
              setShowNote(!!currentAnnotation);
            }}
          >
            {ta('cancel')}
          </Button>
        </div>
      </div>
    )
  ) : null;

  const content = (
    <div className="text-foreground text-xs leading-relaxed">
      <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
        <div className="flex flex-col">
          <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-wider uppercase">
            km {popupInfo.point.distanceFromStart.toFixed(1)}
          </span>
          {isWeatherPoint && (
            <span className="text-foreground font-mono text-[11px] font-bold">
              {new Date(popupInfo.point.estimatedTime || popupInfo.weather.time).toLocaleTimeString(
                'es-ES',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!isWeatherPoint && (
            <span className="font-mono text-sm font-bold">
              {Math.round(popupInfo.point.ele || 0)}m
            </span>
          )}
          {/* Note toggle button */}
          {!hideNotes && (
            <button
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                currentAnnotation
                  ? 'bg-amber-500 text-white'
                  : showNote
                    ? 'bg-amber-500/20 text-amber-600'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              title={ta('addNote')}
              onClick={() => {
                if (showNote && !currentAnnotation) {
                  setShowNote(false);
                  setNoteText('');
                } else {
                  setShowNote(true);
                  if (!currentAnnotation) setIsEditing(false);
                }
              }}
            >
              <MessageSquare className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {isWeatherPoint && (
        <div className="bg-primary/5 mb-3 flex items-center gap-3 rounded-lg p-2">
          <WeatherIcon code={popupInfo.weather.weatherCode} className="h-8 w-8 shrink-0" />
          <div className="flex flex-col">
            <span className="leading-tight font-bold">{weatherDescription}</span>
            <span className="text-primary text-sm font-black">
              {Math.round(popupInfo.weather.temperature)}°C
            </span>
          </div>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="bg-secondary/50 rounded p-2 text-center">
          <span className="text-muted-foreground block text-[9px] font-bold uppercase">
            {t('elevation')}
          </span>
          <span className="font-mono text-sm font-bold">
            {Math.round(popupInfo.point.ele || 0)}
            <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">m</span>
          </span>
        </div>
        <div className="bg-secondary/50 rounded p-2 text-center">
          <span className="text-muted-foreground block text-[9px] font-bold uppercase">
            {t('slope')}
          </span>
          <div className="flex items-center justify-center gap-1">
            <ArrowUp
              className="text-muted-foreground h-3 w-3"
              style={{
                transform: `rotate(${Math.min(90, Math.max(-90, (popupInfo.point.slope || 0) * 4))}deg)`,
              }}
            />
            <span className="font-mono text-sm font-bold">
              {Math.abs(Math.round(popupInfo.point.slope || 0))}
              <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">%</span>
            </span>
          </div>
        </div>

        {isWeatherPoint && (
          <>
            <div className="bg-secondary/50 rounded p-2 text-center">
              <span className="text-muted-foreground block text-[9px] font-bold uppercase">
                {tt('summary.wind')}
              </span>
              <div className="flex items-center justify-center gap-1">
                {getWindEffectIcon(popupInfo.windEffect)}
                <span className="font-mono text-xs font-bold">
                  {Math.round(popupInfo.weather.windSpeed)}
                  <span className="text-muted-foreground ml-0.5 text-[9px] font-normal">km/h</span>
                </span>
              </div>
            </div>
            <div className="bg-secondary/50 rounded p-2 text-center">
              <span className="text-muted-foreground block text-[9px] font-bold uppercase">
                {tt('summary.solarTitle')}
              </span>
              <div className="flex items-center justify-center gap-1">
                <Sun className="h-3 w-3 text-amber-500" />
                <span className="font-mono text-[10px] font-bold tracking-tighter uppercase">
                  {tt(
                    `solarExposure.${popupInfo.solarIntensity === 'night' ? 'night' : popupInfo.solarIntensity === 'shade' ? 'shade' : 'sun'}` as any,
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <Button
        variant="default"
        size="sm"
        className="h-8 w-full gap-2 text-[10px] font-bold uppercase shadow-sm transition-all active:scale-[0.98]"
        onClick={() => setShowStreetView(true)}
        disabled={streetViewAvailable === false}
      >
        {streetViewAvailable === null ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MapPinned className="h-3.5 w-3.5" />
        )}
        {t('streetView')}
      </Button>

      {noteSection}
    </div>
  );

  if (mobileMode) {
    return (
      <div className="animate-in slide-in-from-top bg-card border-border absolute top-0 right-0 left-0 z-30 border-b p-3 shadow-lg duration-200">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">{content}</div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive mt-0.5 h-7 w-7 shrink-0 rounded-full transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Popup
      longitude={popupInfo.point.lon}
      latitude={popupInfo.point.lat}
      anchor="bottom"
      onClose={onClose}
      closeButton={false}
      maxWidth={isWeatherPoint ? '260px' : '220px'}
      className="weather-popup"
      offset={15}
    >
      <div className="group relative">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive absolute -top-3 -right-3 z-10 h-6 w-6 rounded-full border shadow-sm transition-all"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
        <div className="p-2">{content}</div>
      </div>
    </Popup>
  );
}
