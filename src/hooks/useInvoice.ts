import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import type { CreateInvoiceDto } from '@/types/invoice.types';
import type { InvoiceFilters } from '@/services/invoice.service';
import toast from 'react-hot-toast';

export const INVOICES_KEY = 'invoices';

export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: [INVOICES_KEY, filters],
    queryFn: () => invoiceService.getInvoices(filters),
    retry: 1,
    retryDelay: 1000,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvoiceDto) => invoiceService.createInvoice(dto),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      // Also invalidate items so stock qty refreshes
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      const src = record.source === 'local' ? ' (stock entry logged)' : '';
      toast.success(`Invoice created successfully${src}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
}
