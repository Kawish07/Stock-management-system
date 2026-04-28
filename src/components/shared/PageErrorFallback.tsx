'use client';

import { useState } from 'react';
import { ServerCrash, ChevronDown, ChevronUp, RefreshCw, Home } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

interface PageErrorFallbackProps {
  error?: Error | string;
  onRetry?: () => void;
}

export function PageErrorFallback({ error, onRetry }: PageErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'An unexpected error occurred.';

  const stack = error instanceof Error ? error.stack : undefined;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
        <ServerCrash className="h-12 w-12 text-red-500" />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Page failed to load
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading this page. You can try again or go back to the home
          page.
        </p>
      </div>

      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
          <Home className="mr-2 h-4 w-4" />
          Go Home
        </Link>
      </div>

      {message && (
        <div className="w-full max-w-lg">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>

          {showDetails && (
            <div className="mt-2 rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 text-left">
              <p className="font-mono text-xs text-red-700 dark:text-red-400 break-words">
                {message}
              </p>
              {stack && (
                <pre className="mt-2 font-mono text-[10px] text-red-600/70 dark:text-red-500/70 overflow-x-auto whitespace-pre-wrap">
                  {stack}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
