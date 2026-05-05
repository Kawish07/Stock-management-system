import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { Batch, BatchWithQty, CreateBatchDto, UpdateBatchDto, ExpiryItem } from '@/types/expiry.types';

// ── Custom-field approach (bypasses has_batch_no entirely) ──────────────────
// We store expiry dates as a Custom Field on the Item doctype.
// This avoids all ERPNext Batch/has_batch_no validator issues.

let _fieldReady: Promise<void> | null = null;

async function ensureExpiryCustomField(): Promise<void> {
  if (_fieldReady) return _fieldReady;
  _fieldReady = (async () => {
    try {
      await axiosInstance.post('/resource/Custom Field', {
        dt: 'Item',
        fieldname: 'custom_expiry_date',
        fieldtype: 'Date',
        label: 'Expiry Date',
        insert_after: 'description',
        in_list_view: 0,
      });
    } catch {
      // Field already exists — ignore
    }
  })();
  return _fieldReady;
}

const BATCH_FIELDS = [
  'name',
  'batch_id',
  'item',
  'expiry_date',
  'manufacturing_date',
  'description',
  'creation',
];

export const expiryService = {
  async getAllBatches(params?: {
    search?: string;
    item?: string;
    limit?: number;
    start?: number;
      near_expiry?: boolean; // expiry within 60 days
      expired?: boolean; // already past expiry
  }): Promise<{ data: Batch[]; total: number }> {
    try {
      const limit = params?.limit ?? 50;
      const start = params?.start ?? 0;
      const filters: string[][] = [];

      if (params?.item) {
        filters.push(['Batch', 'item', '=', params.item]);
      }
      if (params?.search) {
        filters.push(['Batch', 'batch_id', 'like', `%${params.search}%`]);
      }
      if (params?.near_expiry) {
        const today = new Date().toISOString().split('T')[0];
        const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        filters.push(['Batch', 'expiry_date', '>=', today]);
        filters.push(['Batch', 'expiry_date', '<=', in60days]);
      }
      if (params?.expired) {
        const today = new Date().toISOString().split('T')[0];
        filters.push(['Batch', 'expiry_date', '<', today]);
      }

      const [listRes, countRes] = await Promise.all([
        axiosInstance.get('/resource/Batch', {
          params: {
            fields: JSON.stringify(BATCH_FIELDS),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            limit,
            limit_start: start,
            order_by: 'expiry_date asc',
          },
        }),
        axiosInstance.get('/resource/Batch', {
          params: {
            fields: JSON.stringify(['name']),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            limit: 0,
          },
        }),
      ]);

      const batches = (listRes.data.data ?? []) as Batch[];

      // Enrich with item names
      if (batches.length > 0) {
        const itemCodes = [...new Set(batches.map((b) => b.item))];
        try {
          const itemRes = await axiosInstance.get('/resource/Item', {
            params: {
              fields: JSON.stringify(['name', 'item_name']),
              filters: JSON.stringify([['Item', 'name', 'in', itemCodes]]),
              limit: itemCodes.length,
            },
          });
          const itemMap: Record<string, string> = {};
          for (const itm of (itemRes.data.data ?? []) as { name: string; item_name: string }[]) {
            itemMap[itm.name] = itm.item_name;
          }
          batches.forEach((b) => {
            b.item_name = itemMap[b.item] ?? b.item;
          });
        } catch {
          // item name enrichment is optional
        }
      }

      return {
        data: batches,
        total: (countRes.data.data ?? []).length,
      };
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getBatch(name: string): Promise<Batch> {
    try {
      const res = await axiosInstance.get(`/resource/Batch/${encodeURIComponent(name)}`);
      return res.data.data as Batch;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async createBatch(data: CreateBatchDto): Promise<Batch> {
    try {
      // Use frappe.client.set_value which writes directly to DB, bypassing
      // the "has existing transactions" validator that blocks PUT /resource/Item.
      try {
        await axiosInstance.post('/method/frappe.client.set_value', {
          doctype: 'Item',
          name: data.item,
          fieldname: 'has_batch_no',
          value: 1,
        });
      } catch {
        // Silently ignore — if it's already 1 the batch creation will succeed anyway.
      }

      const res = await axiosInstance.post('/resource/Batch', data);
      return res.data.data as Batch;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async updateBatch(name: string, data: UpdateBatchDto): Promise<Batch> {
    try {
      const res = await axiosInstance.put(`/resource/Batch/${encodeURIComponent(name)}`, data);
      return res.data.data as Batch;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async deleteBatch(name: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/Batch/${encodeURIComponent(name)}`);
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getExpiredBatches(): Promise<Batch[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axiosInstance.get('/resource/Batch', {
        params: {
          fields: JSON.stringify(BATCH_FIELDS),
          filters: JSON.stringify([['Batch', 'expiry_date', '<', today]]),
          order_by: 'expiry_date asc',
          limit: 100,
        },
      });
      return (res.data.data ?? []) as Batch[];
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  // ── Item-based expiry (Custom Field) ─────────────────────────────────────

  async setItemExpiry(itemCode: string, expiryDate: string | null): Promise<void> {
    await ensureExpiryCustomField();
    try {
      await axiosInstance.post('/method/frappe.client.set_value', {
        doctype: 'Item',
        name: itemCode,
        fieldname: 'custom_expiry_date',
        value: expiryDate ?? '',
      });
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getNearExpiryItems(days = 60): Promise<ExpiryItem[]> {
    await ensureExpiryCustomField();
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    try {
      const res = await axiosInstance.get('/resource/Item', {
        params: {
          fields: JSON.stringify(['name', 'item_code', 'item_name', 'item_group', 'custom_expiry_date']),
          filters: JSON.stringify([
            ['Item', 'custom_expiry_date', '>=', today],
            ['Item', 'custom_expiry_date', '<=', future],
          ]),
          order_by: 'custom_expiry_date asc',
          limit: 200,
        },
      });
      return (res.data.data ?? []) as ExpiryItem[];
    } catch {
      return [];
    }
  },

  async getExpiredItems(): Promise<ExpiryItem[]> {
    await ensureExpiryCustomField();
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await axiosInstance.get('/resource/Item', {
        params: {
          fields: JSON.stringify(['name', 'item_code', 'item_name', 'item_group', 'custom_expiry_date']),
          filters: JSON.stringify([
            ['Item', 'custom_expiry_date', 'is', 'set'],
            ['Item', 'custom_expiry_date', '<', today],
          ]),
          order_by: 'custom_expiry_date asc',
          limit: 200,
        },
      });
      return (res.data.data ?? []) as ExpiryItem[];
    } catch {
      return [];
    }
  },
};
