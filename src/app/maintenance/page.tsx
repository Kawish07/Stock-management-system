'use client';

import { useEffect, useState } from 'react';
import { Wrench, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

export default function MaintenancePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(60);
  const [checking, setChecking] = useState(false);

  /** Try to reach the API; if successful redirect to dashboard */
  const checkAndRedirect = async () => {
    setChecking(true);
    try {
      await axiosInstance.get('/method/frappe.auth.get_logged_user', { timeout: 5000 });
      router.push('/dashboard');
    } catch {
      // Still down — stay on maintenance page
    } finally {
      setChecking(false);
    }
  };

  // Auto-refresh countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          checkAndRedirect();
          return 60;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center bg-muted/40">
      <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-8">
        <Wrench className="h-16 w-16 text-amber-500" />
      </div>

      <div className="max-w-md space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          System Under Maintenance
        </h1>
        <p className="text-muted-foreground">
          We&apos;re performing scheduled maintenance on the ERPNext backend. We&apos;ll be back
          shortly.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={checkAndRedirect} disabled={checking} variant="default" size="lg">
          {checking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Now
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Auto-checking in{' '}
          <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
            {countdown}s
          </span>
        </p>
      </div>
    </div>
  );
}
