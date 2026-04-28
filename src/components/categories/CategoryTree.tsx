'use client';

import { useState } from 'react';
import { useCategories, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { Folder, FolderOpen, FileText, ChevronRight, Edit, Trash2, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/category.types';
import type { CategorySchema } from '@/lib/validators/category.schema';
import toast from 'react-hot-toast';

interface CategoryNodeProps {
  node: Category;
  flat: Category[];
  depth: number;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

function CategoryNode({ node, flat, depth, onEdit, onDelete }: CategoryNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors',
          depth > 0 && 'ml-5 border-l border-border pl-3'
        )}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((e) => !e)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground',
            !hasChildren && 'pointer-events-none opacity-0'
          )}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-150',
              expanded && 'rotate-90'
            )}
          />
        </button>

        {/* Icon */}
        <span className="shrink-0 text-muted-foreground">
          {node.is_group ? (
            expanded && hasChildren ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500" />
            )
          ) : (
            <FileText className="h-4 w-4 text-sky-500" />
          )}
        </span>

        {/* Label */}
        <span className="flex-1 text-sm font-medium leading-none">
          {node.item_group_name}
        </span>

        {/* Item count badge */}
        {node.item_count !== undefined && node.item_count > 0 && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {node.item_count}
          </Badge>
        )}

        {/* Children count badge */}
        {hasChildren && (
          <Badge variant="outline" className="text-xs h-5 px-1.5 text-muted-foreground">
            {children.length}
          </Badge>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(node)}
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(node)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <CategoryNode
              key={child.name}
              node={child}
              flat={flat}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryTreeProps {
  /** Called when the tree's own "+ Add Category" button is clicked */
  onAddClick?: () => void;
}

export function CategoryTree({ onAddClick }: CategoryTreeProps) {
  const { data, isLoading, isError, error, refetch } = useCategories();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const flat: Category[] = data?.flat ?? [];
  const tree: Category[] = data?.tree ?? [];

  const handleEditSubmit = async (values: CategorySchema) => {
    if (!editTarget) return;
    setEditError(null);
    try {
      await updateCategory.mutateAsync({ name: editTarget.name, data: values });
      setEditTarget(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update category.');
    }
  };

  const handleDeleteRequest = (cat: Category) => {
    const hasChildren = flat.some((c) => c.parent_item_group === cat.name);
    if (hasChildren) {
      toast.error(`"${cat.item_group_name}" has sub-categories. Remove them first.`);
      return;
    }
    if (cat.item_count && cat.item_count > 0) {
      toast.error(`"${cat.item_group_name}" has linked items. Reassign them first.`);
      return;
    }
    setDeleteTarget(cat);
  };

  return (
    <>
      <div className="rounded-md border">
        {/* Tree toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {flat.length} {flat.length === 1 ? 'category' : 'categories'}
          </p>
        </div>

        {/* Tree body */}
        <div className="p-2">
          {isLoading ? (
            <LoadingSkeleton rows={5} columns={1} />
          ) : isError ? (
            <TableErrorState
              error={(error as Error)?.message ?? 'Something went wrong'}
              onRetry={() => refetch()}
            />
          ) : tree.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="No categories yet"
              description="Create your first category"
            />
          ) : (
            tree.map((root) => (
              <CategoryNode
                key={root.name}
                node={root}
                flat={flat}
                depth={0}
                onEdit={setEditTarget}
                onDelete={handleDeleteRequest}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <CategoryForm
              defaultValues={{
                item_group_name: editTarget.item_group_name,
                parent_item_group: editTarget.parent_item_group,
                is_group: editTarget.is_group,
                description: editTarget.description,
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => { setEditTarget(null); setEditError(null); }}
              isLoading={updateCategory.isPending}
              apiError={editError}
              onDismissError={() => setEditError(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.item_group_name}"?`}
        description={`This action cannot be undone. This will permanently delete "${deleteTarget?.item_group_name}" and all associated data.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteCategory.mutate(deleteTarget.name, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        isLoading={deleteCategory.isPending}
      />
    </>
  );
}
