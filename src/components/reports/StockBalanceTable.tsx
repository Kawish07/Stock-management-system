'use client';

import { useState } from 'react';
import { useStockBalance } from '@/hooks/useReports';
import { useWarehouses } from '@/hooks/useWarehouses';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber, formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search, X, BarChart3, Loader2 } from 'lucide-react';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { downloadStockBalancePdf } from '@/lib/pdf';
import type { StockBalanceFilters, StockBalanceRow } from '@/services/reports.service';

function exportCSV(rows: StockBalanceRow[]) {
  const headers = [
    'Item Code', 'Item Name', 'Warehouse',
    'Opening', 'In', 'Out', 'Balance Qty', 'Rate', 'Value',
  ];
  const csvRows = rows.map((r) =>
    [
      `"${r.item_code ?? ''}"`,
      `"${r.item_name ?? ''}"`,
      `"${r.warehouse ?? ''}"`,
      r.opening_qty ?? 0,
      r.in_qty ?? 0,
      r.out_qty ?? 0,
      r.bal_qty ?? 0,
      r.val_rate ?? 0,
      r.bal_val ?? 0,
    ].join(',')
  );
  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stock-balance-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function StockBalanceTable() {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<StockBalanceFilters>({
    item_code: '',
    warehouse: '',
    from_date: '',
    to_date: today,
  });
  const [activeFilters, setActiveFilters] = useState<StockBalanceFilters>({});
  const [submitted, setSubmitted] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: warehouses = [] } = useWarehouses();
  const { data = [], isLoading, isError, error, refetch } = useStockBalance(activeFilters, submitted);

  const totals = data.reduce(
    (acc, row) => ({
      opening_qty: acc.opening_qty + (row.opening_qty ?? 0),
      in_qty: acc.in_qty + (row.in_qty ?? 0),
      out_qty: acc.out_qty + (row.out_qty ?? 0),
      bal_qty: acc.bal_qty + (row.bal_qty ?? 0),
      bal_val: acc.bal_val + (row.bal_val ?? 0),
    }),
    { opening_qty: 0, in_qty: 0, out_qty: 0, bal_qty: 0, bal_val: 0 }
  );

  const generateReport = () => {
    setActiveFilters({
      item_code: form.item_code || undefined,
      warehouse: form.warehouse || undefined,
      from_date: form.from_date || undefined,
      to_date: form.to_date || undefined,
    });
    setSubmitted(true);
  };

  const clearFilters = () => {
    const reset: StockBalanceFilters = { item_code: '', warehouse: '', from_date: '', to_date: today };
    setForm(reset);
    setActiveFilters({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-4">
      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sb-item">Item Code</Label>
            <Input
              id="sb-item"
              placeholder="Search item code…"
              value={form.item_code}
              onChange={(e) => setForm((f) => ({ ...f, item_code: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sb-warehouse">Warehouse</Label>
            <Select
              value={form.warehouse || '__all__'}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, warehouse: v === '__all__' ? '' : (v ?? '') }))
              }
            >
              <SelectTrigger id="sb-warehouse">
                <SelectValue placeholder="All warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All warehouses</SelectItem>
                {warehouses
                  .filter((w) => !w.is_group)
                  .map((w) => (
                    <SelectItem key={w.name} value={w.name}>
                      {w.warehouse_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sb-from">From Date</Label>
            <Input
              id="sb-from"
              type="date"
              value={form.from_date}
              onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sb-to">To Date</Label>
            <Input
              id="sb-to"
              type="date"
              value={form.to_date}
              onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={generateReport} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
          {data.length > 0 && (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => exportCSV(data)}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                disabled={pdfLoading}
                onClick={async () => {
                  setPdfLoading(true);
                  try { await downloadStockBalancePdf(data, activeFilters); }
                  finally { setPdfLoading(false); }
                }}
              >
                {pdfLoading
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <Download className="h-4 w-4 mr-2" />}
                {pdfLoading ? 'Generating…' : 'Export PDF'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {!submitted ? (
        <div className="rounded-md border p-14 text-center text-muted-foreground text-sm">
          Set filters and click &ldquo;Generate Report&rdquo; to view stock balance.
        </div>
      ) : isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : isError ? (
        <TableErrorState
          error={(error as Error)?.message ?? 'Something went wrong'}
          onRetry={() => refetch()}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data to display"
          description="Adjust filters and generate report"
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Out</TableHead>
                <TableHead className="text-right">Balance Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.item_code}</TableCell>
                  <TableCell>{row.item_name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.warehouse}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.opening_qty ?? 0)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {formatNumber(row.in_qty ?? 0)}
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-medium">
                    {formatNumber(row.out_qty ?? 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatNumber(row.bal_qty ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.val_rate ?? 0)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(row.bal_val ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">
                  Grand Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatNumber(totals.opening_qty)}
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  {formatNumber(totals.in_qty)}
                </TableCell>
                <TableCell className="text-right font-bold text-red-600">
                  {formatNumber(totals.out_qty)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatNumber(totals.bal_qty)}
                </TableCell>
                <TableCell />
                <TableCell className="text-right font-bold">
                  {formatCurrency(totals.bal_val)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
