import { Layers } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white dark:bg-zinc-950">
      {/* Spinning logo */}
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
          <Layers className="h-8 w-8 text-white" />
        </div>
        {/* Spinning ring */}
        <span className="absolute inset-0 rounded-2xl border-4 border-indigo-300 dark:border-indigo-700 border-t-indigo-600 animate-spin" />
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">StockFlow</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
      </div>
    </div>
  );
}
