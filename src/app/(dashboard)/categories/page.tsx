'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { CategoryTree } from '@/components/categories/CategoryTree';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useCreateCategory } from '@/hooks/useCategories';
import type { CategorySchema } from '@/lib/validators/category.schema';

export default function CategoriesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createCategory = useCreateCategory();

  const handleCreate = async (values: CategorySchema) => {
    setCreateError(null);
    try {
      await createCategory.mutateAsync(values);
      setAddOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create category.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organise items into groups and sub-groups"
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        }
      />

      {/* CategoryTree manages edit/delete; page manages add */}
      <CategoryTree onAddClick={() => setAddOpen(true)} />

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setCreateError(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleCreate}
            onCancel={() => { setAddOpen(false); setCreateError(null); }}
            isLoading={createCategory.isPending}
            apiError={createError}
            onDismissError={() => setCreateError(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
