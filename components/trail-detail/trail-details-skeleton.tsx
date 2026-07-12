'use client';

import { Header } from '@/app/_components/header';

export function TrailDetailsSkeleton() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-[#08090f] lg:h-screen lg:overflow-hidden">
      <Header session={null} />
      <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden">
        <div className="order-2 lg:order-1 lg:w-[55%] bg-white dark:bg-[#0e0f18] p-8 space-y-8 animate-pulse">
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
        </div>
        <div className="order-1 lg:order-2 lg:flex-1 h-[50vh] lg:h-auto bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </main>
    </div>
  );
}
