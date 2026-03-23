'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  labels: { listView: string; mapView: string };
}

export function ViewToggle({ labels }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') ?? 'list';

  const switchTo = (view: 'list' | 'map') => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'list') {
      params.delete('view');
    } else {
      params.set('view', 'map');
    }
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `?${qs}` : '?');
  };

  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
      <button
        onClick={() => switchTo('list')}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
          currentView !== 'map'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
        )}
        aria-label={labels.listView}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{labels.listView}</span>
      </button>
      <button
        onClick={() => switchTo('map')}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
          currentView === 'map'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
        )}
        aria-label={labels.mapView}
      >
        <Map className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{labels.mapView}</span>
      </button>
    </div>
  );
}
