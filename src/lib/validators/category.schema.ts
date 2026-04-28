import { z } from 'zod';

export const categorySchema = z.object({
  item_group_name: z.string().min(1, 'Category name is required').max(140),
  parent_item_group: z.string().optional(),
  is_group: z.boolean().default(false),
  description: z.string().optional(),
});

export type CategorySchema = z.infer<typeof categorySchema>;
