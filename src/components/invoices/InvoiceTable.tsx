'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/hooks/useInvoice';
import { downloadInvoicePdf } from '@/lib/pdf';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { Receipt, Plus, Download, Eye, Loader2 } from 'lucide-react';
import type { InvoiceRecord } from '@/types/invoice.types';

function SourceBadge({ source }: { source: InvoiceRecord['source'] }) {
  return source === 'erpnext' ? (
    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px]">
      ERP
    </Badge>
  ) : (
    <Badge className="bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-100 text-[10px]">
      Local
    </Badge>
  );
}

export function InvoiceTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [customer, setCustomer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [debouncedCustomer, setDebouncedCustomer] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const { data, isLoading, isError, error, refetch } = useInvoices({
    customer: debouncedCustomer || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const handleCustomerChange = (v: string) => {
    setCustomer(v);
    clearTimeout((window as Window & { _custTimer?: ReturnType<typeof setTimeout> })._custTimer);
    (window as Window & { _custTimer?: ReturnType<typeof setTimeout> })._custTimer = setTimeout(() => {
      setDebouncedCustomer(v);
      setPage(1);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Customer</Label>
            <Input
              className="h-8 w-44 text-sm"
              placeholder="Search customer…"
              value={customer}
              onChange={(e) => handleCustomerChange(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              className="h-8 w-36 text-sm"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              className="h-8 w-36 text-sm"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            />
          </div>
          {(customer || fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="self-end h-8 text-xs"
              onClick={() => {
                setCustomer('');
                setDebouncedCustomer('');
                setFromDate('');
                setToDate('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => router.push('/invoices/new')}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Invoice
        </Button>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : isError ? (
        <TableErrorState
          error={(error as Error)?.message || 'Failed to load invoices'}
          onRetry={() => refetch()}
        />
      ) : !data?.data.length ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create your first sales invoice to get started."
          action={{ label: 'New Invoice', onClick: () => router.push('/invoices/new') }}
        />
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900">
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <TableCell className="font-mono text-xs text-zinc-500 max-w-[140px] truncate">
                      {inv.id}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{inv.item_name || inv.item_code}</TableCell>
                    <TableCell className="text-sm">{inv.customer}</TableCell>
                    <TableCell className="text-right text-sm">{inv.qty.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">
                      {inv.rate > 0
                        ? `PKR ${inv.rate.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      PKR {inv.total.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.date}</TableCell>
                    <TableCell>
                      <SourceBadge source={inv.source} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View invoice"
                          onClick={() => router.push(`/invoices/${encodeURIComponent(inv.id)}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Download PDF"
                          disabled={downloadingId === inv.id}
                          onClick={async () => {
                            setDownloadingId(inv.id);
                            try { await downloadInvoicePdf(inv); }
                            finally { setDownloadingId(null); }
                          }}
                        >
                          {downloadingId === inv.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Download className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages} &bull; {data.total} invoices
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
