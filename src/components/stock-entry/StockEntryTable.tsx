'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStockEntries } from '@/hooks/useStockEntry';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { Plus, Eye, ArrowLeftRight } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import { STOCK_ENTRY_TYPES } from '@/lib/validators/stockEntry.schema';
import type { StockEntry } from '@/types/stockEntry.types';

const STATUS_BADGE: Record<number, string> = {
  0: 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100',
  1: 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-100',
  2: 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-100',
};

const STATUS_LABELS: Record<number, string> = {
  0: 'Draft',
  1: 'Submitted',
  2: 'Cancelled',
};

function StatusBadge({ docstatus }: { docstatus: number }) {
  return (
    <Badge className={STATUS_BADGE[docstatus] ?? 'bg-gray-100 text-gray-800 border border-gray-200'}>
      {STATUS_LABELS[docstatus] ?? 'Unknown'}
    </Badge>
  );
}

export function StockEntryTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const hasFilters = !!(typeFilter || statusFilter || fromDate || toDate);

  const activeFilters = {
    page,
    pageSize: 20,
    stock_entry_type: typeFilter || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    docstatus:
      statusFilter !== ''
        ? (Number(statusFilter) as 0 | 1 | 2)
        : undefined,
  };

  const { data, isLoading, isError, error, refetch } = useStockEntries(activeFilters);
  const entries: StockEntry[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={typeFilter || '__all__'}
            onValueChange={(v) => {
              setTypeFilter(v === '__all__' ? '' : (v ?? ''));
              resetPage();
            }}
          >
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {STOCK_ENTRY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={statusFilter || '__all__'}
            onValueChange={(v) => {
              setStatusFilter(v === '__all__' ? '' : (v ?? ''));
              resetPage();
            }}
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              <SelectItem value="0">Draft</SelectItem>
              <SelectItem value="1">Submitted</SelectItem>
              <SelectItem value="2">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From Date</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); resetPage(); }}
            className="w-40 h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To Date</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); resetPage(); }}
            className="w-40 h-8 text-sm"
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              setTypeFilter('');
              setStatusFilter('');
              setFromDate('');
              setToDate('');
              resetPage();
            }}
          >
            Clear filters
          </Button>
        )}

        <div className="ml-auto">
          <Link href="/stock-entries/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Link>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : isError ? (
        <TableErrorState
          error={(error as Error)?.message ?? 'Something went wrong'}
          onRetry={() => refetch()}
        />
      ) : entries.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No results found"
            description="Try adjusting your filters"
          />
        ) : (
          <EmptyState
            icon={ArrowLeftRight}
            title="No stock entries yet"
            description="Create your first stock entry"
          />
        )
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">No. of Items</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.name}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    router.push(`/stock-entries/${encodeURIComponent(entry.name!)}`)
                  }
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {entry.name}
                  </TableCell>
                  <TableCell className="text-sm">{entry.stock_entry_type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(entry.posting_date)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {entry.items?.length ?? '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {entry.total_amount != null
                      ? formatNumber(entry.total_amount)
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge docstatus={entry.docstatus} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/stock-entries/${encodeURIComponent(entry.name!)}`}
                      className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}