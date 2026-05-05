import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/services/companies.service';
import type { CreateCompanyDto, UpdateCompanyDto } from '@/types/company.types';
import toast from 'react-hot-toast';

export const COMPANIES_KEY = 'companies';

export function useCompanies(params?: { search?: string; limit?: number; start?: number }) {
  return useQuery({
    queryKey: [COMPANIES_KEY, params],
    queryFn: () => companiesService.getAllCompanies(params),
    placeholderData: keepPreviousData,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCompany(name: string) {
  return useQuery({
    queryKey: [COMPANIES_KEY, name],
    queryFn: () => companiesService.getCompany(name),
    enabled: !!name,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyDto) => companiesService.createCompany(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COMPANIES_KEY] });
      toast.success('Company created successfully!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpdateCompanyDto }) =>
      companiesService.updateCompany(name, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COMPANIES_KEY] });
      toast.success('Company updated successfully!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => companiesService.deleteCompany(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COMPANIES_KEY] });
      toast.success('Company deleted.');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
