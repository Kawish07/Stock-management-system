import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category.types';
import toast from 'react-hot-toast';

export const CATEGORIES_KEY = 'categories';

function updateCategoriesCache(
  current: Category[] | undefined,
  nextCategory: Category,
  mode: 'create' | 'update'
) {
  if (!current) {
    return current;
  }

  const existingIndex = current.findIndex((category) => category.name === nextCategory.name);
  if (existingIndex >= 0) {
    const data = [...current];
    data[existingIndex] = { ...data[existingIndex], ...nextCategory };
    return data;
  }

  if (mode === 'create') {
    return [nextCategory, ...current].sort((a, b) => a.name.localeCompare(b.name));
  }

  return current;
}

/** Returns { flat: Category[], tree: Category[] } */
export function useCategories() {
  return useQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: () => categoriesService.getAllCategories(),
    select: (flat: Category[]) => ({
      flat,
      tree: categoriesService.buildCategoryTree(flat),
    }),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesService.createCategory(data),
    onSuccess: (category) => {
      queryClient.setQueryData(
        [CATEGORIES_KEY],
        (current: Category[] | undefined) => updateCategoriesCache(current, category, 'create')
      );
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY], refetchType: 'inactive' });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpdateCategoryDto }) =>
      categoriesService.updateCategory(name, data),
    onSuccess: (category, variables) => {
      queryClient.setQueryData(
        [CATEGORIES_KEY],
        (current: Category[] | undefined) => updateCategoriesCache(current, category, 'update')
      );
      if (variables.name !== category.name) {
        queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      } else {
        queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY], refetchType: 'inactive' });
      }
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => categoriesService.deleteCategory(name),
    onSuccess: (_, name) => {
      queryClient.setQueryData([CATEGORIES_KEY], (current: Category[] | undefined) => {
        if (!current) {
          return current;
        }

        return current.filter((category) => category.name !== name);
      });
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY], refetchType: 'inactive' });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
}
