'use client';

import { useTranslations } from 'next-intl';
import { Wind, Zap, Thermometer, EyeOff } from 'lucide-react';
import type { ViabilityResult, ViabilityThreat } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SCORE_COLORS = {
  go: {
    ring: 'ring-emerald-500',
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  caution: {
    ring: 'ring-amber-400',
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
  },
  danger: {
    ring: 'ring-red-500',
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
} as const;

const THREAT_ICONS: Record<ViabilityThreat['type'], React.ReactNode> = {
  wind: <Wind className="h-3.5 w-3.5" />,
  storm: <Zap className="h-3.5 w-3.5" />,
  temperature: <Thermometer className="h-3.5 w-3.5" />,
  visibility: <EyeOff className="h-3.5 w-3.5" />,
};

export function ViabilityCard({ viability }: { viability: ViabilityResult }) {
  const t = useTranslations('Advice');
  const { score, rating, threats } = viability;
  const colors = SCORE_COLORS[rating];

  const formatThreat = (threat: ViabilityThreat): string => {
    const km = threat.km.toFixed(1);
    switch (threat.type) {
      case 'wind':
        return t('viabilityThreatWind', { value: threat.value, km });
      case 'storm':
        return t('viabilityThreatStorm', { km });
      case 'temperature':
        return t('viabilityThreatTemp', { value: threat.value, km });
      case 'visibility':
        return t('viabilityThreatVisibility', { value: threat.value, km });
    }
  };

  const terrainLabel = (tf: number) => {
    if (tf <= 0.5) return t('viabilityTerrainProtected');
    if (tf >= 2.0) return t('viabilityTerrainExposed');
    return null;
  };

  return (
    <Card className={cn('overflow-hidden border', colors.border, colors.bg)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Score ring */}
          <div
            className={cn(
              'flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full ring-4',
              colors.ring,
            )}
          >
            <span className={cn('font-mono text-2xl font-black leading-none', colors.text)}>
              {score}
            </span>
            <span className="text-muted-foreground text-[8px] font-bold tracking-widest uppercase">
              /100
            </span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-widest uppercase">
              {t('viabilityTitle')}
            </p>
            <p className={cn('text-sm font-black tracking-tight uppercase', colors.text)}>
              {t(`viabilityRating_${rating}` as Parameters<typeof t>[0])}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
              {rating === 'go'
                ? t('viabilityMsgGo')
                : rating === 'caution'
                  ? t('viabilityMsgCaution')
                  : t('viabilityMsgDanger')}
            </p>
          </div>
        </div>

        {/* Threat list */}
        {threats.length > 0 && rating !== 'go' && (
          <ul className="mt-3 space-y-1.5 border-t border-current/10 pt-3">
            {threats.map((threat, i) => {
              const terrain = terrainLabel(threat.terrainFactor);
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className={cn('shrink-0', colors.text)}>{THREAT_ICONS[threat.type]}</span>
                  <span className="text-foreground min-w-0 flex-1 text-[11px]">
                    {formatThreat(threat)}
                    {terrain && (
                      <span className="text-muted-foreground ml-1 text-[9px]">({terrain})</span>
                    )}
                  </span>
                  <span className={cn('shrink-0 font-mono text-[10px] font-bold', colors.text)}>
                    -{threat.deduction}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
