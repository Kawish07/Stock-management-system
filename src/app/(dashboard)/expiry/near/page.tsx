'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { ExpiryFilteredTable } from '@/components/expiry/ExpiryFilteredTable';

export default function NearExpiryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Near Expiry"
        description="Products expiring within the next 60 days — edit or remove as needed"
      />
      <ExpiryFilteredTable mode="near" />
    </div>
  );
}
