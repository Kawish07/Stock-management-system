'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useInvoices } from '@/hooks/useInvoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InvoiceListRow } from '@/types/invoice.types';

function money(n: number) {
  return `PKR ${(n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusLabel(row: InvoiceListRow) {
  if (row.docstatus === 2) return 'Cancelled';
  if (row.docstatus === 0) return 'Draft';
  return (row.outstanding_amount ?? 0) > 0 ? 'Unpaid' : 'Paid';
}

function statusBadge(row: InvoiceListRow) {
  const label = statusLabel(row);
  if (label === 'Cancelled') return <Badge variant="destructive">Cancelled</Badge>;
  if (label === 'Draft') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Draft</Badge>;
  if (label === 'Unpaid') return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Unpaid</Badge>;
  return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Paid</Badge>;
}

export default function SalesReportPage() {
  const [customer, setCustomer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState<'All' | 'Draft' | 'Unpaid' | 'Paid' | 'Cancelled'>('All');

  const { data, isLoading, isError } = useInvoices({
    customer: customer || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    status: status === 'All' ? undefined : status,
    page: 1,
    pageSize: 300,
  });

  const rows = data?.data ?? [];

  const summary = useMemo(() => {
    const activeRows = rows.filter((r) => r.docstatus !== 2);
    const totalRevenue = activeRows.reduce((s, r) => s + (r.grand_total ?? 0), 0);
    const totalUnpaid = activeRows.reduce((s, r) => s + (r.outstanding_amount ?? 0), 0);
    const totalPaid = totalRevenue - totalUnpaid;
    return { totalRevenue, totalPaid, totalUnpaid };
  }, [rows]);

  const exportCsv = () => {
    const header = ['Invoice No', 'Customer', 'Date', 'Amount', 'Status'];
    const lines = rows.map((r) => [
      r.name,
      r.customer_name || r.customer,
      r.posting_date,
      String(r.grand_total ?? 0),
      statusLabel(r),
    ]);

    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Report"
        description="Invoice-level sales overview with payment status"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Customer</Label>
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Filter by customer" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'All' | 'Draft' | 'Unpaid' | 'Paid' | 'Cancelled')}
          >
            <option value="All">All</option>
            <option value="Draft">Draft</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading report...</TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-red-600">Failed to load sales report.</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No invoices found for selected filters.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-mono text-sm">{row.name}</TableCell>
                  <TableCell>{row.customer_name || row.customer}</TableCell>
                  <TableCell>{row.posting_date}</TableCell>
                  <TableCell className="text-right">{money(row.grand_total ?? 0)}</TableCell>
                  <TableCell>{statusBadge(row)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-xl font-bold mt-1">{money(summary.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Paid</p>
          <p className="text-xl font-bold mt-1 text-green-600">{money(summary.totalPaid)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Unpaid</p>
          <p className="text-xl font-bold mt-1 text-orange-600">{money(summary.totalUnpaid)}</p>
        </div>
      </div>
    </div>
  );
}
