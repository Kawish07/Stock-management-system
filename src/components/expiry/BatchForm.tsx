'use client';

import { useState } from 'react';
import { useItems } from '@/hooks/useItems';
import { useCreateBatch, useUpdateBatch } from '@/hooks/useExpiry';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { batchSchema, type BatchSchema } from '@/lib/validators/batch.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import type { Batch } from '@/types/expiry.types';
import { Loader2 } from 'lucide-react';

interface BatchFormProps {
  batch?: Batch;
  defaultItem?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BatchForm({ batch, defaultItem, onSuccess, onCancel }: BatchFormProps) {
  const isEdit = !!batch;
  const [apiError, setApiError] = useState<string | null>(null);

  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const isLoading = createBatch.isPending || updateBatch.isPending;

  const { data: itemsData } = useItems({ limit: 500 });
  const items = itemsData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BatchSchema>({
    resolver: zodResolver(batchSchema) as never,
    defaultValues: {
      batch_id: batch?.batch_id ?? '',
      item: batch?.item ?? defaultItem ?? '',
      expiry_date: batch?.expiry_date ?? '',
      manufacturing_date: batch?.manufacturing_date ?? '',
      description: batch?.description ?? '',
    },
  });

  const onSubmit = async (values: BatchSchema) => {
    setApiError(null);
    try {
      if (isEdit) {
        await updateBatch.mutateAsync({
          name: batch.name,
          data: {
            expiry_date: values.expiry_date || undefined,
            manufacturing_date: values.manufacturing_date || undefined,
            description: values.description,
          },
        });
      } else {
        await createBatch.mutateAsync({
          batch_id: values.batch_id,
          item: values.item,
          expiry_date: values.expiry_date || undefined,
          manufacturing_date: values.manufacturing_date || undefined,
          description: values.description,
        });
      }
      onSuccess?.();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {apiError && <ApiErrorAlert error={apiError} onDismiss={() => setApiError(null)} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isEdit ? 'Edit Batch / Expiry' : 'Add Batch / Expiry'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Batch ID */}
          <div className="space-y-1.5">
            <Label htmlFor="batch_id">Batch ID *</Label>
            <Input
              id="batch_id"
              {...register('batch_id')}
              placeholder="e.g. BATCH-2024-001"
              disabled={isEdit}
            />
            {errors.batch_id && (
              <p className="text-xs text-destructive">{errors.batch_id.message}</p>
            )}
          </div>

          {/* Item */}
          <div className="space-y-1.5">
            <Label htmlFor="item">Product / Item *</Label>
            <select
              id="item"
              {...register('item')}
              disabled={isEdit}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            >
              <option value="">Select item...</option>
              {items.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.item_name}
                </option>
              ))}
            </select>
            {errors.item && (
              <p className="text-xs text-destructive">{errors.item.message}</p>
            )}
          </div>

          {/* Manufacturing Date */}
          <div className="space-y-1.5">
            <Label htmlFor="manufacturing_date">Manufacturing Date</Label>
            <Input
              id="manufacturing_date"
              type="date"
              {...register('manufacturing_date')}
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <Label htmlFor="expiry_date">Expiry Date *</Label>
            <Input
              id="expiry_date"
              type="date"
              {...register('expiry_date')}
            />
            {errors.expiry_date && (
              <p className="text-xs text-destructive">{errors.expiry_date.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Set manually — each product can have its own expiry date.</p>
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional notes about this batch..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Add Batch'}
        </Button>
      </div>
    </form>
  );
}
