import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customersService } from '@/services/customers.service';
import type { CustomerListParams, Customer } from '@/types/customer.types';

export const CUSTOMERS_KEY = 'customers';

function updateCustomerListCache(
  current: { data: Customer[]; total: number } | undefined,
  nextCustomer: Customer,
  mode: 'create' | 'update'
) {
  if (!current) {
    return current;
  }

  const existingIndex = current.data.findIndex((customer) => customer.name === nextCustomer.name);
  if (existingIndex >= 0) {
    const data = [...current.data];
    data[existingIndex] = { ...data[existingIndex], ...nextCustomer };
    return { ...current, data };
  }

  if (mode === 'create') {
    return {
      data: [nextCustomer, ...current.data],
      total: current.total + 1,
    };
  }

  return current;
}

export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, params],
    queryFn: () => customersService.getAllCustomers(params),
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export function useCustomer(name: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, name],
    queryFn: () => customersService.getCustomer(name),
    enabled: !!name,
    retry: 1,
  });
}

export function useCustomerBalance(name: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, name, 'balance'],
    queryFn: () => customersService.getCustomerBalance(name),
    enabled: !!name,
    staleTime: 60_000,
  });
}

export function useCustomerGroups() {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, 'groups'],
    queryFn: () => customersService.getCustomerGroups(),
    staleTime: 10 * 60_000,
  });
}

export function useCustomersCount() {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, 'count'],
    queryFn: () => customersService.getCustomersCount(),
    staleTime: 60_000,
  });
}

export function useCustomerRecentInvoices(name: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, name, 'recent-invoices'],
    queryFn: () => customersService.getRecentInvoices(name),
    enabled: !!name,
    staleTime: 60_000,
  });
}

export function useCustomerInvoices(name: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, name, 'all-invoices'],
    queryFn: () => customersService.getRecentInvoices(name, 200),
    enabled: !!name,
    staleTime: 60_000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) => customersService.createCustomer(data),
    onSuccess: (customer) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === CUSTOMERS_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: Customer[]; total: number } | undefined) =>
          updateCustomerListCache(current, customer, 'create')
      );
      queryClient.setQueryData([CUSTOMERS_KEY, customer.name], customer);
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY], refetchType: 'inactive' });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<Customer> }) =>
      customersService.updateCustomer(name, data),
    onSuccess: (customer, variables) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === CUSTOMERS_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: Customer[]; total: number } | undefined) =>
          updateCustomerListCache(current, customer, 'update')
      );
      queryClient.setQueryData([CUSTOMERS_KEY, variables.name], customer);
      queryClient.setQueryData([CUSTOMERS_KEY, customer.name], customer);
      if (variables.name !== customer.name) {
        queryClient.removeQueries({ queryKey: [CUSTOMERS_KEY, variables.name], exact: true });
      }
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY], refetchType: 'inactive' });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => customersService.deleteCustomer(name),
    onSuccess: (_, name) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === CUSTOMERS_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: Customer[]; total: number } | undefined) => {
          if (!current) {
            return current;
          }

          const data = current.data.filter((customer) => customer.name !== name);
          if (data.length === current.data.length) {
            return current;
          }

          return {
            data,
            total: Math.max(0, current.total - 1),
          };
        }
      );
      queryClient.removeQueries({ queryKey: [CUSTOMERS_KEY, name], exact: true });
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_KEY], refetchType: 'inactive' });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
}
