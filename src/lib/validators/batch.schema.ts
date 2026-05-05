import { z } from 'zod';

export const batchSchema = z.object({
  batch_id: z.string().min(1, 'Batch ID is required').max(140),
  item: z.string().min(1, 'Item is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  manufacturing_date: z.string().optional(),
  description: z.string().optional(),
});

export type BatchSchema = z.infer<typeof batchSchema>;
