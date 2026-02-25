import { Skeleton } from '@/components/ui/skeleton';

export function AnalysisSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6">
      <Skeleton className="h-10 w-full" /> {/* Tabs */}
      <Skeleton className="h-24 w-full" /> {/* Summary */}
      <Skeleton className="h-48 w-full" /> {/* Chart */}
      <Skeleton className="h-32 w-full" /> {/* List header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
