import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import type { SalesInvoice } from '@/types/invoice.types';
import type { InvoiceFilters } from '@/services/invoice.service';
import toast from 'react-hot-toast';

export const INVOICES_KEY = 'invoices';

function updateInvoicesCache(
  current: { data: SalesInvoice[]; total: number } | undefined,
  nextInvoice: SalesInvoice,
  mode: 'create' | 'update'
) {
  if (!current) {
    return current;
  }

  const existingIndex = current.data.findIndex((invoice) => invoice.name === nextInvoice.name);
  if (existingIndex >= 0) {
    const data = [...current.data];
    data[existingIndex] = { ...data[existingIndex], ...nextInvoice };
    return { ...current, data };
  }

  if (mode === 'create') {
    return {
      data: [nextInvoice, ...current.data],
      total: current.total + 1,
    };
  }

  return current;
}

export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: [INVOICES_KEY, filters],
    queryFn: () => invoiceService.getAllInvoices(filters),
    placeholderData: keepPreviousData,
    retry: 1,
    retryDelay: 1000,
  });
}

export function useInvoice(name: string) {
  return useQuery({
    queryKey: [INVOICES_KEY, name],
    queryFn: () => invoiceService.getInvoice(name),
    enabled: !!name,
    retry: 1,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SalesInvoice) => invoiceService.createInvoice(data),
    onSuccess: (invoice) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === INVOICES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: SalesInvoice[]; total: number } | undefined) =>
          updateInvoicesCache(current, invoice, 'create')
      );
      queryClient.setQueryData([INVOICES_KEY, invoice.name], invoice);
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY], refetchType: 'inactive' });
      toast.success('Invoice saved as draft');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<SalesInvoice> }) =>
      invoiceService.updateInvoice(name, data),
    onSuccess: (invoice, variables) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === INVOICES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: SalesInvoice[]; total: number } | undefined) =>
          updateInvoicesCache(current, invoice, 'update')
      );
      queryClient.setQueryData([INVOICES_KEY, variables.name], invoice);
      queryClient.setQueryData([INVOICES_KEY, invoice.name], invoice);
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY], refetchType: 'inactive' });
      toast.success('Invoice updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice');
    },
  });
}

export function useSubmitInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => invoiceService.submitInvoice(name),
    onSuccess: (_, name) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === INVOICES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: SalesInvoice[]; total: number } | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            data: current.data.map((invoice) =>
              invoice.name === name ? { ...invoice, docstatus: 1 } : invoice
            ),
          };
        }
      );
      queryClient.setQueryData([INVOICES_KEY, name], (current: SalesInvoice | undefined) =>
        current ? { ...current, docstatus: 1 } : current
      );
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY], refetchType: 'inactive' });
      toast.success('Invoice submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit invoice');
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => invoiceService.cancelInvoice(name),
    onSuccess: (_, name) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === INVOICES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: SalesInvoice[]; total: number } | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            data: current.data.map((invoice) =>
              invoice.name === name ? { ...invoice, docstatus: 2 } : invoice
            ),
          };
        }
      );
      queryClient.setQueryData([INVOICES_KEY, name], (current: SalesInvoice | undefined) =>
        current ? { ...current, docstatus: 2 } : current
      );
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY], refetchType: 'inactive' });
      toast.success('Invoice cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invoice');
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => invoiceService.markInvoicePaid(name),
    onSuccess: (_, name) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === INVOICES_KEY &&
            query.queryKey.length === 2 &&
            (query.queryKey[1] === undefined || typeof query.queryKey[1] === 'object'),
        },
        (current: { data: SalesInvoice[]; total: number } | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            data: current.data.map((invoice) =>
              invoice.name === name ? { ...invoice, outstanding_amount: 0, docstatus: 1 } : invoice
            ),
          };
        }
      );
      queryClient.setQueryData([INVOICES_KEY, name], (current: SalesInvoice | undefined) =>
        current ? { ...current, outstanding_amount: 0, docstatus: 1 } : current
      );
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY], refetchType: 'inactive' });
      toast.success('Payment recorded. Invoice marked as paid.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });
}

export function useInvoicesToday() {
  return useQuery({
    queryKey: [INVOICES_KEY, 'today-count'],
    queryFn: () => invoiceService.getInvoicesToday(),
    staleTime: 60_000,
  });
}

export function useRevenueToday() {
  return useQuery({
    queryKey: [INVOICES_KEY, 'today-revenue'],
    queryFn: () => invoiceService.getRevenueToday(),
    staleTime: 60_000,
  });
}

export function useUnpaidInvoices() {
  return useQuery({
    queryKey: [INVOICES_KEY, 'unpaid'],
    queryFn: () => invoiceService.getUnpaidInvoices(),
    staleTime: 60_000,
  });
}

