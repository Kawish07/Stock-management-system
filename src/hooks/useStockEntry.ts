import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockEntryService, type StockEntryFilters } from '@/services/stockEntry.service';
import type { StockEntry } from '@/types/stockEntry.types';
import toast from 'react-hot-toast';

export const STOCK_ENTRIES_KEY = 'stock-entries';

export function useStockEntries(filters?: StockEntryFilters) {
  return useQuery({
    queryKey: [STOCK_ENTRIES_KEY, filters],
    queryFn: () => stockEntryService.getAllStockEntries(filters),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOCK_ENTRIES_KEY] });
      toast.success('Stock entry deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete stock entry');
    },
  });
}
