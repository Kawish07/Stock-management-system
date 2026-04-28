'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { WarehouseTable } from '@/components/warehouses/WarehouseTable';
import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@/hooks/useWarehouses';
import { Plus } from 'lucide-react';
import type { Warehouse } from '@/types/warehouse.types';
import type { WarehouseSchema } from '@/lib/validators/warehouse.schema';

export default function WarehousesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const { data: warehouses = [] } = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const handleAdd = () => {
    setEditTarget(null);
    setFormError(null);
    setSheetOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditTarget(warehouse);
    setFormError(null);
    setSheetOpen(true);
  };

  const handleSubmit = async (values: WarehouseSchema) => {
    setFormError(null);
    try {
      if (editTarget) {
        await updateWarehouse.mutateAsync({ name: editTarget.name, data: values });
      } else {
        await createWarehouse.mutateAsync(values as never);
      }
      setSheetOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save warehouse.');
    }
  };

  const isMutating = createWarehouse.isPending || updateWarehouse.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        description="Manage warehouse locations and types"
        actions={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        }
      />

      <WarehouseTable onEdit={handleEdit} onDelete={setDeleteTarget} />

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setFormError(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editTarget ? 'Edit Warehouse' : 'Add Warehouse'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-4 pb-8">
            <WarehouseForm
              warehouse={editTarget ?? undefined}
              warehouses={warehouses}
              onSubmit={handleSubmit}
              isLoading={isMutating}
              apiError={formError}
              onDismissError={() => setFormError(null)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.warehouse_name}"?`}
        description={`This action cannot be undone. This will permanently delete "${deleteTarget?.warehouse_name}" and all associated data.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteWarehouse.mutate(deleteTarget.name, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        isLoading={deleteWarehouse.isPending}
      />
    </div>
  );
}

