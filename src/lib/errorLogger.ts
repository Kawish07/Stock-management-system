/**
 * Centralised error logger.
 * In development: logs to the console.
 * In production: ready to forward to an external monitoring service
 * (e.g. Sentry, Datadog, LogRocket) — just extend the `production` block.
 */

interface ErrorContext {
  context: string;
  timestamp: string;
  url: string;
  userEmail?: string;
  errorMessage: string;
  stack?: string;
}

function buildContext(error: Error, context: string): ErrorContext {
  return {
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userEmail: getUserEmail(),
    errorMessage: error.message,
    stack: error.stack,
  };
}

/** Reads the logged-in user e-mail from Zustand's persisted store without importing the store
 *  (avoids circular deps). Returns undefined when unavailable (e.g. server-side). */
function getUserEmail(): string | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    const raw = localStorage.getItem('auth-store');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { state?: { user?: { email?: string } } };
    return parsed?.state?.user?.email;
  } catch {
    return undefined;
  }
}

export function logError(error: Error, context: string): void {
  const payload = buildContext(error, context);

  if (process.env.NODE_ENV === 'development') {
    console.error(
      `[ErrorLogger] [${payload.timestamp}] ${payload.context}`,
      '\n  URL      :', payload.url,
      '\n  User     :', payload.userEmail ?? 'unknown',
      '\n  Message  :', payload.errorMessage,
      ...(payload.stack ? ['\n  Stack    :', payload.stack] : []),
    );
    return;
  }

  // ── Production: forward to your monitoring service ──────────────────────
  // Example: Sentry
  // if (typeof Sentry !== 'undefined') {
  //   Sentry.withScope((scope) => {
  //     scope.setTag('context', payload.context);
  //     if (payload.userEmail) scope.setUser({ email: payload.userEmail });
  //     Sentry.captureException(error);
  //   });
  // }

  // Fallback: still log in production so server logs capture it
  console.error('[ErrorLogger]', JSON.stringify(payload));
}

/** Convenience helper for non-Error objects (e.g. unknown catch values). */
export function logUnknownError(error: unknown, context: string): void {
  if (error instanceof Error) {
    logError(error, context);
  } else {
    logError(new Error(String(error)), context);
  }
}
