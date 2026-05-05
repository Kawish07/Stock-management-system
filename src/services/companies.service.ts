import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '@/types/company.types';

const FIELDS = [
  'name',
  'company_name',
  'abbr',
  'country',
  'default_currency',
  'phone_no',
  'email',
  'website',
  'tax_id',
  'creation',
];

export const companiesService = {
  async getAllCompanies(params?: {
    search?: string;
    limit?: number;
    start?: number;
  }): Promise<{ data: Company[]; total: number }> {
    try {
      const limit = params?.limit ?? 50;
      const start = params?.start ?? 0;
      const filters: string[][] = [];

      if (params?.search) {
        filters.push(['Company', 'company_name', 'like', `%${params.search}%`]);
      }

      const [listRes, countRes] = await Promise.all([
        axiosInstance.get('/resource/Company', {
          params: {
            fields: JSON.stringify(FIELDS),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            limit,
            limit_start: start,
            order_by: 'modified desc',
          },
        }),
        axiosInstance.get('/resource/Company', {
          params: {
            fields: JSON.stringify(['name']),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            limit: 0,
          },
        }),
      ]);

      return {
        data: (listRes.data.data ?? []) as Company[],
        total: (countRes.data.data ?? []).length,
      };
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getCompany(name: string): Promise<Company> {
    try {
      const res = await axiosInstance.get(`/resource/Company/${encodeURIComponent(name)}`);
      return res.data.data as Company;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async createCompany(data: CreateCompanyDto): Promise<Company> {
    try {
      const res = await axiosInstance.post('/resource/Company', data);
      return res.data.data as Company;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async updateCompany(name: string, data: UpdateCompanyDto): Promise<Company> {
    try {
      const res = await axiosInstance.put(
        `/resource/Company/${encodeURIComponent(name)}`,
        data
      );
      return res.data.data as Company;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async deleteCompany(name: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/Company/${encodeURIComponent(name)}`);
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },
};
