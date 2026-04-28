'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useItems, useDeleteItem } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useCategories';
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { Edit, Trash2, Search, Package } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { Item } from '@/types/item.types';

const LIMIT = 20;

function StockStatusBadge({ item }: { item: Item }) {
  const qty = item.actual_qty ?? 0;

  if (qty === 0) {
    return (
      <Badge className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-100">
        Out of Stock
      </Badge>
    );
  }
  if (qty < 10) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100">
        Low Stock
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">
      In Stock
    </Badge>
  );
}

export function ItemsTable() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [itemGroup, setItemGroup] = useState('');
  const [start, setStart] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{ name: string; item_name: string } | null>(null);

  // Debounce search input 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setStart(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useItems({
    search: debouncedSearch || undefined,
    item_group: itemGroup || undefined,
    limit: LIMIT,
    start,
  });

  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.flat ?? [];
  const deleteItem = useDeleteItem();

  const items: Item[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const hasPrev = start > 0;
  const hasNext = start + LIMIT < total;
  const currentPage = Math.floor(start / LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={itemGroup}
          onChange={(e) => {
            setItemGroup(e.target.value);
            setStart(0);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.name} value={cat.name}>
              {cat.item_group_name}
            </option>
          ))}
        </select>
      </div>

      {/* Table body */}
      {isLoading ? (
        <LoadingSkeleton rows={5} columns={8} />
      ) : isError ? (
        <TableErrorState
          error={(error as Error)?.message ?? 'Something went wrong'}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        debouncedSearch || itemGroup ? (
          <EmptyState
            icon={Search}
            title="No results found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <EmptyState
            icon={Package}
            title="No items found"
            description="Add your first item to get started"
            action={{ label: '+ Add Item', onClick: () => router.push('/items/new') }}
          />
        )
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead className="text-right">Stock Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell>{item.item_group}</TableCell>
                  <TableCell>{item.stock_uom}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(item.actual_qty ?? 0, 0)}
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge item={item} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/items/${encodeURIComponent(item.name)}`}
                        className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ name: item.name, item_name: item.item_name ?? item.name })}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasNext) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({total} items)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStart((s) => Math.max(0, s - LIMIT))}
              disabled={!hasPrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStart((s) => s + LIMIT)}
              disabled={!hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.item_name}"?`}
        description={`This action cannot be undone. This will permanently delete "${deleteTarget?.item_name}" and all associated data.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem.mutate(deleteTarget.name, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        isLoading={deleteItem.isPending}
      />
    </div>
  );
}
