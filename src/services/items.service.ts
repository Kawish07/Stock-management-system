import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { Item, CreateItemDto, UpdateItemDto } from '@/types/item.types';

// Only fields permitted by ERPNext's get_list validation.
// Long Text/Text Editor fields (description) and virtual fields (actual_qty) are blocked.
// reorder_level is a child-table value and NOT queryable in Item get_list.
const FIELDS = [
  'name',
  'item_code',
  'item_name',
  'item_group',
  'stock_uom',
  'is_stock_item',
  'disabled',
  'valuation_rate',
  'standard_rate',
];

export const itemsService = {
  async getAllItems(params?: {
    search?: string;
    item_group?: string;
    limit?: number;
    start?: number;
  }): Promise<{ data: Item[]; total: number }> {
    try {
      const limit = params?.limit ?? 20;
      const start = params?.start ?? 0;

      const filters: string[][] = [];
      if (params?.search) {
        filters.push(['Item', 'item_name', 'like', `%${params.search}%`]);
      }
      if (params?.item_group) {
        filters.push(['Item', 'item_group', '=', params.item_group]);
      }

      const [listRes, countRes] = await Promise.all([
        axiosInstance.get('/resource/Item', {
          params: {
            fields: JSON.stringify(FIELDS),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            limit,
            limit_start: start,
            order_by: 'modified desc',
          },
        }),
        axiosInstance.get('/resource/Item', {
          params: {
            fields: JSON.stringify(['name']),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            limit: 0,
          },
        }),
      ]);

      const items = listRes.data.data as Item[];

      // actual_qty is a virtual field on Item — fetch from Bin and sum per item.
      if (items.length > 0) {
        const itemCodes = items.map((i) => i.item_code ?? i.name);

        const [binResult] = await Promise.allSettled([
          axiosInstance.get('/resource/Bin', {
            params: {
              fields: JSON.stringify(['item_code', 'actual_qty']),
              filters: JSON.stringify([['Bin', 'item_code', 'in', itemCodes]]),
              limit: 0,
            },
          }),
        ]);

        const bins =
          binResult.status === 'fulfilled'
            ? ((binResult.value.data.data ?? []) as { item_code: string; actual_qty: number }[])
            : [];
        const qtyMap: Record<string, number> = {};
        for (const bin of bins) {
          qtyMap[bin.item_code] = (qtyMap[bin.item_code] ?? 0) + bin.actual_qty;
        }

        for (const item of items) {
          const code = item.item_code ?? item.name;
          item.actual_qty = qtyMap[code] ?? 0;
        }
      }

      return {
        data: items,
        total: (countRes.data.data as { name: string }[]).length,
      };
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getItem(itemCode: string): Promise<Item> {
    try {
      const res = await axiosInstance.get(`/resource/Item/${encodeURIComponent(itemCode)}`);
      return res.data.data as Item;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async createItem(data: CreateItemDto): Promise<Item> {
    try {
      const res = await axiosInstance.post('/resource/Item', data);
      return res.data.data as Item;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async updateItem(name: string, data: UpdateItemDto): Promise<Item> {
    try {
      const res = await axiosInstance.put(`/resource/Item/${encodeURIComponent(name)}`, data);
      return res.data.data as Item;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async deleteItem(name: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/Item/${encodeURIComponent(name)}`);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getItemStock(itemCode: string, warehouse: string): Promise<number> {
    try {
      const res = await axiosInstance.get('/method/erpnext.stock.utils.get_stock_balance', {
        params: { item_code: itemCode, warehouse },
      });
      return (res.data.message as number) ?? 0;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },
};
