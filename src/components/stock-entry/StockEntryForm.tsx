'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  stockEntrySchema,
  STOCK_ENTRY_TYPES,
  type StockEntrySchema,
} from '@/lib/validators/stockEntry.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import { StockEntryItems } from './StockEntryItems';
import {
  useCreateStockEntry,
  useUpdateStockEntry,
  useSubmitStockEntry,
  useCancelStockEntry,
} from '@/hooks/useStockEntry';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { StockEntry } from '@/types/stockEntry.types';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowTime() {
  const d = new Date();
  return [
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join(':');
}

const STATUS_CONFIG = {
  0: {
    label: 'Draft',
    cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  },
  1: {
    label: 'Submitted',
    cls: 'bg-green-100 text-green-800 border border-green-200',
  },
  2: {
    label: 'Cancelled',
    cls: 'bg-red-100 text-red-800 border border-red-200',
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface StockEntryFormProps {
  entry?: StockEntry;
}

export function StockEntryForm({ entry }: StockEntryFormProps) {
  const router = useRouter();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isEdit = !!entry?.name;
  const isSubmitted = entry?.docstatus === 1;
  const isCancelled = entry?.docstatus === 2;
  const readOnly = isSubmitted || isCancelled;

  const createEntry = useCreateStockEntry();
  const updateEntry = useUpdateStockEntry();
  const submitEntry = useSubmitStockEntry();
  const cancelEntry = useCancelStockEntry();

  const form = useForm<StockEntrySchema>({
    resolver: zodResolver(stockEntrySchema) as never,
    defaultValues: {
      stock_entry_type: entry?.stock_entry_type ?? 'Material Receipt',
      posting_date:
        entry?.posting_date ?? new Date().toISOString().split('T')[0],
      posting_time: (entry?.posting_time ?? nowTime()).slice(0, 8),
      remarks: entry?.remarks ?? '',
      items:
        entry?.items?.map((item) => ({
          item_code: item.item_code,
          item_name: item.item_name ?? '',
          description: item.description ?? '',
          s_warehouse: item.s_warehouse ?? '',
          t_warehouse: item.t_warehouse ?? '',
          qty: item.qty,
          uom: item.uom ?? 'Nos',
          stock_uom: item.stock_uom ?? 'Nos',
          basic_rate: item.basic_rate ?? 0,
          basic_amount: item.basic_amount ?? 0,
          allow_zero_valuation_rate: item.allow_zero_valuation_rate ?? false,
        })) ?? [],
    },
  });

  const { register, handleSubmit, setValue, control, formState: { errors } } = form;
  const stockEntryType = form.watch('stock_entry_type');
  const items = useWatch({ control, name: 'items' });

  const totalAmount = (items ?? []).reduce(
    (sum, item) => sum + ((item.qty ?? 0) * (item.basic_rate ?? 0)),
    0
  );

  // Core save function — returns the saved name
  const saveAsDraft = async (values: StockEntrySchema): Promise<string> => {
    if (values.items.length === 0) {
      throw new Error('Please add at least one item before saving.');
    }
    if (isEdit) {
      const result = await updateEntry.mutateAsync({
        name: entry!.name!,
        data: { ...values, docstatus: 0 } as never,
      });
      return result.name!;
    }
    const result = await createEntry.mutateAsync({ ...values, docstatus: 0 } as never);
    return result.name!;
  };

  // "Save Draft" button handler
  const onSaveDraft = async (values: StockEntrySchema) => {
    setApiError(null);
    try {
      const name = await saveAsDraft(values);
      toast.success('Draft saved successfully!');
      router.push(`/stock-entries/${encodeURIComponent(name)}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to save draft.');
    }
  };

  // Called after submit confirm dialog
  const onSubmitEntry = async (values: StockEntrySchema) => {
    setApiError(null);
    try {
      const name = await saveAsDraft(values);
      await submitEntry.mutateAsync(name);
      toast.success('Stock entry submitted successfully!');
      router.push(`/stock-entries/${encodeURIComponent(name)}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to submit entry.');
    }
  };

  // Called after cancel confirm dialog
  const handleCancelEntry = async () => {
    if (!entry?.name) return;
    setApiError(null);
    try {
      await cancelEntry.mutateAsync(entry.name);
      toast.success('Stock entry cancelled.');
      router.refresh();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to cancel entry.');
    }
  };

  const isMutating =
    createEntry.isPending ||
    updateEntry.isPending ||
    submitEntry.isPending ||
    cancelEntry.isPending;

  const docstatus = entry?.docstatus ?? 0;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {readOnly && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium',
            STATUS_CONFIG[docstatus as 1 | 2].cls
          )}
        >
          {docstatus === 1 ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          This entry is{' '}
          <strong>{STATUS_CONFIG[docstatus as 1 | 2].label}</strong>
          {entry?.posting_date && (
            <span className="ml-auto font-normal text-xs opacity-70">
              {formatDate(entry.posting_date)}{entry.posting_time ? ` · ${entry.posting_time}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Header fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Entry Details
            {entry?.docstatus !== undefined && (
              <Badge className={STATUS_CONFIG[entry.docstatus].cls}>
                {STATUS_CONFIG[entry.docstatus].label}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Stock Entry Type */}
            <div className="space-y-1.5">
              <Label>Entry Type *</Label>
              {readOnly ? (
                <Input
                  value={stockEntryType}
                  readOnly
                  className="bg-muted/50"
                />
              ) : (
                <Select
                  value={stockEntryType}
                  onValueChange={(v) =>
                    setValue(
                      'stock_entry_type',
                      v as StockEntrySchema['stock_entry_type'],
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_ENTRY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.stock_entry_type && (
                <p className="text-xs text-destructive">
                  {errors.stock_entry_type.message}
                </p>
              )}
            </div>

            {/* Posting Date */}
            <div className="space-y-1.5">
              <Label htmlFor="posting_date">Posting Date *</Label>
              <Input
                id="posting_date"
                type="date"
                {...register('posting_date')}
                readOnly={readOnly}
                className={cn(readOnly && 'bg-muted/50')}
              />
              {errors.posting_date && (
                <p className="text-xs text-destructive">
                  {errors.posting_date.message}
                </p>
              )}
            </div>

            {/* Posting Time */}
            <div className="space-y-1.5">
              <Label htmlFor="posting_time">Posting Time *</Label>
              <Input
                id="posting_time"
                type="time"
                step="1"
                {...register('posting_time')}
                readOnly={readOnly}
                className={cn(readOnly && 'bg-muted/50')}
              />
              {errors.posting_time && (
                <p className="text-xs text-destructive">
                  {errors.posting_time.message}
                </p>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                {...register('remarks')}
                readOnly={readOnly}
                rows={1}
                className={cn('resize-none', readOnly && 'bg-muted/50')}
                placeholder="Optional remarks…"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Issue warning */}
      {stockEntryType === 'Material Issue' && !readOnly && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Verify that sufficient stock is available in the source warehouse before
          submitting.
        </div>
      )}

      {/* Items */}
      <Card>
        <CardContent className="pt-6">
          <StockEntryItems
            form={form}
            stockEntryType={stockEntryType}
            readOnly={readOnly}
          />
        </CardContent>
      </Card>

      {/* Footer: Total + Actions */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col gap-4">
            {apiError && (
              <ApiErrorAlert error={apiError} onDismiss={() => setApiError(null)} />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatNumber(totalAmount)}</p>
              </div>

              <div className="flex items-center gap-3">
                {!readOnly && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSubmit(onSaveDraft)}
                      disabled={isMutating}
                    >
                      {createEntry.isPending || updateEntry.isPending
                        ? 'Saving…'
                        : 'Save Draft'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowSubmitConfirm(true)}
                      disabled={isMutating}
                    >
                      {submitEntry.isPending ? 'Submitting...' : 'Submit'}
                    </Button>
                  </>
                )}

                {isSubmitted && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isMutating}
                  >
                    {cancelEntry.isPending ? 'Cancelling…' : 'Cancel Entry'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit confirm */}
      <ConfirmDialog
        open={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        title="Submit Stock Entry"
        description="Are you sure you want to submit this entry? Once submitted, it will be posted to the stock ledger and cannot be undone easily."
        confirmLabel="Submit"
        onConfirm={() => {
          setShowSubmitConfirm(false);
          handleSubmit(onSubmitEntry)();
        }}
        isLoading={isMutating}
      />

      {/* Cancel confirm */}
      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Cancel Stock Entry"
        description="This will reverse all stock movements from this entry. This action cannot be undone."
        confirmLabel="Cancel Entry"
        variant="destructive"
        onConfirm={() => {
          setShowCancelConfirm(false);
          handleCancelEntry();
        }}
        isLoading={cancelEntry.isPending}
      />
    </div>
  );
}
