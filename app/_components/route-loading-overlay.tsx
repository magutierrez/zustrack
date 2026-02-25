'use client';

import { useTranslations } from 'next-intl';

interface RouteLoadingOverlayProps {
  isVisible: boolean;
}

export function RouteLoadingOverlay({ isVisible }: RouteLoadingOverlayProps) {
  const t = useTranslations('HomePage');

  if (!isVisible) return null;

  return (
    <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
      <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      <p className="text-muted-foreground text-center text-sm">{t('obtainingData')}</p>
    </div>
  );
}
