'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategorySchema } from '@/lib/validators/category.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import { useCategories } from '@/hooks/useCategories';

interface CategoryFormProps {
  /** Pre-fill values for edit mode */
  defaultValues?: Partial<CategorySchema>;
  onSubmit: (values: CategorySchema) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  apiError?: string | null;
  onDismissError?: () => void;
}

export function CategoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  apiError,
  onDismissError,
}: CategoryFormProps) {
  const { data } = useCategories();
  const categories = data?.flat ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategorySchema>({
    resolver: zodResolver(categorySchema) as never,
    defaultValues: {
      item_group_name: defaultValues?.item_group_name ?? '',
      parent_item_group: defaultValues?.parent_item_group ?? '',
      is_group: defaultValues?.is_group ?? false,
      description: defaultValues?.description ?? '',
    },
  });

  const isGroup = watch('is_group');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Category Name */}
      <div className="space-y-1.5">
        <Label htmlFor="item_group_name">Category Name *</Label>
        <Input
          id="item_group_name"
          {...register('item_group_name')}
          placeholder="e.g. Electronics"
        />
        {errors.item_group_name && (
          <p className="text-xs text-destructive">{errors.item_group_name.message}</p>
        )}
      </div>

      {/* Parent Category */}
      <div className="space-y-1.5">
        <Label htmlFor="parent_item_group">Parent Category</Label>
        <select
          id="parent_item_group"
          {...register('parent_item_group')}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">No parent (top level)</option>
          {categories
            .filter((c) => c.is_group)
            .map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.item_group_name}
              </option>
            ))}
        </select>
        {errors.parent_item_group && (
          <p className="text-xs text-destructive">{errors.parent_item_group.message}</p>
        )}
      </div>

      {/* Is Group */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="is_group"
          checked={isGroup}
          onCheckedChange={(checked) => setValue('is_group', Boolean(checked))}
          className="mt-0.5"
        />
        <div>
          <Label htmlFor="is_group" className="cursor-pointer leading-none">
            Can have sub-categories
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enable this to nest other categories under this one
          </p>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <ApiErrorAlert error={apiError ?? null} onDismiss={() => onDismissError?.()} />
        <div className="flex justify-end gap-2 pt-1">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : defaultValues?.item_group_name ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </div>
    </form>
  );
}
