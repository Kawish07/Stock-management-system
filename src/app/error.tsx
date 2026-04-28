'use client';

import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, Layers } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 bg-white dark:bg-zinc-950">
          {/* Background blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange-100 dark:bg-orange-950 opacity-40 blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-red-100 dark:bg-red-950 opacity-40 blur-3xl animate-pulse [animation-delay:1.5s]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">
            {/* Logo */}
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/30">
              <Layers className="h-7 w-7 text-white" />
            </div>

            {/* Icon */}
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/60 ring-1 ring-orange-100 dark:ring-orange-800">
              <AlertTriangle className="h-12 w-12 text-orange-500 dark:text-orange-400" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              An unexpected error occurred. You can try again or return to the dashboard.
            </p>

            {/* Error message */}
            {error.message && (
              <pre className="mt-4 w-full overflow-auto rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                {error.message}
                {error.digest && `\n[digest: ${error.digest}]`}
              </pre>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="default" onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'default' })}>
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </div>
      </div>
    </div>
  );
}
