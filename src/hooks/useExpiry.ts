import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expiryService } from '@/services/expiry.service';
import type { CreateBatchDto, UpdateBatchDto } from '@/types/expiry.types';
import toast from 'react-hot-toast';

export const BATCHES_KEY = 'batches';
export const EXPIRY_ITEMS_KEY = 'expiry-items';

export function useBatches(params?: {
  search?: string;
  item?: string;
  limit?: number;
  start?: number;
  near_expiry?: boolean;
  expired?: boolean;
}) {
  return useQuery({
    queryKey: [BATCHES_KEY, params],
    queryFn: () => expiryService.getAllBatches(params),
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useNearExpiryBatches() {
  return useQuery({
    queryKey: [BATCHES_KEY, 'near-expiry'],
    queryFn: () => expiryService.getAllBatches({ near_expiry: true, limit: 200 }),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useExpiredBatches() {
  return useQuery({
    queryKey: [BATCHES_KEY, 'expired'],
    queryFn: () => expiryService.getExpiredBatches(),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useBatch(name: string) {
  return useQuery({
    queryKey: [BATCHES_KEY, name],
    queryFn: () => expiryService.getBatch(name),
    enabled: !!name,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchDto) => expiryService.createBatch(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      toast.success('Batch created successfully!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpdateBatchDto }) =>
      expiryService.updateBatch(name, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      toast.success('Batch updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => expiryService.deleteBatch(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCHES_KEY] });
      toast.success('Batch deleted.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Item-based expiry hooks (Custom Field approach) ───────────────────────

export function useNearExpiryItems(days = 60) {
  return useQuery({
    queryKey: [EXPIRY_ITEMS_KEY, 'near', days],
    queryFn: () => expiryService.getNearExpiryItems(days),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExpiredItems() {
  return useQuery({
    queryKey: [EXPIRY_ITEMS_KEY, 'expired'],
    queryFn: () => expiryService.getExpiredItems(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSetItemExpiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemCode, expiryDate }: { itemCode: string; expiryDate: string | null }) =>
      expiryService.setItemExpiry(itemCode, expiryDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EXPIRY_ITEMS_KEY] });
      toast.success('Expiry date updated.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
