'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema, type InvoiceSchema } from '@/lib/validators/invoice.schema';
import { useItems } from '@/hooks/useItems';
import { useCreateInvoice } from '@/hooks/useInvoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import { AlertTriangle, ShoppingCart, Package } from 'lucide-react';
import type { Item } from '@/types/item.types';

/** Parse a raw input string to a finite number, or return fallback. */
function parseNumber(raw: string, fallback = 0): number {
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function InvoiceForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const { data: itemsData, isLoading: itemsLoading } = useItems({ limit: 200 });
  const createInvoice = useCreateInvoice();

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceSchema>({
    resolver: zodResolver(invoiceSchema) as never,
    defaultValues: {
      item_code: '',
      item_name: '',
      qty: 1,
      rate: 0,
      customer: '',
      warehouse: '',
      remarks: '',
    },
  });

  const watchedQty = watch('qty');
  const watchedRate = watch('rate');
  const safeQty = Number.isFinite(watchedQty) ? watchedQty : 0;
  const safeRate = Number.isFinite(watchedRate) ? watchedRate : 0;
  const totalAmount = safeQty * safeRate;

  // When item is selected, auto-fill rate and item_name
  const handleItemSelect = (itemCode: string) => {
    const item = itemsData?.data.find((i) => i.item_code === i.name ? i.name === itemCode : i.item_code === itemCode);
    if (!item) return;
    setSelectedItem(item);
    setValue('item_code', item.item_code ?? item.name);
    setValue('item_name', item.item_name);
    const rate = item.valuation_rate ?? (item as Item & { standard_rate?: number }).standard_rate ?? 0;
    setValue('rate', rate);
  };

  const availableStock = selectedItem?.actual_qty ?? 0;
  const isLowStock = availableStock > 0 && availableStock <= 10;
  const isOutOfStock = availableStock <= 0;

  const onSubmit = async (values: InvoiceSchema) => {
    setApiError(null);

    const qty = Number.isFinite(values.qty) ? values.qty : 0;
    const rate = Number.isFinite(values.rate) ? values.rate : 0;

    // Stock check
    if (selectedItem && qty > availableStock) {
      setApiError(`Insufficient stock. Available: ${availableStock} ${selectedItem.stock_uom ?? 'Nos'}`);
      return;
    }

    try {
      await createInvoice.mutateAsync({
        item_code: values.item_code,
        item_name: values.item_name,
        qty,
        rate,
        customer: values.customer || 'Walk-in Customer',
        warehouse: values.warehouse,
        remarks: values.remarks,
      });
      router.push('/invoices');
    } catch (err) {
      setApiError((err as Error).message);
    }
  };

  const stockBadge = () => {
    if (!selectedItem) return null;
    if (isOutOfStock) return <Badge variant="destructive">Out of Stock</Badge>;
    if (isLowStock)
      return (
        <Badge className="bg-orange-100 text-orange-700 border border-orange-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Low Stock ({availableStock})
        </Badge>
      );
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200">
        In Stock ({availableStock})
      </Badge>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {apiError && <ApiErrorAlert message={apiError} onDismiss={() => setApiError(null)} />}

      {/* ── Product Selection ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-indigo-500" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="item_code">Product *</Label>
            <Controller
              name="item_code"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    handleItemSelect(v);
                  }}
                  disabled={itemsLoading}
                >
                  <SelectTrigger id="item_code" className={errors.item_code ? 'border-red-500' : ''}>
                    <SelectValue placeholder={itemsLoading ? 'Loading items…' : 'Select a product'} />
                  </SelectTrigger>
                  <SelectContent>
                    {itemsData?.data.map((item) => {
                      const code = item.item_code ?? item.name;
                      const qty = item.actual_qty ?? 0;
                      return (
                        <SelectItem key={code} value={code} disabled={qty <= 0}>
                          <span className="flex items-center gap-2">
                            {item.item_name}
                            <span className="text-xs text-muted-foreground">({qty} in stock)</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.item_code && (
              <p className="text-xs text-red-500">{errors.item_code.message}</p>
            )}
            {selectedItem && (
              <div className="flex items-center gap-2 mt-1">
                {stockBadge()}
                <span className="text-xs text-muted-foreground">
                  Category: {selectedItem.item_group}
                </span>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantity *</Label>
            <Controller
              name="qty"
              control={control}
              render={({ field }) => (
                <Input
                  id="qty"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={Number.isFinite(field.value) ? field.value : ''}
                  onChange={(e) => field.onChange(parseNumber(e.target.value, 0))}
                  onBlur={field.onBlur}
                  className={errors.qty ? 'border-red-500' : ''}
                />
              )}
            />
            {errors.qty && (
              <p className="text-xs text-red-500">{errors.qty.message}</p>
            )}
            {selectedItem && Number.isFinite(safeQty) && safeQty > availableStock && (
              <p className="text-xs text-red-500">
                Exceeds available stock ({availableStock} {selectedItem.stock_uom ?? 'Nos'})
              </p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="rate">Unit Price (PKR) *</Label>
            <Controller
              name="rate"
              control={control}
              render={({ field }) => (
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={Number.isFinite(field.value) ? field.value : ''}
                  onChange={(e) => field.onChange(parseNumber(e.target.value, 0))}
                  onBlur={field.onBlur}
                  className={errors.rate ? 'border-red-500' : ''}
                />
              )}
            />
            {errors.rate && (
              <p className="text-xs text-red-500">{errors.rate.message}</p>
            )}
          </div>

          {/* Total preview */}
          {(safeQty > 0 || safeRate > 0) && (
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Total Amount
              </span>
              <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                PKR {totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Customer Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-indigo-500" />
            Customer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer">Customer Name</Label>
            <Input
              id="customer"
              placeholder="Walk-in Customer"
              {...register('customer')}
            />
            <p className="text-xs text-muted-foreground">Leave blank to use "Walk-in Customer"</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              placeholder="Optional notes"
              {...register('remarks')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || createInvoice.isPending || isOutOfStock}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {createInvoice.isPending ? 'Processing…' : 'Create Invoice & Deduct Stock'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/invoices')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
