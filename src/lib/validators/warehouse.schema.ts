import { z } from 'zod';

export const WAREHOUSE_TYPES = ['Transit', 'Storage', 'Manufacturing', 'Fixed Asset'] as const;

export const warehouseSchema = z.object({
  warehouse_name: z.string().min(1, 'Warehouse name is required').max(140),
  warehouse_type: z.enum(WAREHOUSE_TYPES).optional(),
  parent_warehouse: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  is_group: z.coerce.boolean().default(false),
  disabled: z.coerce.boolean().default(false),
});

export type WarehouseSchema = z.infer<typeof warehouseSchema>;
