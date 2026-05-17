'use client';

import { MapPin, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TrailActionFooterProps {
  onAnalyze: () => void;
  mapExpanded: boolean;
  onDownloadGpx?: () => void;
}

export function TrailActionFooter({
  onAnalyze,
  mapExpanded,
  onDownloadGpx,
}: TrailActionFooterProps) {
  const t = useTranslations('TrailPage');

  return (
    <>
      {/* Desktop sticky CTA footer */}
      <div className="hidden shrink-0 border-t border-zinc-200 bg-white px-6 py-4 lg:block dark:border-zinc-700/60 dark:bg-[#0e0f18]">
        <button
          onClick={onAnalyze}
          className="font-headline inline-flex h-auto w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-base font-bold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          <MapPin className="size-5" />
          {t('analyzeWithZustrack')}
        </button>
      </div>

      {/* Sticky CTA — mobile only, hidden in fullscreen map */}
      <div
        className={cn(
          'fixed right-0 bottom-0 left-0 z-20 flex gap-2 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur-sm lg:hidden dark:border-zinc-800 dark:bg-[#08090f]/95',
          mapExpanded && 'hidden',
        )}
      >
        {onDownloadGpx && (
          <Button
            variant="outline"
            onClick={onDownloadGpx}
            className="h-auto shrink-0 rounded-xl px-4 py-4 text-sm font-semibold"
          >
            <Download className="size-4" />
            GPX
          </Button>
        )}
        <Button
          onClick={onAnalyze}
          className="font-headline h-auto flex-1 rounded-xl bg-zinc-900 px-6 py-4 text-base font-bold text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <MapPin />
          {t('analyzeWithZustrack')}
        </Button>
      </div>
    </>
  );
}
