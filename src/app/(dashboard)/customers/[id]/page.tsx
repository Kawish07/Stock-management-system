'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { CustomerDetail } from '@/components/customers/CustomerDetail';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Detail"
        description="View balances, recent invoices, and customer profile"
      />
      <CustomerDetail customerId={id} />
    </div>
  );
}
