'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { StockEntryForm } from '@/components/stock-entry/StockEntryForm';

export default function NewStockEntryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Stock Entry"
        description="Create a new stock movement"
      />
      <StockEntryForm />
    </div>
  );
}

