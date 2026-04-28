import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesService } from '@/services/warehouses.service';
import type { CreateWarehouseDto, UpdateWarehouseDto } from '@/types/warehouse.types';
import toast from 'react-hot-toast';

export const WAREHOUSES_KEY = 'warehouses';
export const WAREHOUSE_TYPES_KEY = 'warehouseTypes';

export function useWarehouseTypes() {
  return useQuery({
    queryKey: [WAREHOUSE_TYPES_KEY],
    queryFn: () => warehousesService.getWarehouseTypes(),
    staleTime: 5 * 60 * 1000, // cache for 5 min — types rarely change
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: [WAREHOUSES_KEY],
    queryFn: () => warehousesService.getAllWarehouses(),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useWarehouse(name: string) {
  return useQuery({
    queryKey: [WAREHOUSES_KEY, name],
    queryFn: () => warehousesService.getWarehouse(name),
    enabled: !!name,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWarehouseDto) => warehousesService.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WAREHOUSES_KEY] });
      toast.success('Warehouse created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create warehouse');
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpdateWarehouseDto }) =>
      warehousesService.updateWarehouse(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WAREHOUSES_KEY] });
      toast.success('Warehouse updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update warehouse');
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => warehousesService.deleteWarehouse(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WAREHOUSES_KEY] });
      toast.success('Warehouse deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete warehouse');
    },
  });
}

