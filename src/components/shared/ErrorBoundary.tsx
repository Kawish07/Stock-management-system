'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Optional custom fallback — replaces the default error card */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

/**
 * Wrap any component tree that might throw during render.
 *
 * ```tsx
 * <ErrorBoundary>
 *   <SomeUnstableWidget />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopy = async () => {
    const text = [
      `Error: ${this.state.error?.message ?? 'Unknown'}`,
      '',
      this.state.error?.stack ?? '',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // clipboard not available — silently ignore
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-lg dark:border-red-900 dark:bg-zinc-950">
          <div className="flex flex-col items-center gap-5 text-center">
            {/* Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>

            {/* Text */}
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Component Error
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {this.state.error?.message ?? 'An unexpected error occurred.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button size="sm" onClick={this.handleReload}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Reload Page
              </Button>
              <Button size="sm" variant="outline" onClick={this.handleCopy}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                {this.state.copied ? 'Copied!' : 'Report Issue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
