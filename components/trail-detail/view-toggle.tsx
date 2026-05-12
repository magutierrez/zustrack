'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  labels: { listView: string; mapView: string };
}

function ViewToggleInner({ labels }: ViewToggleProps) {
  const { push } = useRouter();
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
    push(qs ? `?${qs}` : '?');
  };

  return (
    <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
      <button
        onClick={() => switchTo('list')}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
          currentView !== 'map'
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
        )}
        aria-label={labels.listView}
      >
        <LayoutGrid className="size-3.5" />
        <span className="hidden sm:inline">{labels.listView}</span>
      </button>
      <button
        onClick={() => switchTo('map')}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
          currentView === 'map'
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
        )}
        aria-label={labels.mapView}
      >
        <Map className="size-3.5" />
        <span className="hidden sm:inline">{labels.mapView}</span>
      </button>
    </div>
  );
}

export function ViewToggle(props: ViewToggleProps) {
  return (
    <Suspense fallback={null}>
      <ViewToggleInner {...props} />
    </Suspense>
  );
}
