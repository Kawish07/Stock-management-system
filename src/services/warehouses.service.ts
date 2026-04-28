import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '@/types/warehouse.types';

// 'country' (Link) and 'account' (Link) are blocked by ERPNext's get_list validation.
// They are available on the single-document GET used in getWarehouse().
const FIELDS = [
  'name',
  'warehouse_name',
  'warehouse_type',
  'parent_warehouse',
  'city',
  'is_group',
  'disabled',
];

export interface WarehouseStockValue {
  warehouse: string;
  stock_value: number;
}

export const warehousesService = {
  async getAllWarehouses(): Promise<Warehouse[]> {
    try {
      const response = await axiosInstance.get('/resource/Warehouse', {
        params: {
          fields: JSON.stringify(FIELDS),
          limit: 100,
          order_by: 'warehouse_name asc',
        },
      });
      return response.data.data as Warehouse[];
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getWarehouse(name: string): Promise<Warehouse> {
    try {
      const response = await axiosInstance.get(
        `/resource/Warehouse/${encodeURIComponent(name)}`
      );
      return response.data.data as Warehouse;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getWarehouseTypes(): Promise<string[]> {
    try {
      const response = await axiosInstance.get('/resource/Warehouse Type', {
        params: { fields: JSON.stringify(['name']), limit: 50 },
      });
      return (response.data.data as Array<{ name: string }>).map((t) => t.name);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async createWarehouse(data: CreateWarehouseDto): Promise<Warehouse> {
    try {
      const response = await axiosInstance.post('/resource/Warehouse', data);
      return response.data.data as Warehouse;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async updateWarehouse(name: string, data: UpdateWarehouseDto): Promise<Warehouse> {
    try {
      const response = await axiosInstance.put(
        `/resource/Warehouse/${encodeURIComponent(name)}`,
        data
      );
      return response.data.data as Warehouse;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async deleteWarehouse(name: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/Warehouse/${encodeURIComponent(name)}`);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getWarehouseStockValue(warehouse: string): Promise<WarehouseStockValue[]> {
    try {
      const response = await axiosInstance.get(
        '/method/erpnext.stock.report.stock_balance.stock_balance.execute',
        {
          params: {
            filters: JSON.stringify({ warehouse }),
          },
        }
      );
      // The execute method returns [columns, data]; extract data rows
      const rows: unknown[][] = response.data.message?.[1] ?? [];
      return rows.map((row) => ({
        warehouse: row[0] as string,
        stock_value: Number(row[row.length - 1] ?? 0),
      }));
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },
};

