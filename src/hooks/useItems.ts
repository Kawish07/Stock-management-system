import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsService } from '@/services/items.service';
import type { CreateItemDto, UpdateItemDto } from '@/types/item.types';
import toast from 'react-hot-toast';

export const ITEMS_KEY = 'items';

export function useItems(filters?: {
  search?: string;
  item_group?: string;
  limit?: number;
  start?: number;
}) {
  return useQuery({
    queryKey: [ITEMS_KEY, filters],
    queryFn: () => itemsService.getAllItems(filters),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useItem(itemCode: string) {
  return useQuery({
    queryKey: [ITEMS_KEY, itemCode],
    queryFn: () => itemsService.getItem(itemCode),
    enabled: !!itemCode,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemDto) => itemsService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      toast.success('Item created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create item');
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpdateItemDto }) =>
      itemsService.updateItem(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      toast.success('Item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update item');
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => itemsService.deleteItem(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      toast.success('Item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete item');
    },
  });
}
