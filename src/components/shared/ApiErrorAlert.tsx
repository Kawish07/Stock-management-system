import { AlertCircle, X } from 'lucide-react';

interface ApiErrorAlertProps {
  /** Error message to display. Renders nothing when null or empty. */
  error: string | null;
  /** Called when the user dismisses the alert. */
  onDismiss: () => void;
}

/**
 * Inline error banner for forms and tables.
 *
 * ```tsx
 * const [apiError, setApiError] = useState<string | null>(null);
 *
 * <ApiErrorAlert error={apiError} onDismiss={() => setApiError(null)} />
 * ```
 */
export function ApiErrorAlert({ error, onDismiss }: ApiErrorAlertProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-red-900 dark:bg-red-950/40"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />

      <p className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</p>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 rounded text-red-400 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-600 dark:hover:text-red-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
