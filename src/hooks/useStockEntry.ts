import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stockEntryService, type StockEntryFilters } from '@/services/stockEntry.service';
import type { StockEntry } from '@/types/stockEntry.types';
import toast from 'react-hot-toast';

export const STOCK_ENTRIES_KEY = 'stock-entries';

function updateStockEntryListCache(
  current: { data: StockEntry[]; total: number } | undefined,
  nextEntry: StockEntry,
  mode: 'create' | 'update'
) {
  if (!current) {
    return current;
  }

  const existingIndex = current.data.findIndex((entry) => entry.name === nextEntry.name);
  if (existingIndex >= 0) {
    const data = [...current.data];
    data[existingIndex] = { ...data[existingIndex], ...nextEntry };
    return { ...current, data };
  }

  if (mode === 'create') {
    return {
      data: [nextEntry, ...current.data],
      total: current.total + 1,
    };
  }

  return current;
}

export function useStockEntries(filters?: StockEntryFilters) {
  return useQuery({
    queryKey: [STOCK_ENTRIES_KEY, filters],
    queryFn: () => stockEntryService.getAllStockEntries(filters),
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useStockEntry(name: string) {
  return useQuery({
    queryKey: [STOCK_ENTRIES_KEY, name],
    queryFn: () => stockEntryService.getStockEntry(name),
    enabled: !!name,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateStockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StockEntry, 'name'>) =>
      stockEntryService.createStockEntry(data),
    onSuccess: (entry) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === STOCK_ENTRIES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: StockEntry[]; total: number } | undefined) =>
          updateStockEntryListCache(current, entry, 'create')
      );
      queryClient.setQueryData([STOCK_ENTRIES_KEY, entry.name], entry);
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY], refetchType: 'inactive' });
      toast.success('Stock entry saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create stock entry');
    },
  });
}

export function useUpdateStockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      data,
    }: {
      name: string;
      data: Partial<Omit<StockEntry, 'name'>>;
    }) => stockEntryService.updateStockEntry(name, data),
    onSuccess: (entry, variables) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === STOCK_ENTRIES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: StockEntry[]; total: number } | undefined) =>
          updateStockEntryListCache(current, entry, 'update')
      );
      queryClient.setQueryData([STOCK_ENTRIES_KEY, variables.name], entry);
      queryClient.setQueryData([STOCK_ENTRIES_KEY, entry.name], entry);
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY], refetchType: 'inactive' });
      toast.success('Stock entry saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stock entry');
    },
  });
}

export function useSubmitStockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => stockEntryService.submitStockEntry(name),
    onSuccess: (entry, name) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === STOCK_ENTRIES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: StockEntry[]; total: number } | undefined) =>
          updateStockEntryListCache(current, entry, 'update')
      );
      queryClient.setQueryData([STOCK_ENTRIES_KEY, name], entry);
      queryClient.setQueryData([STOCK_ENTRIES_KEY, entry.name], entry);
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY], refetchType: 'inactive' });
      toast.success('Stock entry submitted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit stock entry');
    },
  });
}

export function useCancelStockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => stockEntryService.cancelStockEntry(name),
    onSuccess: (entry, name) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === STOCK_ENTRIES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: StockEntry[]; total: number } | undefined) =>
          updateStockEntryListCache(current, entry, 'update')
      );
      queryClient.setQueryData([STOCK_ENTRIES_KEY, name], entry);
      queryClient.setQueryData([STOCK_ENTRIES_KEY, entry.name], entry);
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY], refetchType: 'inactive' });
      toast.success('Stock entry cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel stock entry');
    },
  });
}

export function useDeleteStockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => stockEntryService.deleteStockEntry(name),
    onSuccess: (_, name) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === STOCK_ENTRIES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: StockEntry[]; total: number } | undefined) => {
          if (!current) {
            return current;
          }

          const data = current.data.filter((entry) => entry.name !== name);
          if (data.length === current.data.length) {
            return current;
          }

          return {
            data,
            total: Math.max(0, current.total - 1),
          };
        }
      );
      queryClient.removeQueries({ queryKey: [STOCK_ENTRIES_KEY, name], exact: true });
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY], refetchType: 'inactive' });
      toast.success('Stock entry deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete stock entry');
    },
  });
}
