'use client';

import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const defaultCustomer = searchParams.get('customer') ?? undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/invoices"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Link>
      </div>
      <PageHeader
        title="New Sales Invoice"
        description="Add items, apply taxes and submit to finalize billing"
      />
      <InvoiceForm defaultCustomer={defaultCustomer} />
    </div>
  );
}
