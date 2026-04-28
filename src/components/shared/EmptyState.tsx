import { PackageSearch } from 'lucide-react';
import type { ElementType } from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: ElementType;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  icon: Icon = PackageSearch,
  title = 'No results found',
  description = 'Try adjusting your filters or create a new entry.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4 px-6">
      <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4">
        <Icon className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
      </div>
      <div className="max-w-xs">
        <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
