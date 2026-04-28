'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

type BannerState = 'offline' | 'restored' | null;

/**
 * Slides a banner in from the top of the viewport on network changes.
 * - Offline → red banner (stays until back online)
 * - Restored → green banner (auto-hides after 3 s)
 *
 * Add this once, high up in the layout tree.
 */
export function NetworkStatus() {
  const [banner, setBanner] = useState<BannerState>(null);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    const handleOffline = () => {
      clearTimeout(hideTimer);
      setBanner('offline');
    };

    const handleOnline = () => {
      setBanner('restored');
      hideTimer = setTimeout(() => setBanner(null), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!banner) return null;

  const isOffline = banner === 'offline';

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed left-0 right-0 top-0 z-[200]',
        'flex items-center justify-center gap-2 px-4 py-2.5',
        'text-sm font-medium text-white',
        'animate-in slide-in-from-top-full duration-300',
        isOffline ? 'bg-red-600' : 'bg-emerald-600',
      ].join(' ')}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          <span>⚠️ No internet connection. Changes may not be saved.</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 shrink-0" aria-hidden />
          <span>✅ Back online</span>
        </>
      )}
    </div>
  );
}
