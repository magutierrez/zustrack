'use client';

import { useTranslations } from 'next-intl';
import { Clock, Star, Wind, Thermometer, CloudRain, Moon, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatTemperature, formatWindSpeed } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

interface BestDepartureFinderProps {
  windows: any[];
  onSelect: (time: string) => void;
  isLoading: boolean;
  onFind: () => void;
  onAnalyze: (time: string) => void;
}

export function BestDepartureFinder({
  windows,
  onSelect,
  isLoading,
  onFind,
  onAnalyze,
}: BestDepartureFinderProps) {
  const t = useTranslations('BestWindow');
  const { unitSystem, windUnit } = useSettings();

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes('rain')) return <CloudRain className="h-3 w-3" />;
    if (reason.includes('wind')) return <Wind className="h-3 w-3" />;
    if (reason.includes('temp')) return <Thermometer className="h-3 w-3" />;
    if (reason.includes('daylight')) return <Star className="h-3 w-3" />;
    if (reason.includes('night')) return <Moon className="h-3 w-3" />;
    return <Info className="h-3 w-3" />;
  };

  const isPositiveReason = (reason: string) => {
    return ['no_rain', 'wind_calm', 'temp_perfect', 'daylight_ok', 'wind_favor'].includes(reason);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Star className="text-primary h-4 w-4" />
          <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            {t('title')}
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onFind}
          disabled={isLoading}
          className="h-7 text-[10px] font-bold tracking-tight uppercase"
        >
          {isLoading ? t('analyzing') : t('suggest')}
        </Button>
      </div>

      {windows.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {windows.slice(0, 4).map((window, idx) => {
            const time = new Date(window.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <Card key={idx} className={cn('overflow-hidden transition-all')}>
                <CardContent className="flex h-full flex-col justify-between p-3">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-bold">{time}</span>
                        <span
                          className={cn(
                            'rounded border px-1.5 py-0.5 text-[10px] font-black shadow-sm',
                            getScoreColor(window.score),
                          )}
                        >
                          {window.score}/100
                        </span>
                      </div>
                      {idx === 0 && (
                        <span className="text-primary text-[9px] font-bold uppercase">
                          {t('recommended')}
                        </span>
                      )}
                    </div>

                    <div className="text-muted-foreground mb-3 flex items-center gap-3 font-mono text-[10px]">
                      <span className="text-foreground flex items-center gap-1 font-bold">
                        <Thermometer className="h-3 w-3 opacity-50" />
                        {formatTemperature(window.avgTemp, unitSystem)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wind className="h-3 w-3 opacity-50" />
                        {formatWindSpeed(window.maxWind, windUnit)}
                      </span>
                    </div>

                    <div className="mb-4 space-y-1">
                      {window.reasons?.slice(0, 3).map((reason: string, rIdx: number) => (
                        <div
                          key={rIdx}
                          className={cn(
                            'flex items-center gap-1.5 text-[9px] font-semibold',
                            isPositiveReason(reason) ? 'text-emerald-600' : 'text-rose-500',
                          )}
                        >
                          <span className="shrink-0">{getReasonIcon(reason)}</span>
                          <span className="truncate leading-none">{t(`reasons.${reason}`)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 font-semibold"
                      onClick={() => onSelect(window.startTime)}
                    >
                      <Clock />
                      {t('set_time')}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary flex-1 font-semibold shadow-sm"
                      onClick={() => onAnalyze(window.startTime)}
                    >
                      {t('analyze')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        !isLoading && (
          <div className="border-border bg-muted/5 rounded-2xl border-2 border-dashed p-8 text-center">
            <Info className="text-muted-foreground mx-auto mb-3 h-8 w-8 opacity-20" />
            <p className="text-muted-foreground px-4 text-xs leading-relaxed italic">
              {t('description')}
            </p>
          </div>
        )
      )}
    </div>
  );
}
