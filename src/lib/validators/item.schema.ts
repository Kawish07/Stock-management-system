import { z } from 'zod';

export const itemSchema = z.object({
  item_code: z.string().min(1, 'Item code is required').max(140, 'Item code too long'),
  item_name: z.string().min(1, 'Item name is required').max(140, 'Item name too long'),
  item_group: z.string().min(1, 'Item group is required'),
  description: z.string().default(''),
  stock_uom: z.string().min(1, 'Unit of measure is required'),
  opening_stock: z.number().min(0, 'Opening stock cannot be negative').default(0),
  valuation_rate: z.number().min(0, 'Valuation rate cannot be negative').default(0),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative').default(0),
  is_stock_item: z.boolean().default(true),
  disabled: z.boolean().default(false),
});

export type ItemSchema = z.infer<typeof itemSchema>;
