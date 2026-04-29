import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { Customer, CustomerListParams, RecentInvoice } from '@/types/customer.types';

const CUSTOMER_FIELDS = [
  'name',
  'customer_name',
  'customer_type',
  'customer_group',
  'mobile_no',
  'email_id',
  'disabled',
  'territory',
  'creation',
];

const DEFAULT_CUSTOMER_GROUPS = ['Commercial', 'Individual', 'Non Profit', 'Retail', 'Government'];

export const customersService = {
  async getAllCustomers(params?: CustomerListParams): Promise<{ data: Customer[]; total: number }> {
    try {
      const limit = params?.limit ?? 50;
      const start = params?.start ?? 0;
      const filters: Array<[string, string, string, string]> = [];

      if (params?.customer_type) {
        filters.push(['Customer', 'customer_type', '=', params.customer_type]);
      }
      if (params?.customer_group) {
        filters.push(['Customer', 'customer_group', '=', params.customer_group]);
      }

      const orFilters = params?.search
        ? [
            ['Customer', 'customer_name', 'like', `%${params.search}%`],
            ['Customer', 'mobile_no', 'like', `%${params.search}%`],
            ['Customer', 'email_id', 'like', `%${params.search}%`],
          ]
        : undefined;

      const [listRes, countRes] = await Promise.all([
        axiosInstance.get('/resource/Customer', {
          params: {
            fields: JSON.stringify(CUSTOMER_FIELDS),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            or_filters: orFilters ? JSON.stringify(orFilters) : undefined,
            limit,
            limit_start: start,
            order_by: 'modified desc',
          },
        }),
        axiosInstance.get('/resource/Customer', {
          params: {
            fields: JSON.stringify(['name']),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            or_filters: orFilters ? JSON.stringify(orFilters) : undefined,
            limit: 0,
          },
        }),
      ]);

      return {
        data: (listRes.data.data ?? []) as Customer[],
        total: (countRes.data.data ?? []).length,
      };
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getCustomer(name: string): Promise<Customer> {
    try {
      const res = await axiosInstance.get(`/resource/Customer/${encodeURIComponent(name)}`);
      return res.data.data as Customer;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    try {
      const res = await axiosInstance.post('/resource/Customer', data);
      return res.data.data as Customer;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async updateCustomer(name: string, data: Partial<Customer>): Promise<Customer> {
    try {
      const res = await axiosInstance.put(`/resource/Customer/${encodeURIComponent(name)}`, data);
      return res.data.data as Customer;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async deleteCustomer(name: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/Customer/${encodeURIComponent(name)}`);
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getCustomerBalance(name: string): Promise<number> {
    try {
      const res = await axiosInstance.get('/resource/Sales Invoice', {
        params: {
          fields: JSON.stringify(['outstanding_amount']),
          filters: JSON.stringify([
            ['Sales Invoice', 'customer', '=', name],
            ['Sales Invoice', 'docstatus', '=', '1'],
            ['Sales Invoice', 'outstanding_amount', '>', '0'],
          ]),
          limit: 0,
        },
      });

      const rows = (res.data?.data ?? []) as Array<{ outstanding_amount?: number }>;
      return rows.reduce((sum, row) => sum + (row.outstanding_amount ?? 0), 0);
    } catch {
      return 0;
    }
  },

  async getCustomerGroups(): Promise<string[]> {
    try {
      const res = await axiosInstance.get('/resource/Customer Group', {
        params: {
          fields: JSON.stringify(['name']),
          limit: 100,
          order_by: 'name asc',
        },
      });

      const groups = (res.data.data ?? []).map((r: { name: string }) => r.name);
      return Array.from(new Set([...DEFAULT_CUSTOMER_GROUPS, ...groups]));
    } catch {
      return DEFAULT_CUSTOMER_GROUPS;
    }
  },

  async getCustomersCount(): Promise<number> {
    try {
      const res = await axiosInstance.get('/resource/Customer', {
        params: {
          fields: JSON.stringify(['name']),
          limit: 0,
        },
      });
      return (res.data.data ?? []).length;
    } catch {
      return 0;
    }
  },

  async getRecentInvoices(name: string, limit = 8): Promise<RecentInvoice[]> {
    try {
      const res = await axiosInstance.get('/resource/Sales Invoice', {
        params: {
          fields: JSON.stringify(['name', 'posting_date', 'grand_total', 'outstanding_amount', 'docstatus']),
          filters: JSON.stringify([['Sales Invoice', 'customer', '=', name]]),
          limit,
          order_by: 'posting_date desc, name desc',
        },
      });
      return (res.data.data ?? []) as RecentInvoice[];
    } catch {
      return [];
    }
  },
};
