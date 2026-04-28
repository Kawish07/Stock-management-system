'use client';

import { useState, useEffect } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import type { StockEntrySchema } from '@/lib/validators/stockEntry.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useItems } from '@/hooks/useItems';
import { Plus, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { Warehouse } from '@/types/warehouse.types';
import type { Item } from '@/types/item.types';

// ─── Item Combobox ────────────────────────────────────────────────────────────

interface ItemComboboxProps {
  value: string;
  onSelect: (item: Item) => void;
  readOnly?: boolean;
}

function ItemCombobox({ value, onSelect, readOnly }: ItemComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data } = useItems({ search: search || undefined, limit: 20 });
  const items = data?.data ?? [];

  if (readOnly) {
    return (
      <Input
        value={value}
        readOnly
        className="h-8 bg-muted/50 font-mono text-xs"
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full justify-between px-2 font-mono text-xs"
          >
            {value || (
              <span className="font-normal text-muted-foreground">Search item…</span>
            )}
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by code or name…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.item_code}
                  value={item.item_code}
                  onSelect={() => {
                    onSelect(item);
                    setSearch('');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3 shrink-0',
                      value === item.item_code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-xs truncate">{item.item_code}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.item_name}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Warehouse Combobox ───────────────────────────────────────────────────────

interface WarehouseComboboxProps {
  value: string;
  warehouses: Warehouse[];
  onChange: (name: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

function WarehouseCombobox({
  value,
  warehouses,
  onChange,
  readOnly,
  placeholder = 'Select warehouse…',
}: WarehouseComboboxProps) {
  const [open, setOpen] = useState(false);
  const label = warehouses.find((w) => w.name === value)?.warehouse_name;

  if (readOnly) {
    return (
      <Input
        value={label ?? value ?? ''}
        readOnly
        className="h-8 bg-muted/50 text-xs"
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full justify-between px-2 text-xs"
          >
            {label ?? (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No warehouse found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-3 w-3 shrink-0',
                    !value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                None
              </CommandItem>
              {warehouses.map((w) => (
                <CommandItem
                  key={w.name}
                  value={w.warehouse_name}
                  onSelect={() => {
                    onChange(w.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3 shrink-0',
                      value === w.name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {w.warehouse_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

interface ItemRowProps {
  index: number;
  form: UseFormReturn<StockEntrySchema>;
  showSource: boolean;
  showTarget: boolean;
  warehouses: Warehouse[];
  readOnly: boolean;
  onRemove: () => void;
}

function ItemRow({
  index,
  form,
  showSource,
  showTarget,
  warehouses,
  readOnly,
  onRemove,
}: ItemRowProps) {
  const { register, setValue, control, formState: { errors } } = form;

  const qty = useWatch({ control, name: `items.${index}.qty` }) as number;
  const basicRate = useWatch({ control, name: `items.${index}.basic_rate` }) as number;
  const itemCode = useWatch({ control, name: `items.${index}.item_code` }) as string;
  const sWarehouse = useWatch({ control, name: `items.${index}.s_warehouse` }) as string;
  const tWarehouse = useWatch({ control, name: `items.${index}.t_warehouse` }) as string;

  // Auto-calculate basic_amount
  useEffect(() => {
    const amount = Math.round((qty ?? 0) * (basicRate ?? 0) * 100) / 100;
    setValue(`items.${index}.basic_amount`, amount);
  }, [qty, basicRate, index, setValue]);

  const itemErrors = errors.items?.[index] as
    | Record<string, { message?: string }>
    | undefined;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Item {index + 1}
        </span>
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Item Code */}
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Item Code *</Label>
          <ItemCombobox
            value={itemCode}
            readOnly={readOnly}
            onSelect={(item) => {
              setValue(`items.${index}.item_code`, item.item_code);
              setValue(`items.${index}.item_name`, item.item_name);
              setValue(`items.${index}.uom`, item.stock_uom);
              setValue(`items.${index}.stock_uom`, item.stock_uom);
              setValue(`items.${index}.basic_rate`, item.valuation_rate ?? 0);
            }}
          />
          {itemErrors?.item_code?.message && (
            <p className="text-[10px] text-destructive">{itemErrors.item_code.message}</p>
          )}
        </div>

        {/* Item Name (auto-filled) */}
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Item Name</Label>
          <Input
            {...register(`items.${index}.item_name`)}
            readOnly
            className="h-8 bg-muted/50 text-xs"
            placeholder="Auto-filled on selection"
          />
        </div>

        {/* Qty */}
        <div className="space-y-1">
          <Label className="text-xs">Qty *</Label>
          <Input
            type="number"
            step="0.001"
            min="0.001"
            {...register(`items.${index}.qty`, { valueAsNumber: true })}
            readOnly={readOnly}
            className={cn('h-8 text-xs', readOnly && 'bg-muted/50')}
          />
          {itemErrors?.qty?.message && (
            <p className="text-[10px] text-destructive">{itemErrors.qty.message}</p>
          )}
        </div>

        {/* UOM */}
        <div className="space-y-1">
          <Label className="text-xs">UOM</Label>
          <Input
            {...register(`items.${index}.uom`)}
            readOnly
            className="h-8 bg-muted/50 text-xs"
          />
        </div>

        {/* Rate */}
        <div className="space-y-1">
          <Label className="text-xs">Rate</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register(`items.${index}.basic_rate`, { valueAsNumber: true })}
            readOnly={readOnly}
            className={cn('h-8 text-xs', readOnly && 'bg-muted/50')}
          />
        </div>

        {/* Amount (auto-calculated) */}
        <div className="space-y-1">
          <Label className="text-xs">Amount</Label>
          <Input
            readOnly
            value={formatNumber((qty ?? 0) * (basicRate ?? 0))}
            className="h-8 bg-muted/50 text-xs font-medium"
          />
        </div>

        {/* Source Warehouse */}
        {showSource && (
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Source Warehouse</Label>
            <WarehouseCombobox
              value={sWarehouse ?? ''}
              warehouses={warehouses}
              onChange={(v) => setValue(`items.${index}.s_warehouse`, v)}
              readOnly={readOnly}
              placeholder="Select source…"
            />
            {itemErrors?.s_warehouse?.message && (
              <p className="text-[10px] text-destructive">
                {itemErrors.s_warehouse.message}
              </p>
            )}
          </div>
        )}

        {/* Target Warehouse */}
        {showTarget && (
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Target Warehouse</Label>
            <WarehouseCombobox
              value={tWarehouse ?? ''}
              warehouses={warehouses}
              onChange={(v) => setValue(`items.${index}.t_warehouse`, v)}
              readOnly={readOnly}
              placeholder="Select target…"
            />
            {itemErrors?.t_warehouse?.message && (
              <p className="text-[10px] text-destructive">
                {itemErrors.t_warehouse.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StockEntryItems ──────────────────────────────────────────────────────────

interface StockEntryItemsProps {
  form: UseFormReturn<StockEntrySchema>;
  stockEntryType: string;
  readOnly?: boolean;
}

export function StockEntryItems({
  form,
  stockEntryType,
  readOnly = false,
}: StockEntryItemsProps) {
  const { control, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const { data: warehouses = [] } = useWarehouses();

  const showSource = ['Material Issue', 'Material Transfer'].includes(stockEntryType);
  const showTarget = [
    'Material Receipt',
    'Material Transfer',
    'Stock Reconciliation',
  ].includes(stockEntryType);

  const addRow = () =>
    append({
      item_code: '',
      item_name: '',
      qty: 1,
      uom: 'Nos',
      stock_uom: 'Nos',
      basic_rate: 0,
      basic_amount: 0,
      s_warehouse: '',
      t_warehouse: '',
    });

  const itemsError =
    (errors.items as { message?: string } | undefined)?.message ??
    (errors.items as { root?: { message?: string } } | undefined)?.root?.message;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Items</h3>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        )}
      </div>

      {itemsError && (
        <p className="text-xs text-destructive">{itemsError}</p>
      )}

      {fields.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {readOnly
            ? 'No items recorded.'
            : 'No items added yet. Click "Add Item" to begin.'}
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <ItemRow
            key={field.id}
            index={index}
            form={form}
            showSource={showSource}
            showTarget={showTarget}
            warehouses={warehouses}
            readOnly={readOnly}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
    </div>
  );
}
