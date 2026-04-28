import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category.types';
import toast from 'react-hot-toast';

export const CATEGORIES_KEY = 'categories';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
}
