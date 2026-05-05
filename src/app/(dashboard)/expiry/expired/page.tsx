'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { ExpiryFilteredTable } from '@/components/expiry/ExpiryFilteredTable';

export default function ExpiredPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Expired Products"
        description="Products that have passed their expiry date — edit or remove as needed"
      />
      <ExpiryFilteredTable mode="expired" />
    </div>
  );
}
