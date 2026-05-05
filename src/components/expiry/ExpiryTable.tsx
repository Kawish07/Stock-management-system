'use client';

import { useState } from 'react';
import { useBatches, useDeleteBatch } from '@/hooks/useExpiry';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { BatchForm } from './BatchForm';
import { Edit, Trash2, Search, Package, Plus } from 'lucide-react';
import { getExpiryStatus, daysUntilExpiry } from '@/types/expiry.types';
import type { Batch } from '@/types/expiry.types';
import { format } from 'date-fns';

function ExpiryBadge({ date }: { date?: string }) {
  const status = getExpiryStatus(date);
  const days = daysUntilExpiry(date);

  if (!date) return <Badge variant="outline">No expiry</Badge>;

  if (status === 'expired') {
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">
        Expired {Math.abs(days!)}d ago
      </Badge>
    );
  }
  if (status === 'near') {
    return (
      <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
        {days}d left
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">
      {days}d left
    </Badge>
  );
}

export function ExpiryTable() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  const { data, isLoading, isError, error, refetch } = useBatches({ search });
  const deleteBatch = useDeleteBatch();

  const batches = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteBatch.mutateAsync(deleteTarget.name);
    setDeleteTarget(null);
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <TableErrorState error={error?.message ?? 'Failed to load batches'} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search batch ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          title="No batches found"
          description={search ? 'Try a different search.' : 'Add your first batch to track expiry dates.'}
          icon={Package}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Mfg. Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.name}>
                  <TableCell className="font-mono text-sm">{b.batch_id}</TableCell>
                  <TableCell>{b.item_name ?? b.item}</TableCell>
                  <TableCell>
                    {b.manufacturing_date
                      ? format(new Date(b.manufacturing_date), 'dd MMM yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {b.expiry_date
                      ? format(new Date(b.expiry_date), 'dd MMM yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge date={b.expiry_date} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditBatch(b)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(b)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Batch / Expiry</DialogTitle>
          </DialogHeader>
          <BatchForm
            onSuccess={() => setShowAdd(false)}
            onCancel={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editBatch} onOpenChange={(o) => !o && setEditBatch(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          {editBatch && (
            <BatchForm
              batch={editBatch}
              onSuccess={() => setEditBatch(null)}
              onCancel={() => setEditBatch(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Batch"
        description={`Are you sure you want to delete batch "${deleteTarget?.batch_id}"?`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteBatch.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
