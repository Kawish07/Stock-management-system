import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { StockEntry } from '@/types/stockEntry.types';

const LIST_FIELDS = [
  'name',
  'stock_entry_type',
  'posting_date',
  'posting_time',
  'docstatus',
  'total_amount',
  'remarks',
];

export interface StockEntryFilters {
  stock_entry_type?: string;
  from_date?: string;
  to_date?: string;
  docstatus?: 0 | 1 | 2;
  page?: number;
  pageSize?: number;
}

export const stockEntryService = {
  async getAllStockEntries(
    filters?: StockEntryFilters
  ): Promise<{ data: StockEntry[]; total: number }> {
    try {
      const pageSize = filters?.pageSize ?? 20;
      const page = filters?.page ?? 1;
      const limitStart = (page - 1) * pageSize;

      const apiFilters: (string | string[])[][] = [];
      if (filters?.stock_entry_type) {
        apiFilters.push(['Stock Entry', 'stock_entry_type', '=', filters.stock_entry_type]);
      }
      if (filters?.docstatus !== undefined) {
        apiFilters.push(['Stock Entry', 'docstatus', '=', String(filters.docstatus)]);
      }
      if (filters?.from_date) {
        apiFilters.push(['Stock Entry', 'posting_date', '>=', filters.from_date]);
      }
      if (filters?.to_date) {
        apiFilters.push(['Stock Entry', 'posting_date', '<=', filters.to_date]);
      }

      const [listRes, countRes] = await Promise.all([
        axiosInstance.get('/resource/Stock Entry', {
          params: {
            fields: JSON.stringify(LIST_FIELDS),
            filters: apiFilters.length ? JSON.stringify(apiFilters) : undefined,
            limit: pageSize,
            limit_start: limitStart,
            order_by: 'modified desc',
          },
        }),
        axiosInstance.get('/resource/Stock Entry', {
          params: {
            fields: JSON.stringify(['name']),
            filters: apiFilters.length ? JSON.stringify(apiFilters) : undefined,
            limit: 0,
          },
        }),
      ]);

      return {
        data: listRes.data.data as StockEntry[],
        total: (countRes.data.data as { name: string }[]).length,
      };
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getStockEntry(name: string): Promise<StockEntry> {
    try {
      const response = await axiosInstance.get(
        `/resource/Stock Entry/${encodeURIComponent(name)}`
      );
      return response.data.data as StockEntry;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async createStockEntry(data: Omit<StockEntry, 'name'>): Promise<StockEntry> {
    try {
      // Auto-detect company from the first item's warehouse if not already set
      if (!data.company && data.items?.length) {
        const warehouse = data.items[0].t_warehouse || data.items[0].s_warehouse;
        if (warehouse) {
          const whResp = await axiosInstance.get(
            `/resource/Warehouse/${encodeURIComponent(warehouse)}`,
            { params: { fields: JSON.stringify(['company']) } }
          );
          data = { ...data, company: whResp.data.data.company as string };
        }
      }
      const response = await axiosInstance.post('/resource/Stock Entry', data);
      return response.data.data as StockEntry;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async updateStockEntry(
    name: string,
    data: Partial<Omit<StockEntry, 'name'>>
  ): Promise<StockEntry> {
    try {
      const response = await axiosInstance.put(
        `/resource/Stock Entry/${encodeURIComponent(name)}`,
        data
      );
      return response.data.data as StockEntry;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async submitStockEntry(name: string): Promise<StockEntry> {
    try {
      // Fetch the latest doc first so frappe.client.submit has the correct modified timestamp
      const latestDoc = await axiosInstance.get(`/resource/Stock Entry/${encodeURIComponent(name)}`);
      const doc = latestDoc.data.data as StockEntry;
      const response = await axiosInstance.post('/method/frappe.client.submit', { doc });
      return response.data.message as StockEntry;
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      if (raw.toLowerCase().includes('insufficient stock')) {
        throw new Error('Insufficient stock available in selected warehouse.');
      }
      if (raw.toLowerCase().includes('mandatory')) {
        throw new Error('Please fill all required fields.');
      }
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async cancelStockEntry(name: string): Promise<StockEntry> {
    try {
      const response = await axiosInstance.post('/method/frappe.client.cancel', {
        doctype: 'Stock Entry',
        name,
      });
      return response.data.message as StockEntry;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async deleteStockEntry(name: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/Stock Entry/${encodeURIComponent(name)}`);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },
};
