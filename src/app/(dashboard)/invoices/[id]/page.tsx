'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invoiceService } from '@/services/invoice.service';
import { downloadInvoicePdf } from '@/lib/pdf';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Loader2, Receipt } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { InvoiceRecord } from '@/types/invoice.types';

function pkr(amount: number) {
  return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    invoiceService.getInvoiceById(decodeURIComponent(id)).then((inv) => {
      setInvoice(inv);
      setLoading(false);
    });
  }, [id]);

  const handleDownload = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      await downloadInvoicePdf(invoice);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <Link href="/invoices" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
      </div>

      <PageHeader
        title="Invoice Preview"
        description={`Invoice ID: ${invoice.id}`}
        actions={
          <Button
            onClick={handleDownload}
            disabled={pdfLoading}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </Button>
        }
      />

      {/* ── Invoice card (visual preview) ── */}
      <Card className="border-2 border-indigo-100 dark:border-indigo-900 shadow-sm">
        {/* Brand header */}
        <div className="bg-indigo-600 rounded-t-lg px-6 py-5 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-lg">
                {process.env.NEXT_PUBLIC_APP_NAME ?? 'StockFlow'}
              </span>
            </div>
            <p className="text-indigo-200 text-xs mt-0.5">ERPNext Stock Management</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-base uppercase tracking-wide">Sales Invoice</p>
            <p className="text-indigo-200 text-xs mt-0.5">{invoice.date}</p>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Invoice ID</p>
                <p className="font-mono text-sm font-medium">{invoice.id}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Date</p>
                <p className="text-sm">{invoice.date}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Source</p>
                <Badge className={
                  invoice.source === 'erpnext'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                }>
                  {invoice.source === 'erpnext' ? 'ERPNext' : 'Local'}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Customer</p>
                <p className="text-sm font-medium">{invoice.customer || 'Walk-in Customer'}</p>
              </div>
              {invoice.warehouse && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Warehouse</p>
                  <p className="text-sm">{invoice.warehouse}</p>
                </div>
              )}
              {invoice.remarks && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Remarks</p>
                  <p className="text-sm text-muted-foreground">{invoice.remarks}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Items table */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-3">Items</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold">#</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold">Product</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold">Item Code</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold">Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold">Unit Price</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-zinc-50 dark:bg-zinc-900">
                    <td className="px-4 py-3 text-muted-foreground">1</td>
                    <td className="px-4 py-3 font-medium">{invoice.item_name || invoice.item_code}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{invoice.item_code}</td>
                    <td className="px-4 py-3 text-right">{invoice.qty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{pkr(invoice.rate)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{pkr(invoice.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{pkr(invoice.total)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-indigo-600 dark:text-indigo-400">
                <span>Grand Total</span>
                <span>{pkr(invoice.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="bg-indigo-600 rounded-b-lg px-6 py-3 text-center">
          <p className="text-indigo-200 text-xs">
            Generated by {process.env.NEXT_PUBLIC_APP_NAME ?? 'StockFlow'} &middot; {new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </Card>
    </div>
  );
}
