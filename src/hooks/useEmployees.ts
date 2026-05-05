import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesService } from '@/services/employees.service';
import type { CreateEmployeeDto, UpdateEmployeeDto } from '@/types/employee.types';
import toast from 'react-hot-toast';

export const EMPLOYEES_KEY = 'employees';

export function useEmployees(params?: {
  search?: string;
  company?: string;
  status?: string;
  limit?: number;
  start?: number;
}) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, params],
    queryFn: () => employeesService.getAllEmployees(params),
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useEmployee(name: string) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, name],
    queryFn: () => employeesService.getEmployee(name),
    enabled: !!name,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => employeesService.createEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpdateEmployeeDto }) =>
      employeesService.updateEmployee(name, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
      toast.success('Employee updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => employeesService.deleteEmployee(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
      toast.success('Employee deleted.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Linked-doc helpers ──────────────────────────────────────────────────────

async function fetchLinkedNames(doctype: string): Promise<string[]> {
  const { default: axiosInstance } = await import('@/lib/axios');
  const res = await axiosInstance.get(`/resource/${doctype}`, {
    params: { fields: JSON.stringify(['name']), limit: 200, order_by: 'name asc' },
  });
  return ((res.data?.data ?? []) as { name: string }[]).map((r) => r.name);
}

export function useDesignations() {
  return useQuery({
    queryKey: ['designations'],
    queryFn: () => fetchLinkedNames('Designation'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartments(company?: string) {
  return useQuery({
    queryKey: ['departments', company],
    queryFn: async () => {
      const { default: axiosInstance } = await import('@/lib/axios');
      const filters: string[][] = [];
      if (company) filters.push(['Department', 'company', '=', company]);
      const res = await axiosInstance.get('/resource/Department', {
        params: {
          fields: JSON.stringify(['name']),
          filters: filters.length ? JSON.stringify(filters) : undefined,
          limit: 200,
          order_by: 'name asc',
        },
      });
      return ((res.data?.data ?? []) as { name: string }[]).map((r) => r.name);
    },
    staleTime: 5 * 60 * 1000,
  });
}
