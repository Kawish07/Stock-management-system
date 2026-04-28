import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex w-64 flex-col gap-3 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Nav items */}
        <div className="space-y-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        {/* User card at bottom */}
        <div className="mt-auto flex items-center gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 h-14 shrink-0">
          <Skeleton className="h-5 w-5 md:hidden" />
          <Skeleton className="h-5 w-40" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>

          {/* KPI cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-zinc-50 dark:border-zinc-900 px-4 py-3 last:border-0">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" style={{ opacity: 1 - j * 0.12 }} />
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
