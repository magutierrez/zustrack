'use client';

import { useTranslations } from 'next-intl';
import { Zap, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PhysiologySummaryProps {
  needs: {
    calories: number;
    waterLiters: number;
  };
  durationHours: number;
}

export function PhysiologySummary({ needs, durationHours }: PhysiologySummaryProps) {
  const tp = useTranslations('physiology');

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-primary/10 rounded-full p-2">
            <Zap className="size-5 text-orange-500" />
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {tp('calories')} ({tp('total')})
            </p>
            <p className="text-foreground font-mono text-xl font-bold">
              {needs.calories}{' '}
              <span className="text-muted-foreground text-xs font-normal">kcal</span>
            </p>
            <p className="text-muted-foreground text-[10px]">
              ~{Math.round(needs.calories / durationHours)} kcal {tp('perHour')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-primary/10 rounded-full p-2">
            <Droplets className="size-5 text-cyan-600" />
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {tp('hydration')} ({tp('total')})
            </p>
            <p className="text-foreground font-mono text-xl font-bold">
              {needs.waterLiters}{' '}
              <span className="text-muted-foreground text-xs font-normal">L</span>
            </p>
            <p className="text-muted-foreground text-[10px]">
              ~{Math.round((needs.waterLiters * 1000) / durationHours)} ml {tp('perHour')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
