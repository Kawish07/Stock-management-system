'use client';

import Link from 'next/link';
import { ShieldX, Home, Mail } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export default function ForbiddenPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-red-100 dark:bg-red-950 opacity-40 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-orange-100 dark:bg-orange-950 opacity-40 blur-3xl animate-pulse [animation-delay:1.5s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/60 ring-1 ring-red-100 dark:ring-red-800">
          <ShieldX className="h-12 w-12 text-red-500 dark:text-red-400" />
        </div>

        {/* 403 */}
        <p className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-8xl font-black text-transparent select-none leading-none mb-4">
          403
        </p>

        {/* Title & description */}
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Access Forbidden
        </h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          You don&apos;t have permission to access this page.
          Contact your administrator to request access.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className={buttonVariants({ size: 'default' })}>
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
            <a
              href="mailto:admin@example.com?subject=Access Request"
              className={buttonVariants({ variant: 'outline', size: 'default' })}
            >
              <Mail className="mr-2 h-4 w-4" />
              Request Access
            </a>
        </div>

        {/* Current user */}
        {user?.email && (
          <p className="mt-8 text-xs text-zinc-400 dark:text-zinc-600">
            Signed in as{' '}
            <span className="font-medium text-zinc-500 dark:text-zinc-400">{user.email}</span>
          </p>
        )}
      </div>
    </div>
  );
}
