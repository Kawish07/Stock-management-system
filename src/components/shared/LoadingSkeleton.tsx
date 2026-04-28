import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

/** Table row skeleton */
export function LoadingSkeleton({ rows = 5, columns = 4 }: LoadingSkeletonProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Fake header */}
      <div className="flex gap-4 px-4 py-3 border-b bg-zinc-50/80 dark:bg-zinc-800/50">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton
                key={j}
                className="h-5 flex-1"
                style={{ opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** KPI card grid skeleton — matches KPICards layout */
export function KPICardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-5 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
