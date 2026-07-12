'use client';

import { Maximize2, X } from 'lucide-react';

interface MobileFullscreenToggleProps {
  isMobileFullscreen?: boolean;
  onToggleMobileFullscreen?: () => void;
  tMap: (key: string) => string;
}

export function MobileFullscreenToggle({
  isMobileFullscreen,
  onToggleMobileFullscreen,
  tMap,
}: MobileFullscreenToggleProps) {
  if (!onToggleMobileFullscreen) return null;

  return (
    <button
      onClick={onToggleMobileFullscreen}
      className="border-border bg-background/80 absolute top-3 right-3 z-20 rounded-lg border p-2 shadow-md backdrop-blur-sm lg:hidden"
      aria-label={isMobileFullscreen ? tMap('collapseMap') : tMap('expandMap')}
    >
      {isMobileFullscreen ? <X className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  );
}
