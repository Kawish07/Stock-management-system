'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileSearch, Home, ArrowLeft, Layers } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white dark:bg-zinc-950 px-4">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-100 dark:bg-indigo-950 opacity-50 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-100 dark:bg-purple-950 opacity-50 blur-3xl animate-pulse [animation-delay:1.5s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/30">
          <Layers className="h-7 w-7 text-white" />
        </div>

        {/* Icon */}
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-100 dark:ring-indigo-800">
          <FileSearch className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
        </div>

        {/* 404 */}
        <p className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-8xl font-black text-transparent select-none leading-none mb-4">
          404
        </p>

        {/* Title & description */}
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Page Not Found
        </h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          The page you are looking for doesn&apos;t exist or has been moved.
          Check the URL or return to the dashboard.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className={buttonVariants({ size: 'default' })}>
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          <Button variant="outline" size="default" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

