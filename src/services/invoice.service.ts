import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { InvoiceRecord, CreateInvoiceDto } from '@/types/invoice.types';

// ── Local storage fallback ────────────────────────────────────────────────────
const LS_KEY = 'stockflow_invoices';

function loadLocalInvoices(): InvoiceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as InvoiceRecord[];
  } catch {
    return [];
  }
}

function saveLocalInvoices(records: InvoiceRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(records));
}

function generateLocalId(): string {
  return `LOC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ── ERPNext list fields ───────────────────────────────────────────────────────
const LIST_FIELDS = ['name', 'customer', 'posting_date', 'grand_total', 'docstatus', 'total_qty'];

export interface InvoiceFilters {
  customer?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  pageSize?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const invoiceService = {
  /**
   * Create a Sales Invoice in ERPNext AND reduce stock via Material Issue.
   * Falls back to localStorage if ERPNext is unavailable.
   */
  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceRecord> {
    const today = new Date().toISOString().split('T')[0];

    // ── 1. Try ERPNext Sales Invoice ─────────────────────────────────────────
    try {
      // First, find default warehouse for the item if not provided
      let warehouse = dto.warehouse;
      if (!warehouse) {
        try {
          const binRes = await axiosInstance.get('/resource/Bin', {
            params: {
              fields: JSON.stringify(['warehouse', 'actual_qty']),
              filters: JSON.stringify([['Bin', 'item_code', '=', dto.item_code]]),
              order_by: 'actual_qty desc',
              limit: 1,
            },
          });
          warehouse = binRes.data.data?.[0]?.warehouse ?? '';
        } catch {
          warehouse = '';
        }
      }

      // Create Sales Invoice (ERPNext handles stock deduction automatically)
      const invoicePayload = {
        customer: dto.customer || 'Walk-in Customer',
        posting_date: today,
        due_date: today,
        items: [
          {
            item_code: dto.item_code,
            item_name: dto.item_name,
            qty: dto.qty,
            rate: dto.rate,
            uom: 'Nos',
            ...(warehouse ? { warehouse } : {}),
          },
        ],
        remarks: dto.remarks ?? '',
        update_stock: 1, // tells ERPNext to also deduct stock
      };

      const res = await axiosInstance.post('/resource/Sales Invoice', invoicePayload);
      const created = res.data.data;

      // Submit the invoice so stock is actually deducted
      await axiosInstance.put(`/resource/Sales Invoice/${encodeURIComponent(created.name)}`, {
        docstatus: 1,
      });

      const record: InvoiceRecord = {
        id: created.name,
        customer: dto.customer || 'Walk-in Customer',
        item_code: dto.item_code,
        item_name: dto.item_name,
        qty: dto.qty,
        rate: dto.rate,
        total: dto.qty * dto.rate,
        warehouse,
        remarks: dto.remarks,
        date: today,
        docstatus: 1,
        source: 'erpnext',
      };

      // Mirror to local so offline list still works
      const existing = loadLocalInvoices();
      saveLocalInvoices([record, ...existing]);

      return record;
    } catch (erpError) {
      // ── 2. Fallback: store locally + create Material Issue stock entry ───
      console.warn('[InvoiceService] ERPNext Sales Invoice failed, using local fallback', erpError);

      // Try to reduce stock via Material Issue (stock entry)
      try {
        let warehouse = dto.warehouse;
        if (!warehouse) {
          const binRes = await axiosInstance.get('/resource/Bin', {
            params: {
              fields: JSON.stringify(['warehouse', 'actual_qty']),
              filters: JSON.stringify([['Bin', 'item_code', '=', dto.item_code]]),
              order_by: 'actual_qty desc',
              limit: 1,
            },
          });
          warehouse = binRes.data.data?.[0]?.warehouse ?? '';
        }

        if (warehouse) {
          const whRes = await axiosInstance.get(`/resource/Warehouse/${encodeURIComponent(warehouse)}`, {
            params: { fields: JSON.stringify(['company']) },
          });
          const company = whRes.data.data?.company ?? '';

          await axiosInstance.post('/resource/Stock Entry', {
            stock_entry_type: 'Material Issue',
            posting_date: today,
            posting_time: new Date().toTimeString().slice(0, 8),
            company,
            docstatus: 1,
            remarks: `Sale to ${dto.customer || 'Walk-in Customer'}${dto.remarks ? ` — ${dto.remarks}` : ''}`,
            items: [
              {
                item_code: dto.item_code,
                item_name: dto.item_name,
                s_warehouse: warehouse,
                qty: dto.qty,
                uom: 'Nos',
                stock_uom: 'Nos',
                basic_rate: dto.rate,
                basic_amount: dto.qty * dto.rate,
              },
            ],
          });
        }
      } catch (seError) {
        console.warn('[InvoiceService] Stock entry fallback also failed', seError);
        const { message } = handleApiError(seError);
        throw new Error(message);
      }

      // Save invoice record locally
      const record: InvoiceRecord = {
        id: generateLocalId(),
        customer: dto.customer || 'Walk-in Customer',
        item_code: dto.item_code,
        item_name: dto.item_name,
        qty: dto.qty,
        rate: dto.rate,
        total: dto.qty * dto.rate,
        warehouse: dto.warehouse,
        remarks: dto.remarks,
        date: today,
        docstatus: 1,
        source: 'local',
      };

      const existing = loadLocalInvoices();
      saveLocalInvoices([record, ...existing]);

      return record;
    }
  },

  /**
   * List all invoices: merge ERPNext records + local-only records.
   */
  async getInvoices(filters?: InvoiceFilters): Promise<{ data: InvoiceRecord[]; total: number }> {
    const pageSize = filters?.pageSize ?? 50;
    const page = filters?.page ?? 1;
    const limitStart = (page - 1) * pageSize;

    // Local records
    const localRecords = loadLocalInvoices();

    try {
      const apiFilters: (string | string[])[][] = [];
      if (filters?.customer) {
        apiFilters.push(['Sales Invoice', 'customer', 'like', `%${filters.customer}%`]);
      }
      if (filters?.from_date) {
        apiFilters.push(['Sales Invoice', 'posting_date', '>=', filters.from_date]);
      }
      if (filters?.to_date) {
        apiFilters.push(['Sales Invoice', 'posting_date', '<=', filters.to_date]);
      }

      const [listRes, countRes] = await Promise.all([
        axiosInstance.get('/resource/Sales Invoice', {
          params: {
            fields: JSON.stringify(LIST_FIELDS),
            filters: apiFilters.length ? JSON.stringify(apiFilters) : undefined,
            limit: pageSize,
            limit_start: limitStart,
            order_by: 'modified desc',
          },
        }),
        axiosInstance.get('/resource/Sales Invoice', {
          params: {
            fields: JSON.stringify(['name']),
            filters: apiFilters.length ? JSON.stringify(apiFilters) : undefined,
            limit: 0,
          },
        }),
      ]);

      const erpRecords = (listRes.data.data ?? []).map(
        (inv: { name: string; customer: string; posting_date: string; grand_total: number; docstatus: 0 | 1 | 2; total_qty: number }) => ({
          id: inv.name,
          customer: inv.customer,
          item_code: '',
          item_name: '(see invoice)',
          qty: inv.total_qty ?? 0,
          rate: 0,
          total: inv.grand_total ?? 0,
          date: inv.posting_date,
          docstatus: inv.docstatus,
          source: 'erpnext' as const,
        })
      );

      // Merge: local-only (source=local) + ERP records, de-duped by id
      const erpIds = new Set(erpRecords.map((r: InvoiceRecord) => r.id));
      const localOnly = localRecords.filter((r) => r.source === 'local' || !erpIds.has(r.id));

      const merged = [...erpRecords, ...localOnly].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return {
        data: merged,
        total: (countRes.data.data as { name: string }[]).length + localOnly.length,
      };
    } catch {
      // Offline: return local records only
      return { data: localRecords, total: localRecords.length };
    }
  },

  /** Count invoices created today (for KPI). */
  getSalesToday(): number {
    const today = new Date().toISOString().split('T')[0];
    return loadLocalInvoices().filter((r) => r.date === today).length;
  },

  /** Total revenue today (for KPI). */
  getRevenuToday(): number {
    const today = new Date().toISOString().split('T')[0];
    return loadLocalInvoices()
      .filter((r) => r.date === today)
      .reduce((sum, r) => sum + r.total, 0);
  },

  /** Look up a single invoice by id — local first, then ERPNext. */
  async getInvoiceById(id: string): Promise<InvoiceRecord | null> {
    // 1. Check local cache
    const local = loadLocalInvoices().find((r) => r.id === id);
    if (local) return local;

    // 2. Try ERPNext
    try {
      const res = await axiosInstance.get(`/resource/Sales Invoice/${encodeURIComponent(id)}`);
      const inv = res.data.data;
      const firstItem = inv.items?.[0];
      return {
        id: inv.name,
        customer: inv.customer,
        item_code: firstItem?.item_code ?? '',
        item_name: firstItem?.item_name ?? '(see invoice)',
        qty: firstItem?.qty ?? inv.total_qty ?? 0,
        rate: firstItem?.rate ?? 0,
        total: inv.grand_total ?? 0,
        date: inv.posting_date,
        docstatus: inv.docstatus,
        source: 'erpnext',
      } satisfies InvoiceRecord;
    } catch {
      return null;
    }
  },
};
