import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itemsService } from '@/services/items.service';
import type { CreateItemDto, UpdateItemDto } from '@/types/item.types';
import type { Item } from '@/types/item.types';
import toast from 'react-hot-toast';

export const ITEMS_KEY = 'items';

function updateItemListCache(
  current: { data: Item[]; total: number } | undefined,
  nextItem: Item,
  mode: 'create' | 'update'
) {
  if (!current) {
    return current;
  }

  const existingIndex = current.data.findIndex((item) => item.name === nextItem.name);
  if (existingIndex >= 0) {
    const data = [...current.data];
    data[existingIndex] = { ...data[existingIndex], ...nextItem };
    return { ...current, data };
  }

  if (mode === 'create') {
    return {
      data: [nextItem, ...current.data],
      total: current.total + 1,
    };
  }

  return current;
}

export function useItems(filters?: {
  search?: string;
  item_group?: string;
  limit?: number;
  start?: number;
}) {
  return useQuery({
    queryKey: [ITEMS_KEY, filters],
    queryFn: () => itemsService.getAllItems(filters),
    placeholderData: keepPreviousData,
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
    onSuccess: (item) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === ITEMS_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: Item[]; total: number } | undefined) =>
          updateItemListCache(current, item, 'create')
      );
      queryClient.setQueryData([ITEMS_KEY, item.name], item);
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY], refetchType: 'inactive' });
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
    onSuccess: (item, variables) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === ITEMS_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: Item[]; total: number } | undefined) =>
          updateItemListCache(current, item, 'update')
      );
      queryClient.setQueryData([ITEMS_KEY, variables.name], item);
      queryClient.setQueryData([ITEMS_KEY, item.name], item);
      if (variables.name !== item.name) {
        queryClient.removeQueries({ queryKey: [ITEMS_KEY, variables.name], exact: true });
      }
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY], refetchType: 'inactive' });
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
    onSuccess: (_, name) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === ITEMS_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: Item[]; total: number } | undefined) => {
          if (!current) {
            return current;
          }

          const data = current.data.filter((item) => item.name !== name);
          if (data.length === current.data.length) {
            return current;
          }

          return {
            data,
            total: Math.max(0, current.total - 1),
          };
        }
      );
      queryClient.removeQueries({ queryKey: [ITEMS_KEY, name], exact: true });
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY], refetchType: 'inactive' });
      toast.success('Item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete item');
    },
  });
}
