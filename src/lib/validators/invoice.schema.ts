import { z } from 'zod';

export const invoiceSchema = z.object({
  item_code: z.string().min(1, 'Please select a product'),
  item_name: z.string().default(''),
  qty: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .refine((v) => Number.isFinite(v), { message: 'Quantity must be a valid number' })
    .refine((v) => v > 0, { message: 'Quantity must be greater than 0' }),
  rate: z
    .number({ invalid_type_error: 'Price must be a number' })
    .refine((v) => Number.isFinite(v), { message: 'Price must be a valid number' })
    .min(0, 'Price must be >= 0'),
  customer: z.string().optional(),
  warehouse: z.string().optional(),
  remarks: z.string().optional(),
});

export type InvoiceSchema = z.infer<typeof invoiceSchema>;
