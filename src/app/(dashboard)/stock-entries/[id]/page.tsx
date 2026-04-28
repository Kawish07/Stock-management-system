'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { buttonVariants } from '@/components/ui/button';
import { useStockEntry } from '@/hooks/useStockEntry';
import { StockEntryForm } from '@/components/stock-entry/StockEntryForm';
import { formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function StockEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: entry, isLoading } = useStockEntry(id);

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (!entry) {
    return (
      <p className="text-muted-foreground p-6">
        Stock entry not found.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={entry.name ?? 'Stock Entry'}
        description={`${entry.stock_entry_type} · ${formatDate(entry.posting_date)}`}
        actions={
          <Link
            href="/stock-entries"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        }
      />
      <StockEntryForm entry={entry} />
    </div>
  );
}
