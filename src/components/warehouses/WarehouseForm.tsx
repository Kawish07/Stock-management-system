'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { warehouseSchema, WAREHOUSE_TYPES, type WarehouseSchema } from '@/lib/validators/warehouse.schema';
import { useWarehouseTypes } from '@/hooks/useWarehouses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import type { Warehouse } from '@/types/warehouse.types';

interface WarehouseFormProps {
  warehouse?: Warehouse;
  warehouses?: Warehouse[];
  onSubmit: (values: WarehouseSchema) => void;
  isLoading?: boolean;
  apiError?: string | null;
  onDismissError?: () => void;
}

export function WarehouseForm({
  warehouse,
  warehouses = [],
  onSubmit,
  isLoading,
  apiError,
  onDismissError,
}: WarehouseFormProps) {
  const [parentOpen, setParentOpen] = useState(false);
  const { data: fetchedTypes } = useWarehouseTypes();
  const availableTypes = (fetchedTypes && fetchedTypes.length > 0) ? fetchedTypes : WAREHOUSE_TYPES;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WarehouseSchema>({
    resolver: zodResolver(warehouseSchema) as never,
    defaultValues: {
      warehouse_name: warehouse?.warehouse_name ?? '',
      warehouse_type: warehouse?.warehouse_type ?? undefined,
      parent_warehouse: warehouse?.parent_warehouse ?? '',
      city: warehouse?.city ?? '',
      country: warehouse?.country ?? '',
      is_group: Boolean(warehouse?.is_group ?? false),
      disabled: Boolean(warehouse?.disabled ?? false),
    },
  });

  const warehouseType = watch('warehouse_type');
  const parentWarehouse = watch('parent_warehouse');
  const isGroup = watch('is_group');
  const isDisabled = watch('disabled');

  // Exclude self from parent options when editing
  const parentOptions = warehouses.filter((w) => w.name !== warehouse?.name);
  const selectedParentLabel = parentOptions.find((w) => w.name === parentWarehouse)?.warehouse_name;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Warehouse Name */}
      <div className="space-y-1.5">
        <Label htmlFor="warehouse_name">Warehouse Name *</Label>
        <Input
          id="warehouse_name"
          {...register('warehouse_name')}
          placeholder="e.g. Main Storage"
        />
        {errors.warehouse_name && (
          <p className="text-xs text-destructive">{errors.warehouse_name.message}</p>
        )}
      </div>

      {/* Warehouse Type */}
      <div className="space-y-1.5">
        <Label>Warehouse Type</Label>
        <Select
          value={warehouseType ?? ''}
          onValueChange={(val: string | null) =>
            val && setValue('warehouse_type', val as WarehouseSchema['warehouse_type'], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parent Warehouse — Combobox */}
      <div className="space-y-1.5">
        <Label>Parent Warehouse</Label>
        <Popover open={parentOpen} onOpenChange={setParentOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
              >
                {selectedParentLabel ?? parentWarehouse ?? (
                  <span className="text-muted-foreground">Select parent warehouse...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            }
          />
          <PopoverContent className="w-[--anchor-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search warehouse..." />
              <CommandList>
                <CommandEmpty>No warehouse found.</CommandEmpty>
                <CommandGroup>
                  {/* Clear option */}
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      setValue('parent_warehouse', '');
                      setParentOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        !parentWarehouse ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    None
                  </CommandItem>
                  {parentOptions.map((w) => (
                    <CommandItem
                      key={w.name}
                      value={w.warehouse_name}
                      onSelect={() => {
                        setValue('parent_warehouse', w.name);
                        setParentOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          parentWarehouse === w.name ? 'opacity-100' : 'opacity-0'
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
      </div>

      {/* City & Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register('city')} placeholder="e.g. Nairobi" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register('country')} placeholder="e.g. Kenya" />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="is_group"
            checked={isGroup}
            onCheckedChange={(checked) => setValue('is_group', Boolean(checked))}
          />
          <Label htmlFor="is_group" className="cursor-pointer">
            Is Group (can contain sub-warehouses)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="disabled"
            checked={isDisabled}
            onCheckedChange={(checked) => setValue('disabled', Boolean(checked))}
          />
          <Label htmlFor="disabled" className="cursor-pointer">
            Disabled
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        <ApiErrorAlert error={apiError ?? null} onDismiss={() => onDismissError?.()} />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : warehouse ? 'Update Warehouse' : 'Create Warehouse'}
        </Button>
      </div>
    </form>
  );
}

