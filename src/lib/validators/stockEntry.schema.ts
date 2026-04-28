import { z } from 'zod';

export const STOCK_ENTRY_TYPES = [
  'Material Receipt',
  'Material Issue',
  'Material Transfer',
  'Stock Reconciliation',
] as const;

export const stockEntryItemSchema = z.object({
  item_code: z.string().min(1, 'Item is required'),
  item_name: z.string().default(''),
  description: z.string().optional(),
  s_warehouse: z.string().optional(),
  t_warehouse: z.string().optional(),
  qty: z.number().min(0.001, 'Quantity must be greater than 0'),
  uom: z.string().default('Nos'),
  stock_uom: z.string().default('Nos'),
  basic_rate: z.number().min(0, 'Rate must be >= 0'),
  basic_amount: z.number().default(0),
  allow_zero_valuation_rate: z.boolean().optional(),
});

export const stockEntrySchema = z
  .object({
    stock_entry_type: z.enum(STOCK_ENTRY_TYPES),
    posting_date: z.string().min(1, 'Posting date is required'),
    posting_time: z.string().min(1, 'Posting time is required'),
    remarks: z.string().optional(),
    items: z
      .array(stockEntryItemSchema)
      .min(1, 'At least one item is required'),
  })
  .superRefine((data, ctx) => {
    if (data.stock_entry_type === 'Material Transfer') {
      data.items.forEach((item, i) => {
        if (!item.s_warehouse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Source warehouse required for Material Transfer',
            path: ['items', i, 's_warehouse'],
          });
        }
        if (!item.t_warehouse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Target warehouse required for Material Transfer',
            path: ['items', i, 't_warehouse'],
          });
        }
        if (
          item.s_warehouse &&
          item.t_warehouse &&
          item.s_warehouse === item.t_warehouse
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Source and target warehouse must be different',
            path: ['items', i, 't_warehouse'],
          });
        }
      });
    }
    if (data.stock_entry_type === 'Material Issue') {
      data.items.forEach((item, i) => {
        if (!item.s_warehouse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Source warehouse required for Material Issue',
            path: ['items', i, 's_warehouse'],
          });
        }
      });
    }
    if (data.stock_entry_type === 'Material Receipt') {
      data.items.forEach((item, i) => {
        if (!item.t_warehouse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Target warehouse required for Material Receipt',
            path: ['items', i, 't_warehouse'],
          });
        }
      });
    }
  });

export type StockEntrySchema = z.infer<typeof stockEntrySchema>;
export type StockEntryItemSchema = z.infer<typeof stockEntryItemSchema>;
