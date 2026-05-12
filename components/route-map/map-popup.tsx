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
  Loader2,
  MapPinned,
  MessageSquare,
  Sun,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReducer, useEffect } from 'react';
import { WeatherIcon } from '@/components/weather-icon';
import { StreetViewSection } from './street-view-section';
import { NoteSection } from './note-section';

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

type MapPopupState = {
  showStreetView: boolean;
  streetViewAvailable: boolean | null;
  showNote: boolean;
  isEditing: boolean;
  noteText: string;
  isSaving: boolean;
};

type MapPopupAction =
  | { type: 'SET_STREET_VIEW'; payload: boolean }
  | { type: 'SET_STREET_VIEW_AVAILABLE'; payload: boolean | null }
  | { type: 'TOGGLE_NOTE'; payload?: boolean }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_NOTE_TEXT'; payload: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'RESET_NOTE'; payload: { showNote: boolean; noteText: string } };

function popupReducer(state: MapPopupState, action: MapPopupAction): MapPopupState {
  switch (action.type) {
    case 'SET_STREET_VIEW':
      return { ...state, showStreetView: action.payload };
    case 'SET_STREET_VIEW_AVAILABLE':
      return { ...state, streetViewAvailable: action.payload };
    case 'TOGGLE_NOTE':
      return {
        ...state,
        showNote: action.payload ?? !state.showNote,
        isEditing: action.payload === false ? false : state.isEditing,
      };
    case 'SET_EDITING':
      return { ...state, isEditing: action.payload };
    case 'SET_NOTE_TEXT':
      return { ...state, noteText: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'RESET_NOTE':
      return {
        ...state,
        showNote: action.payload.showNote,
        noteText: action.payload.noteText,
        isEditing: false,
      };
    default:
      return state;
  }
}

function getWindEffectIcon(effect: string) {
  switch (effect) {
    case 'tailwind':
      return <ArrowDown className="size-3 text-emerald-500" />;
    case 'headwind':
      return <ArrowUp className="size-3 text-red-500" />;
    case 'crosswind-left':
      return <ArrowLeft className="size-3 text-amber-500" />;
    case 'crosswind-right':
      return <ArrowRight className="size-3 text-amber-500" />;
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
  const [state, dispatch] = useReducer(popupReducer, {
    showStreetView: false,
    streetViewAvailable: null,
    showNote: !!currentAnnotation,
    isEditing: false,
    noteText: '',
    isSaving: false,
  });

  const t = useTranslations('RouteMap');
  const tw = useTranslations('WeatherCodes');
  const tt = useTranslations('WeatherTimeline');
  const ta = useTranslations('Annotations');

  const isWeatherPoint = popupInfo.index !== -1;

  useEffect(() => {
    dispatch({ type: 'SET_STREET_VIEW_AVAILABLE', payload: true });
  }, [popupInfo.point]);

  if (state.showStreetView) {
    return (
      <StreetViewSection
        popupInfo={popupInfo}
        onBack={() => dispatch({ type: 'SET_STREET_VIEW', payload: false })}
        onClose={() => {
          dispatch({ type: 'SET_STREET_VIEW', payload: false });
          onClose();
        }}
        t={t}
      />
    );
  }

  const hasTranslation = !!tw.raw(popupInfo.weather.weatherCode.toString());
  const weatherDescription = hasTranslation
    ? tw(popupInfo.weather.weatherCode.toString() as any)
    : WEATHER_CODES[popupInfo.weather.weatherCode]?.description || tt('unknownWeather');

  const content = (
    <div className="text-foreground text-xs leading-relaxed">
      <div className="border-border mb-3 flex items-center justify-between border-b pb-2">
        <div className="flex flex-col">
          <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-wider uppercase">
            km {popupInfo.point.distanceFromStart.toFixed(1)}
          </span>
          {isWeatherPoint && (
            <span className="text-foreground font-mono text-[11px] font-bold">
              {/* eslint-disable-next-line react-doctor/rendering-hydration-mismatch-time */}
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
          {!hideNotes && (
            <button
              type="button"
              className={`flex size-6 items-center justify-center rounded-full transition-colors ${
                currentAnnotation
                  ? 'bg-amber-500 text-white'
                  : state.showNote
                    ? 'bg-amber-500/20 text-amber-600'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              title={ta('addNote')}
              aria-label={ta('addNote')}
              onClick={() => {
                if (state.showNote && !currentAnnotation) {
                  dispatch({ type: 'RESET_NOTE', payload: { showNote: false, noteText: '' } });
                } else {
                  dispatch({ type: 'TOGGLE_NOTE', payload: true });
                  if (!currentAnnotation) dispatch({ type: 'SET_EDITING', payload: false });
                }
              }}
            >
              <MessageSquare className="size-3" />
            </button>
          )}
        </div>
      </div>

      {isWeatherPoint && (
        <div className="bg-primary/5 mb-3 flex items-center gap-3 rounded-lg p-2">
          <WeatherIcon code={popupInfo.weather.weatherCode} className="size-8 shrink-0" />
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
              className="text-muted-foreground size-3"
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
                <Sun className="size-3 text-amber-500" />
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
        onClick={() => dispatch({ type: 'SET_STREET_VIEW', payload: true })}
        disabled={state.streetViewAvailable === false}
      >
        {state.streetViewAvailable === null ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <MapPinned className="size-3.5" />
        )}
        {t('streetView')}
      </Button>

      {!hideNotes && state.showNote && (
        <NoteSection
          currentAnnotation={currentAnnotation}
          isEditing={state.isEditing}
          noteText={state.noteText}
          isSaving={state.isSaving}
          savedRouteId={savedRouteId}
          ta={ta}
          onEdit={(text) => {
            dispatch({ type: 'SET_EDITING', payload: true });
            dispatch({ type: 'SET_NOTE_TEXT', payload: text });
          }}
          onDelete={() => {
            if (currentAnnotation) onDeleteAnnotation?.(currentAnnotation.id);
            dispatch({ type: 'TOGGLE_NOTE', payload: false });
          }}
          onSave={async (text) => {
            dispatch({ type: 'SET_SAVING', payload: true });
            if (state.isEditing && currentAnnotation) {
              onUpdateAnnotation?.(currentAnnotation.id, text);
            } else {
              onSaveAnnotation?.(text);
            }
            dispatch({ type: 'SET_SAVING', payload: false });
            dispatch({ type: 'RESET_NOTE', payload: { showNote: false, noteText: '' } });
          }}
          onCancel={() => {
            dispatch({
              type: 'RESET_NOTE',
              payload: { showNote: !!currentAnnotation, noteText: '' },
            });
          }}
          onChangeText={(text) => dispatch({ type: 'SET_NOTE_TEXT', payload: text })}
        />
      )}
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
            className="hover:bg-destructive/10 hover:text-destructive mt-0.5 size-7 shrink-0 rounded-full transition-colors"
            onClick={onClose}
            aria-label={t('close')}
          >
            <X className="size-4" />
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
          className="bg-background border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive absolute -top-3 -right-3 z-10 size-6 rounded-full border shadow-sm transition-all"
          onClick={onClose}
          aria-label={t('close')}
        >
          <X className="size-3" />
        </Button>
        <div className="p-2">{content}</div>
      </div>
    </Popup>
  );
}
