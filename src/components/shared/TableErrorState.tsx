import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function TableErrorState({ error, onRetry }: TableErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4 px-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
      <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <div className="max-w-xs">
        <h3 className="font-semibold text-base text-red-900 dark:text-red-100">
          Failed to load data
        </h3>
        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
      </div>
      <Button
        variant="outline"
        onClick={onRetry}
        className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
      >
        Try Again
      </Button>
    </div>
  );
}
