'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices, useSubmitInvoice, useCancelInvoice, useMarkInvoicePaid } from '@/hooks/useInvoice';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Receipt, Plus, Eye, Send, XCircle, ChevronLeft, ChevronRight,
  FileText, DollarSign, Clock, CheckCircle2,
} from 'lucide-react';
import type { InvoiceListRow } from '@/types/invoice.types';

type Status = 'All' | 'Draft' | 'Unpaid' | 'Paid' | 'Cancelled';

function statusBadge(row: InvoiceListRow) {
  if (row.docstatus === 2)
    return <Badge variant="destructive" className="text-[11px]">Cancelled</Badge>;
  if (row.docstatus === 0)
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 text-[11px]">Draft</Badge>;
  if ((row.outstanding_amount ?? 0) <= 0)
    return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-[11px]">Paid</Badge>;
  return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-[11px]">Unpaid</Badge>;
}

function fmt(n: number) {
  return 'PKR ' + (n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function InvoiceTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState<Status>('All');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedCustomer, setDebouncedCustomer] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const { data, isLoading, isError, error, refetch } = useInvoices({
    search: debouncedSearch || undefined,
    customer: debouncedCustomer || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    status: status === 'All' ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const submitInvoice = useSubmitInvoice();
  const cancelInvoice = useCancelInvoice();
  const markInvoicePaid = useMarkInvoicePaid();

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const rows = data?.data ?? [];

  // stats
  const total = data?.total ?? 0;
  const totalAmt = rows.reduce((s, r) => s + (r.grand_total ?? 0), 0);
  const unpaidCount = rows.filter((r) => r.docstatus === 1 && (r.outstanding_amount ?? 0) > 0).length;
  const paidCount = rows.filter((r) => r.docstatus === 1 && (r.outstanding_amount ?? 0) <= 0).length;

  const debounce = useCallback((setter: (v: string) => void) => {
    let t: ReturnType<typeof setTimeout>;
    return (v: string) => {
      clearTimeout(t);
      t = setTimeout(() => { setter(v); setPage(1); }, 400);
    };
  }, []);

  const onSearchChange = useCallback(debounce(setDebouncedSearch), []);
  const onCustomerChange = useCallback(debounce(setDebouncedCustomer), []);

  return (
    <div className="space-y-4">
      {/* â”€â”€ Stats row â”€â”€ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoices', value: total, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Total Amount', value: fmt(totalAmt), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Unpaid', value: unpaidCount, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
          { label: 'Paid', value: paidCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-bold text-sm">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* â”€â”€ Toolbar â”€â”€ */}
      <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              className="h-8 w-44 text-sm"
              placeholder="Invoice # or customerâ€¦"
              onChange={(e) => { setSearch(e.target.value); onSearchChange(e.target.value); }}
              value={search}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Customer</Label>
            <Input
              className="h-8 w-36 text-sm"
              placeholder="Filter by customer"
              onChange={(e) => { setCustomer(e.target.value); onCustomerChange(e.target.value); }}
              value={customer}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" className="h-8 text-sm" value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" className="h-8 text-sm" value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => { setStatus(v as Status); setPage(1); }}>
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['All', 'Draft', 'Unpaid', 'Paid', 'Cancelled'] as Status[]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => router.push('/invoices/new')}>
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* â”€â”€ Table â”€â”€ */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : isError ? (
        <TableErrorState error={(error as Error)?.message} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="Create your first sales invoice"
          action={{ label: 'New Invoice', onClick: () => router.push('/invoices/new') }}
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-sm font-medium">{row.name}</TableCell>
                  <TableCell>{row.customer_name || row.customer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.posting_date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.due_date}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(row.grand_total)}</TableCell>
                  <TableCell>{statusBadge(row)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="View"
                        onClick={() => router.push(`/invoices/${encodeURIComponent(row.name)}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {row.docstatus === 0 && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-green-600"
                          title="Submit"
                          disabled={submitInvoice.isPending}
                          onClick={() => submitInvoice.mutate(row.name)}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {row.docstatus === 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600"
                          title="Record Payment"
                          disabled={(row.outstanding_amount ?? 0) <= 0 || markInvoicePaid.isPending}
                          onClick={() => markInvoicePaid.mutate(row.name)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {row.docstatus === 1 && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          title="Cancel"
                          onClick={() => setCancelTarget(row.name)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* â”€â”€ Pagination â”€â”€ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} ({data?.total} total)</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* â”€â”€ Cancel confirm â”€â”€ */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
        title="Cancel Invoice"
        description={`Cancel invoice ${cancelTarget}? This cannot be undone.`}
        confirmLabel="Cancel Invoice"
        variant="destructive"
        isLoading={cancelInvoice.isPending}
        onConfirm={() => {
          if (cancelTarget) cancelInvoice.mutate(cancelTarget);
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
