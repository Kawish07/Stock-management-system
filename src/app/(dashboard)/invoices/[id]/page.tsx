'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useInvoice, useCancelInvoice, useMarkInvoicePaid } from '@/hooks/useInvoice';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { InvoicePrint } from '@/components/invoices/InvoicePrint';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, ArrowLeft, XCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const name = decodeURIComponent(id ?? '');

  const { data: invoice, isLoading, isError } = useInvoice(name);
  const cancelInvoice = useCancelInvoice();
  const markInvoicePaid = useMarkInvoicePaid();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-4">
        <Link href="/invoices" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  const isDraft = invoice.docstatus === 0;
  const isSubmitted = invoice.docstatus === 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/invoices" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 print:hidden')}>
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <div className="flex items-center gap-2">
          {isSubmitted && (invoice.outstanding_amount ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-emerald-600 hover:text-emerald-600 print:hidden"
              disabled={markInvoicePaid.isPending}
              onClick={() => markInvoicePaid.mutate(invoice.name!)}
            >
              <CheckCircle2 className="h-4 w-4" /> Record Payment
            </Button>
          )}
          {isSubmitted && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive print:hidden"
              onClick={() => setConfirmCancel(true)}
            >
              <XCircle className="h-4 w-4" /> Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        title={`Invoice ${invoice.name}`}
        description={
          isDraft ? 'Draft â€” edit and submit when ready'
          : isSubmitted ? 'Submitted'
          : 'Cancelled'
        }
      />

      {isDraft && <InvoiceForm existing={invoice} />}
      {!isDraft && <InvoicePrint invoice={invoice} />}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={(open) => { if (!open) setConfirmCancel(false); }}
        title="Cancel Invoice"
        description={`Cancel invoice ${invoice.name}? Stock will be reversed and this cannot be undone.`}
        confirmLabel="Cancel Invoice"
        variant="destructive"
        isLoading={cancelInvoice.isPending}
        onConfirm={() => {
          cancelInvoice.mutate(invoice.name!);
          setConfirmCancel(false);
        }}
      />
    </div>
  );
}
