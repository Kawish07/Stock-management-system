'use client';

import { useState } from 'react';
import { useNearExpiryItems, useExpiredItems, useSetItemExpiry } from '@/hooks/useExpiry';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { AlertTriangle, Clock, Edit, X, Search, Package, Loader2 } from 'lucide-react';
import { daysUntilExpiry } from '@/types/expiry.types';
import type { ExpiryItem } from '@/types/expiry.types';
import { format } from 'date-fns';

interface Props {
  mode: 'near' | 'expired';
}

function StatusBadge({ days, mode }: { days: number | null; mode: 'near' | 'expired' }) {
  if (days === null) return <span className="text-muted-foreground">—</span>;
  if (mode === 'expired') {
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">
        {Math.abs(days)}d overdue
      </Badge>
    );
  }
  if (days <= 7) {
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">
        {days}d left — Critical
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
      {days}d left
    </Badge>
  );
}

function EditExpiryDialog({
  item,
  onClose,
}: {
  item: ExpiryItem;
  onClose: () => void;
}) {
  const [date, setDate] = useState(item.custom_expiry_date ?? '');
  const setExpiry = useSetItemExpiry();

  const handleSave = async () => {
    if (!date) return;
    await setExpiry.mutateAsync({ itemCode: item.name, expiryDate: date });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Product</Label>
        <p className="text-sm font-medium">{item.item_name}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-expiry">Expiry Date *</Label>
        <Input
          id="edit-expiry"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!date || setExpiry.isPending}>
          {setExpiry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}

export function ExpiryFilteredTable({ mode }: Props) {
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<ExpiryItem | null>(null);
  const [clearTarget, setClearTarget] = useState<ExpiryItem | null>(null);
  const setExpiry = useSetItemExpiry();

  const nearQuery = useNearExpiryItems(60);
  const expiredQuery = useExpiredItems();

  const query = mode === 'near' ? nearQuery : expiredQuery;
  const allItems = (mode === 'near' ? nearQuery.data : expiredQuery.data) ?? [];

  const items = search
    ? allItems.filter(
        (i) =>
          i.item_name.toLowerCase().includes(search.toLowerCase()) ||
          i.item_code.toLowerCase().includes(search.toLowerCase())
      )
    : allItems;

  const handleClearExpiry = async () => {
    if (!clearTarget) return;
    await setExpiry.mutateAsync({ itemCode: clearTarget.name, expiryDate: null });
    setClearTarget(null);
  };

  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  if (query.isError) return (
    <TableErrorState
      error={query.error?.message ?? 'Failed to load items'}
      onRetry={() => query.refetch()}
    />
  );

  return (
    <div className="space-y-4">
      <Card className="border shadow-none">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${mode === 'expired' ? 'bg-red-50' : 'bg-amber-50'}`}>
            {mode === 'expired'
              ? <AlertTriangle className="h-5 w-5 text-red-600" />
              : <Clock className="h-5 w-5 text-amber-600" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {mode === 'near' ? 'Products expiring within 60 days' : 'Products past expiry date'}
            </p>
            <p className={`text-2xl font-bold ${mode === 'expired' ? 'text-red-600' : 'text-amber-600'}`}>
              {items.length}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={mode === 'near' ? 'No items near expiry' : 'No expired items'}
          description={
            mode === 'near'
              ? 'No products are expiring within the next 60 days.'
              : 'No products have expired yet.'
          }
          icon={Package}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Item Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>{mode === 'near' ? 'Days Remaining' : 'Overdue By'}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const days = daysUntilExpiry(item.custom_expiry_date);
                return (
                  <TableRow
                    key={item.name}
                    className={
                      mode === 'expired'
                        ? 'bg-red-50/40'
                        : days !== null && days <= 7
                        ? 'bg-red-50/30'
                        : 'bg-amber-50/20'
                    }
                  >
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.item_code}</TableCell>
                    <TableCell>{item.item_group ?? '—'}</TableCell>
                    <TableCell>
                      {item.custom_expiry_date
                        ? format(new Date(item.custom_expiry_date), 'dd MMM yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge days={days} mode={mode} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setClearTarget(item)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Expiry Date</DialogTitle>
          </DialogHeader>
          {editItem && (
            <EditExpiryDialog item={editItem} onClose={() => setEditItem(null)} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!clearTarget}
        title="Remove Expiry Date"
        description={`Remove the expiry date from "${clearTarget?.item_name}"? The product will no longer appear in expiry tracking.`}
        onConfirm={handleClearExpiry}
        onOpenChange={(o) => { if (!o) setClearTarget(null); }}
        isLoading={setExpiry.isPending}
      />
    </div>
  );
}
