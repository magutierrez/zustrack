'use client';

import { useTranslations } from 'next-intl';
import { SpecialLoading } from './special-loading';

interface RouteLoadingOverlayProps {
  isVisible: boolean;
}

export function RouteLoadingOverlay({ isVisible }: RouteLoadingOverlayProps) {
  const t = useTranslations('HomePage');

  if (!isVisible) return null;

  return (
    <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md">
      <SpecialLoading message={t('obtainingData')} />
    </div>
  );
}
