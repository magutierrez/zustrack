'use client';

import dynamic from 'next/dynamic';

export const AppMockup = dynamic(() => import('./app-mockup').then((m) => m.AppMockup), {
  ssr: false,
  loading: () => (
    <div className="h-[630px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/50" />
  ),
});
