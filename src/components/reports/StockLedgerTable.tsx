'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStockLedger } from '@/hooks/useReports';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useItems } from '@/hooks/useItems';
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
import { formatDate, formatNumber } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search, X, BarChart3, Loader2 } from 'lucide-react';
import { downloadStockLedgerPdf } from '@/lib/pdf';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import type { StockLedgerFilters, StockLedgerRow } from '@/services/reports.service';

function exportCSV(rows: StockLedgerRow[]) {
  const headers = [
    'Date', 'Voucher Type', 'Voucher No', 'Particulars',
    'In Qty', 'Out Qty', 'Balance Qty', 'Valuation Rate', 'Stock Value',
  ];
  const csvRows = rows.map((r) => {
    const inQty = r.actual_qty > 0 ? r.actual_qty : 0;
    const outQty = r.actual_qty < 0 ? Math.abs(r.actual_qty) : 0;
    return [
      r.posting_date,
      `"${r.voucher_type ?? ''}"`,
      `"${r.voucher_no ?? ''}"`,
      `"${r.item_code ?? ''}"`,
      inQty,
      outQty,
      r.qty_after_transaction ?? 0,
      r.valuation_rate ?? 0,
      Math.abs(r.stock_value_difference ?? 0),
    ].join(',');
  });
  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stock-ledger-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function StockLedgerTable() {
  const router = useRouter();

  const [form, setForm] = useState<StockLedgerFilters>({
    item_code: '',
    warehouse: '',
    from_date: '',
    to_date: '',
  });
  const [activeFilters, setActiveFilters] = useState<StockLedgerFilters>({});
  const [submitted, setSubmitted] = useState(false);
  const [itemCodeError, setItemCodeError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: warehouses = [] } = useWarehouses();
  const { data: itemsData } = useItems({ limit: 500 });
  const items = itemsData?.data ?? [];

  const { data = [], isLoading, isError, error, refetch } = useStockLedger(activeFilters, submitted);

  const generateReport = () => {
    if (!form.item_code) {
      setItemCodeError('Item code is required');
      return;
    }
    setItemCodeError('');
    setActiveFilters({
      item_code: form.item_code,
      warehouse: form.warehouse || undefined,
      from_date: form.from_date || undefined,
      to_date: form.to_date || undefined,
    });
    setSubmitted(true);
  };

  const clearFilters = () => {
    const reset: StockLedgerFilters = { item_code: '', warehouse: '', from_date: '', to_date: '' };
    setForm(reset);
    setActiveFilters({});
    setSubmitted(false);
    setItemCodeError('');
  };

  return (
    <div className="space-y-4">
      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Item Code — required */}
          <div className="space-y-1.5">
            <Label htmlFor="sl-item">
              Item Code <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.item_code || '__none__'}
              onValueChange={(v) => {
                const val = v === '__none__' ? '' : (v ?? '');
                setForm((f) => ({ ...f, item_code: val }));
                if (val) setItemCodeError('');
              }}
            >
              <SelectTrigger
                id="sl-item"
                className={itemCodeError ? 'border-destructive' : ''}
              >
                <SelectValue placeholder="Select item…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select item…</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.name} value={item.item_code}>
                    {item.item_code}
                    {item.item_name && item.item_name !== item.item_code
                      ? ` — ${item.item_name}`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {itemCodeError && (
              <p className="text-xs text-destructive">{itemCodeError}</p>
            )}
          </div>

          {/* Warehouse */}
          <div className="space-y-1.5">
            <Label htmlFor="sl-warehouse">Warehouse</Label>
            <Select
              value={form.warehouse || '__all__'}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, warehouse: v === '__all__' ? '' : (v ?? '') }))
              }
            >
              <SelectTrigger id="sl-warehouse">
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
            <Label htmlFor="sl-from">From Date</Label>
            <Input
              id="sl-from"
              type="date"
              value={form.from_date}
              onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sl-to">To Date</Label>
            <Input
              id="sl-to"
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
                  try { await downloadStockLedgerPdf(data, activeFilters); }
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
          Select an item code and click &ldquo;Generate Report&rdquo; to view the stock ledger.
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
                <TableHead>Date</TableHead>
                <TableHead>Voucher Type</TableHead>
                <TableHead>Voucher No</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead className="text-right">In Qty</TableHead>
                <TableHead className="text-right">Out Qty</TableHead>
                <TableHead className="text-right">Balance Qty</TableHead>
                <TableHead className="text-right">Valuation Rate</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => {
                const inQty = row.actual_qty > 0 ? row.actual_qty : 0;
                const outQty = row.actual_qty < 0 ? Math.abs(row.actual_qty) : 0;
                return (
                  <TableRow key={idx}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(row.posting_date)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.voucher_type}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.voucher_type === 'Stock Entry' ? (
                        <button
                          onClick={() =>
                            router.push(
                              `/stock-entries/${encodeURIComponent(row.voucher_no)}`
                            )
                          }
                          className="text-primary hover:underline font-medium"
                        >
                          {row.voucher_no}
                        </button>
                      ) : (
                        <span>{row.voucher_no}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{row.item_code}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {inQty > 0 ? formatNumber(inQty) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {outQty > 0 ? formatNumber(outQty) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(row.qty_after_transaction ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(row.valuation_rate ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(Math.abs(row.stock_value_difference ?? 0))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

