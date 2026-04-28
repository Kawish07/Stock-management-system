import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';

// ── Types ────────────────────────────────────────────────────────────────────

export interface StockBalanceRow {
  item_code: string;
  item_name: string;
  item_group: string;
  warehouse: string;
  currency: string;
  opening_qty: number;
  in_qty: number;
  out_qty: number;
  bal_qty: number;
  val_rate: number;
  bal_val: number;
}

export interface StockLedgerRow {
  name: string;
  posting_date: string;
  posting_time: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  actual_qty: number;
  qty_after_transaction: number;
  valuation_rate: number;
  stock_value_difference: number;
  voucher_type: string;
  voucher_no: string;
}

export interface DashboardKPIs {
  totalItems: number;
  totalWarehouses: number;
  lowStockItems: number;
  stockEntriesToday: number;
  stockEntriesYesterday: number;
}

// ── Filter shapes ────────────────────────────────────────────────────────────

export interface StockBalanceFilters {
  item_code?: string;
  warehouse?: string;
  from_date?: string;
  to_date?: string;
}

export interface StockLedgerFilters {
  item_code?: string;
  warehouse?: string;
  from_date?: string;
  to_date?: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const reportsService = {
  async getStockBalance(filters?: StockBalanceFilters): Promise<StockBalanceRow[]> {
    const apiFilters: (string | string[])[][] = [];
    if (filters?.item_code) {
      apiFilters.push(['Bin', 'item_code', '=', filters.item_code]);
    }
    if (filters?.warehouse) {
      apiFilters.push(['Bin', 'warehouse', '=', filters.warehouse]);
    }

    try {
      const response = await axiosInstance.get('/resource/Bin', {
        params: {
          fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'stock_value']),
          filters: apiFilters.length ? JSON.stringify(apiFilters) : undefined,
          limit: 100,
        },
      });

      const bins = (response.data.data ?? []) as {
        item_code: string;
        warehouse: string;
        actual_qty: number;
        stock_value: number;
      }[];

      return bins.map((b) => ({
        item_code: b.item_code,
        item_name: b.item_code,
        item_group: '',
        warehouse: b.warehouse,
        currency: '',
        opening_qty: 0,
        in_qty: 0,
        out_qty: 0,
        bal_qty: b.actual_qty ?? 0,
        val_rate: 0,
        bal_val: b.stock_value ?? 0,
      }));
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getStockLedger(filters?: StockLedgerFilters): Promise<StockLedgerRow[]> {
    const apiFilters: (string | string[])[][] = [];
    if (filters?.item_code) {
      apiFilters.push(['Stock Ledger Entry', 'item_code', '=', filters.item_code]);
    }
    if (filters?.warehouse) {
      apiFilters.push(['Stock Ledger Entry', 'warehouse', '=', filters.warehouse]);
    }
    if (filters?.from_date) {
      apiFilters.push(['Stock Ledger Entry', 'posting_date', '>=', filters.from_date]);
    }
    if (filters?.to_date) {
      apiFilters.push(['Stock Ledger Entry', 'posting_date', '<=', filters.to_date]);
    }

    try {
      const response = await axiosInstance.get('/resource/Stock Ledger Entry', {
        params: {
          fields: JSON.stringify([
            'name',
            'posting_date',
            'posting_time',
            'item_code',
            'warehouse',
            'actual_qty',
            'qty_after_transaction',
            'voucher_type',
            'voucher_no',
          ]),
          filters: apiFilters.length ? JSON.stringify(apiFilters) : undefined,
          limit: 500,
          order_by: 'posting_date desc, posting_time desc',
        },
      });
      return response.data.data ?? [];
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

    const [itemsRes, warehousesRes, binsRes, todayRes, yesterdayRes] = await Promise.allSettled([
      axiosInstance.get('/resource/Item', { params: { limit_page_length: 0 } }),
      axiosInstance.get('/resource/Warehouse', { params: { limit_page_length: 0 } }),
      axiosInstance.get('/resource/Bin', {
        params: {
          fields: JSON.stringify(['item_code', 'actual_qty', 'stock_value']),
          limit: 500,
        },
      }),
      axiosInstance.get('/resource/Stock Entry', {
        params: {
          fields: JSON.stringify(['name']),
          filters: JSON.stringify([['Stock Entry', 'posting_date', '=', today]]),
          limit: 0,
        },
      }),
      axiosInstance.get('/resource/Stock Entry', {
        params: {
          fields: JSON.stringify(['name']),
          filters: JSON.stringify([['Stock Entry', 'posting_date', '=', yesterday]]),
          limit: 0,
        },
      }),
    ]);

    const bins =
      binsRes.status === 'fulfilled'
        ? ((binsRes.value.data.data ?? []) as { item_code: string; actual_qty: number; stock_value: number }[])
        : [];

    // Aggregate total qty per item across all warehouses, then apply threshold
    const itemQtyMap: Record<string, number> = {};
    for (const b of bins) {
      itemQtyMap[b.item_code] = (itemQtyMap[b.item_code] ?? 0) + (b.actual_qty ?? 0);
    }
    const lowStockItems = Object.values(itemQtyMap).filter((qty) => qty < 10).length;

    const totalItems =
      itemsRes.status === 'fulfilled' ? (itemsRes.value.data.data as unknown[]).length : 0;
    const totalWarehouses =
      warehousesRes.status === 'fulfilled' ? (warehousesRes.value.data.data as unknown[]).length : 0;
    const stockEntriesToday =
      todayRes.status === 'fulfilled' ? (todayRes.value.data.data as unknown[]).length : 0;
    const stockEntriesYesterday =
      yesterdayRes.status === 'fulfilled' ? (yesterdayRes.value.data.data as unknown[]).length : 0;

      return {
        totalItems,
        totalWarehouses,
        lowStockItems,
        stockEntriesToday,
        stockEntriesYesterday,
      };
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },
};
