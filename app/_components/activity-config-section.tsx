'use client';

import {
  Calendar as CalendarIcon,
  Clock,
  Gauge,
  Edit2,
  Loader2,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRouteStore } from '@/store/route-store';
import { useActivityConfig } from '@/hooks/use-activity-config';

interface ActivityConfigSectionProps {
  onAnalyze: () => void;
  onReverseRoute?: () => void;
}

export function ActivityConfigSection({ onAnalyze, onReverseRoute }: ActivityConfigSectionProps) {
  const t = useTranslations('RouteConfigPanel');

  const config = useRouteStore((s) => s.config);
  const setConfig = useRouteStore((s) => s.setConfig);
  const isLoading = useRouteStore((s) => s.isLoading);
  const gpxData = useRouteStore((s) => s.gpxData);

  const hasGpxData = !!gpxData;

  const { initialHours, initialMinutes, manualHours, manualMinutes, handleDurationChange } =
    useActivityConfig();

  return (
    <section className="border-border bg-card rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="text-primary h-4 w-4" />
          <h2 className="text-foreground text-sm font-semibold">{t('analyze')}</h2>
        </div>
        {onReverseRoute && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary h-7 gap-1.5 px-2 text-[10px]"
            onClick={onReverseRoute}
          >
            <span className="rotate-90">
              <RotateCcw className="h-3 w-3" />
            </span>
            {t('reverseRoute')}
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-end">
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:gap-8">
          {/* Speed */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="speed"
              className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase"
            >
              <Gauge className="h-3 w-3" />
              {t('averageSpeed')}
            </Label>
            <Input
              id="speed"
              type="number"
              min={1}
              max={60}
              value={config.speed}
              onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) || 1 })}
              className="h-9 font-mono"
            />
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase">
              <Clock className="h-3 w-3" />
              {t('estimatedDuration')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="border-input bg-background hover:border-primary group flex h-9 w-full items-center justify-between rounded-md border px-3 transition-colors focus:outline-none">
                  <span className="text-foreground group-hover:text-primary font-mono text-sm font-bold">
                    {t('durationFormat', {
                      hours: initialHours,
                      minutes: initialMinutes.toString().padStart(2, '0'),
                    })}
                  </span>
                  <Edit2 className="text-muted-foreground group-hover:text-primary h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="bg-card border-border w-64 p-4 shadow-xl" align="end">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="text-primary h-4 w-4" />
                    <h4 className="text-foreground text-xs font-bold tracking-tight uppercase">
                      {t('estimatedDuration')}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                        {t('hours')}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        value={manualHours}
                        onChange={(e) =>
                          handleDurationChange(parseInt(e.target.value) || 0, manualMinutes)
                        }
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                        {t('minutes')}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={manualMinutes}
                        onChange={(e) =>
                          handleDurationChange(manualHours, parseInt(e.target.value) || 0)
                        }
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      type="range"
                      min={0}
                      max={600}
                      step={5}
                      value={manualHours * 60 + manualMinutes}
                      onChange={(e) => {
                        const total = parseInt(e.target.value);
                        handleDurationChange(Math.floor(total / 60), total % 60);
                      }}
                      className="accent-primary bg-secondary h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                    />
                    <p className="text-muted-foreground text-center text-[10px] leading-tight italic">
                      {t('adjustDurationDesc')}
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="date"
              className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase"
            >
              <CalendarIcon className="h-3 w-3" />
              {t('date')}
            </Label>
            <Input
              id="date"
              type="date"
              value={config.date}
              onChange={(e) => setConfig({ ...config, date: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="time"
              className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase"
            >
              <Clock className="h-3 w-3" />
              {t('startTime')}
            </Label>
            <Input
              id="time"
              type="time"
              value={config.time}
              onChange={(e) => setConfig({ ...config, time: e.target.value })}
              className="h-9"
            />
          </div>
        </div>

        {/* Analyze button */}
        <div className="w-full flex-1">
          <Button
            onClick={() => onAnalyze()}
            disabled={!hasGpxData || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full flex-1 font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                {t('analyze')}
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
