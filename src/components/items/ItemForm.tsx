'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemSchema, type ItemSchema } from '@/lib/validators/item.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCreateItem, useUpdateItem } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useCategories';
import { useCompanies } from '@/hooks/useCompanies';
import { expiryService } from '@/services/expiry.service';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import { generateItemCode } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Item } from '@/types/item.types';
import type { UpdateItemDto } from '@/types/item.types';

const UOM_OPTIONS = ['Nos', 'Kg', 'Ltr', 'Box', 'Pcs', 'Meter', 'Pair'] as const;

interface ItemFormProps {
  item?: Item;
}

export function ItemForm({ item }: ItemFormProps) {
  const router = useRouter();
  const isEdit = !!item;
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const [apiError, setApiError] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');

  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.flat ?? [];

  const { data: companiesData } = useCompanies({ limit: 100 });
  const companies = companiesData?.data ?? [];

  const isLoading = createItem.isPending || updateItem.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemSchema>({
    resolver: zodResolver(itemSchema) as never,
    defaultValues: {
      item_code: item?.item_code ?? '',
      item_name: item?.item_name ?? '',
      item_group: item?.item_group ?? '',
      description: item?.description ?? '',
      stock_uom: item?.stock_uom ?? 'Nos',
      opening_stock: Number(item?.opening_stock ?? 0),
      valuation_rate: Number(item?.valuation_rate ?? 0),
      reorder_level: Number(item?.reorder_level ?? 0),
      // ERPNext returns booleans as 0/1 integers — coerce explicitly
      is_stock_item: Boolean(item?.is_stock_item ?? true),
      disabled: Boolean(item?.disabled ?? false),
      company: item?.company ?? '',
    },
  });

  const itemName = watch('item_name');
  const isStockItem = watch('is_stock_item');
  const isDisabled = watch('disabled');

  // Auto-generate item_code from item_name in create mode
  useEffect(() => {
    if (!isEdit && itemName) {
      setValue('item_code', generateItemCode(itemName), { shouldValidate: false });
    }
  }, [itemName, isEdit, setValue]);

  // Re-sync item_group once categories have loaded (select has no matching option on first render)
  useEffect(() => {
    if (isEdit && item?.item_group && categories.length > 0) {
      setValue('item_group', item.item_group, { shouldValidate: false });
    }
  }, [isEdit, item?.item_group, categories.length, setValue]);

  const onSubmit = async (values: ItemSchema) => {
    setApiError(null);
    try {
      if (isEdit) {
        const updatePayload: UpdateItemDto = {
          item_name: values.item_name,
          item_group: values.item_group,
          description: values.description,
          disabled: values.disabled,
          company: values.company || undefined,
        };
        await updateItem.mutateAsync({ name: item.name, data: updatePayload });
      } else {
        await createItem.mutateAsync(values);
      }

      // Save expiry date directly on the item via custom field — no Batch doctype needed
      if (expiryDate) {
        const itemCode = isEdit ? item.name : values.item_code;
        try {
          await expiryService.setItemExpiry(itemCode, expiryDate);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setApiError(`Item saved, but expiry date could not be set: ${msg}`);
          return;
        }
      }

      router.push('/items');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ─── Basic Information ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Item Name */}
          <div className="space-y-1.5">
            <Label htmlFor="item_name">Item Name *</Label>
            <Input
              id="item_name"
              {...register('item_name')}
              placeholder="e.g. Blue Widget 500g"
            />
            {errors.item_name && (
              <p className="text-xs text-destructive">{errors.item_name.message}</p>
            )}
          </div>

          {/* Item Code */}
          <div className="space-y-1.5">
            <Label htmlFor="item_code">
              Item Code *
              {!isEdit && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (auto-generated, editable)
                </span>
              )}
            </Label>
            <Input
              id="item_code"
              {...register('item_code')}
              placeholder="BLUE-WIDGET-500G"
              className="font-mono"
              readOnly={isEdit}
            />
            {errors.item_code && (
              <p className="text-xs text-destructive">{errors.item_code.message}</p>
            )}
          </div>

          {/* Item Group / Category */}
          <div className="space-y-1.5">
            <Label htmlFor="item_group">Category *</Label>
            <select
              id="item_group"
              {...register('item_group')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.item_group_name}
                </option>
              ))}
            </select>
            {errors.item_group && (
              <p className="text-xs text-destructive">{errors.item_group.message}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <select
              id="company"
              {...register('company')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.company_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Select the company this product belongs to</p>
          </div>

          {/* Description — full width */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Item description..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Stock Information ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stock Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* UOM */}
          <div className="space-y-1.5">
            <Label htmlFor="stock_uom">Unit of Measure *</Label>
            <select
              id="stock_uom"
              {...register('stock_uom')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {UOM_OPTIONS.map((uom) => (
                <option key={uom} value={uom}>
                  {uom}
                </option>
              ))}
            </select>
            {errors.stock_uom && (
              <p className="text-xs text-destructive">{errors.stock_uom.message}</p>
            )}
          </div>

          {/* Opening Stock */}
          <div className="space-y-1.5">
            <Label htmlFor="opening_stock">Opening Stock</Label>
            <Input
              id="opening_stock"
              type="number"
              step="0.001"
              min="0"
              {...register('opening_stock', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.opening_stock && (
              <p className="text-xs text-destructive">{errors.opening_stock.message}</p>
            )}
          </div>

          {/* Valuation Rate */}
          <div className="space-y-1.5">
            <Label htmlFor="valuation_rate">Valuation Rate</Label>
            <Input
              id="valuation_rate"
              type="number"
              step="0.01"
              min="0"
              {...register('valuation_rate', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.valuation_rate && (
              <p className="text-xs text-destructive">{errors.valuation_rate.message}</p>
            )}
          </div>

          {/* Reorder Level */}
          <div className="space-y-1.5">
            <Label htmlFor="reorder_level">Reorder Level</Label>
            <Input
              id="reorder_level"
              type="number"
              step="0.001"
              min="0"
              {...register('reorder_level', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.reorder_level && (
              <p className="text-xs text-destructive">{errors.reorder_level.message}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional — each product can have its own expiry date. Appears in Near Expiry &amp; Expired sections.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Settings ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEdit && (
            <>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="is_stock_item"
                  checked={isStockItem}
                  onCheckedChange={(checked) => setValue('is_stock_item', Boolean(checked))}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="is_stock_item" className="cursor-pointer leading-none">
                    Is Stock Item
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track inventory quantity for this item
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="disabled"
              checked={isDisabled}
              onCheckedChange={(checked) => setValue('disabled', Boolean(checked))}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="disabled" className="cursor-pointer leading-none">
                Disabled
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Disable this item from being used in transactions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Form Actions ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {apiError && (
          <ApiErrorAlert error={apiError} onDismiss={() => setApiError(null)} />
        )}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEdit ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </div>
    </form>
  );
}
