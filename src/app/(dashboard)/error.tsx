'use client';

import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-orange-200 dark:border-orange-800 shadow-xl">
        <CardHeader className="items-center pb-2">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/60 ring-1 ring-orange-100 dark:ring-orange-800">
            <AlertTriangle className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          </div>
          <CardTitle className="text-center text-xl">Something went wrong</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            An error occurred while loading this page.
          </p>
        </CardHeader>

        <CardContent>
          {error.message && (
            <pre className="overflow-auto rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
              {error.message}
              {error.digest && `\n[digest: ${error.digest}]`}
            </pre>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap justify-center gap-3">
          <Button size="sm" onClick={reset}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Try Again
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <Home className="mr-2 h-3.5 w-3.5" />
            Go to Dashboard
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
