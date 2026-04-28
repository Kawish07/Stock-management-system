'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { StockEntryTable } from '@/components/stock-entry/StockEntryTable';

export default function StockEntriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Entries"
        description="Manage stock movements"
      />
      <StockEntryTable />
    </div>
  );
}

