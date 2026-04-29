import axios from 'axios';

export interface ApiErrorResult {
  /** Human-readable message safe to show in the UI */
  message: string;
  /** HTTP status code, or 0 for network / timeout errors */
  errorCode: number;
  /** true when the session has expired — caller should clear auth state */
  shouldLogout: boolean;
  /** true when the user is not authorised — caller should redirect */
  shouldRedirect: boolean;
  /** Where to redirect when shouldRedirect is true */
  redirectTo: string;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid data. Please check your inputs.',
  401: 'Session expired. Please login again.',
  403: "You don't have permission to do this.",
  404: 'The requested resource was not found.',
  417: 'Invalid field in request. Contact support.',
  500: 'Server error. Please try again later.',
};

export function handleApiError(error: unknown): ApiErrorResult {
  // ── Axios errors ─────────────────────────────────────────────────────────
  if (axios.isAxiosError(error)) {
    // No response → network / timeout
    if (!error.response) {
      const isTimeout =
        error.code === 'ECONNABORTED' ||
        error.message.toLowerCase().includes('timeout');

      return {
        message: isTimeout
          ? 'Request timed out. Please try again.'
          : 'No internet connection. Check your network.',
        errorCode: 0,
        shouldLogout: false,
        shouldRedirect: false,
        redirectTo: '',
      };
    }

    const status = error.response.status;

    // For 400/417 try to extract the real ERPNext server message
    let message = STATUS_MESSAGES[status] ?? 'An unexpected error occurred.';
    try {
      const data = error.response.data as Record<string, unknown>;
      const directMessage = data?.message;
      if (typeof directMessage === 'string' && directMessage.trim()) {
        message = directMessage.replace(/<[^>]*>/g, '').trim();
      }

      const raw = data?._server_messages as string | undefined;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ message?: string } | string>;
        const first = parsed[0];
        const text = typeof first === 'string'
          ? (JSON.parse(first) as { message?: string }).message
          : first?.message;
        if (text) {
          // Strip HTML tags from the message
          message = text.replace(/<[^>]*>/g, '').trim();

          if (message.toLowerCase().includes('common names and surnames are easy to guess')) {
            message = 'Password is too weak. Use at least 8 characters with uppercase, lowercase, number, and special symbol. Avoid using names.';
          }
        }
      }
    } catch {
      // fall back to generic message
    }

    return {
      message,
      errorCode: status,
      shouldLogout: status === 401,
      shouldRedirect: false,
      redirectTo: '',
    };
  }

  // ── Plain Error objects ───────────────────────────────────────────────────
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('network')) {
      return {
        message: 'No internet connection. Check your network.',
        errorCode: 0,
        shouldLogout: false,
        shouldRedirect: false,
        redirectTo: '',
      };
    }

    if (msg.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        errorCode: 0,
        shouldLogout: false,
        shouldRedirect: false,
        redirectTo: '',
      };
    }

    return {
      message: error.message,
      errorCode: 0,
      shouldLogout: false,
      shouldRedirect: false,
      redirectTo: '',
    };
  }

  // ── Unknown ───────────────────────────────────────────────────────────────
  return {
    message: 'An unexpected error occurred.',
    errorCode: 0,
    shouldLogout: false,
    shouldRedirect: false,
    redirectTo: '',
  };
}
