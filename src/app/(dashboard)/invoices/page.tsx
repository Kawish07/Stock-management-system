'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices"
        description="All sales transactions and stock deductions"
      />
      <InvoiceTable />
    </div>
  );
}
