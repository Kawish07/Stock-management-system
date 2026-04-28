'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';

type Status = 'connected' | 'disconnected' | 'checking';

export function ConnectionTest() {
  const [status, setStatus] = useState<Status>('checking');

  const check = async () => {
    try {
      await axiosInstance.get('/method/frappe.auth.get_logged_user', { timeout: 5000 });
      setStatus('connected');
    } catch {
      setStatus('disconnected');
    }
  };

  // Run immediately on mount, then every 30 seconds
  useEffect(() => {
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const label =
    status === 'connected'
      ? 'ERPNext API: Connected'
      : status === 'disconnected'
        ? 'ERPNext API: Disconnected'
        : 'ERPNext API: Checking…';

  const dotClass =
    status === 'connected'
      ? 'bg-green-500'
      : status === 'disconnected'
        ? 'bg-red-500'
        : 'bg-yellow-400 animate-pulse';

  return (
    <div
      title={label}
      aria-label={label}
      className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-default"
    >
      <span
        className={`h-2 w-2 rounded-full shrink-0 ${dotClass}`}
        aria-hidden="true"
      />
      <span className="hidden lg:inline">{status === 'checking' ? 'Checking…' : status === 'connected' ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}
