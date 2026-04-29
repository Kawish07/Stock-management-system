import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type {
  SalesInvoice,
  InvoiceListRow,
  InvoiceRecord,
  CreateInvoiceDto,
} from '@/types/invoice.types';

// ── Local storage fallback (legacy single-item invoices) ─────────────────────
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

// ── List fields for the invoices table ───────────────────────────────────────
const LIST_FIELDS = [
  'name',
  'customer',
  'customer_name',
  'posting_date',
  'due_date',
  'grand_total',
  'outstanding_amount',
  'docstatus',
];

export interface InvoiceFilters {
  customer?: string;
  status?: 'Draft' | 'Unpaid' | 'Paid' | 'Cancelled';
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const invoiceService = {
  /** List invoices with optional filters (ERPNext Sales Invoice). */
  async getAllInvoices(
    filters?: InvoiceFilters
  ): Promise<{ data: InvoiceListRow[]; total: number }> {
    const pageSize = filters?.pageSize ?? 50;
    const page = filters?.page ?? 1;
    const limitStart = (page - 1) * pageSize;

    const apiFilters: (string | string[])[][] = [];

    if (filters?.customer) {
      apiFilters.push(['Sales Invoice', 'customer', 'like', `%${filters.customer}%`]);
    }
    if (filters?.search) {
      apiFilters.push(['Sales Invoice', 'name', 'like', `%${filters.search}%`]);
    }
    if (filters?.from_date) {
      apiFilters.push(['Sales Invoice', 'posting_date', '>=', filters.from_date]);
    }
    if (filters?.to_date) {
      apiFilters.push(['Sales Invoice', 'posting_date', '<=', filters.to_date]);
    }
    if (filters?.status === 'Draft') {
      apiFilters.push(['Sales Invoice', 'docstatus', '=', '0']);
    } else if (filters?.status === 'Unpaid') {
      apiFilters.push(['Sales Invoice', 'docstatus', '=', '1']);
      apiFilters.push(['Sales Invoice', 'outstanding_amount', '>', '0']);
    } else if (filters?.status === 'Paid') {
      apiFilters.push(['Sales Invoice', 'docstatus', '=', '1']);
      apiFilters.push(['Sales Invoice', 'outstanding_amount', '=', '0']);
    } else if (filters?.status === 'Cancelled') {
      apiFilters.push(['Sales Invoice', 'docstatus', '=', '2']);
    }

    try {
      const [listRes, countRes] = await Promise.all([
        axiosInstance.get('/resource/Sales Invoice', {
          params: {
            fields: JSON.stringify(LIST_FIELDS),
            filters: apiFilters.length ? JSON.stringify(apiFilters) : undefined,
            limit: pageSize,
            limit_start: limitStart,
            order_by: 'posting_date desc, name desc',
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

      return {
        data: (listRes.data.data ?? []) as InvoiceListRow[],
        total: (countRes.data.data ?? []).length,
      };
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /** Get a single Sales Invoice with all fields. */
  async getInvoice(name: string): Promise<SalesInvoice> {
    try {
      const res = await axiosInstance.get(
        `/resource/Sales Invoice/${encodeURIComponent(name)}`
      );
      return res.data.data as SalesInvoice;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /** Create a Sales Invoice (saves as draft, docstatus=0). */
  async createInvoice(data: SalesInvoice): Promise<SalesInvoice> {
    try {
      const res = await axiosInstance.post('/resource/Sales Invoice', data);
      return res.data.data as SalesInvoice;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /** Update a draft Sales Invoice. */
  async updateInvoice(name: string, data: Partial<SalesInvoice>): Promise<SalesInvoice> {
    try {
      const res = await axiosInstance.put(
        `/resource/Sales Invoice/${encodeURIComponent(name)}`,
        data
      );
      return res.data.data as SalesInvoice;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /** Submit a draft invoice (docstatus 0 → 1). Stock is deducted on submit. */
  async submitInvoice(name: string): Promise<void> {
    try {
      await axiosInstance.post('/method/frappe.client.submit', {
        doc: { doctype: 'Sales Invoice', name },
      });
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /** Cancel a submitted invoice (docstatus 1 → 2). */
  async cancelInvoice(name: string): Promise<void> {
    try {
      await axiosInstance.post('/method/frappe.client.cancel', {
        doc: { doctype: 'Sales Invoice', name },
      });
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /** Get item price from Item Price list for a given price list. */
  async getItemPrice(
    itemCode: string,
    priceList = 'Standard Selling'
  ): Promise<number> {
    try {
      const res = await axiosInstance.get('/resource/Item Price', {
        params: {
          fields: JSON.stringify(['price_list_rate']),
          filters: JSON.stringify([
            ['Item Price', 'item_code', '=', itemCode],
            ['Item Price', 'price_list', '=', priceList],
            ['Item Price', 'selling', '=', '1'],
          ]),
          limit: 1,
        },
      });
      return (res.data.data?.[0]?.price_list_rate as number) ?? 0;
    } catch {
      return 0;
    }
  },

  /** Search customers for the combobox. */
  async searchCustomers(search?: string): Promise<{ name: string; customer_name: string }[]> {
    try {
      const filters: (string | string[])[][] = [];
      if (search) {
        filters.push(['Customer', 'customer_name', 'like', `%${search}%`]);
      }
      const res = await axiosInstance.get('/resource/Customer', {
        params: {
          fields: JSON.stringify(['name', 'customer_name']),
          filters: filters.length ? JSON.stringify(filters) : undefined,
          limit: 30,
          order_by: 'customer_name asc',
        },
      });
      return (res.data.data ?? []) as { name: string; customer_name: string }[];
    } catch {
      return [];
    }
  },

  // ── Dashboard helpers (ERPNext) ───────────────────────────────────────────

  async getInvoicesToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await axiosInstance.get('/resource/Sales Invoice', {
        params: {
          fields: JSON.stringify(['name']),
          filters: JSON.stringify([['Sales Invoice', 'posting_date', '=', today]]),
          limit: 0,
        },
      });
      return (res.data.data ?? []).length;
    } catch {
      return 0;
    }
  },

  async getRevenueToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await axiosInstance.get('/resource/Sales Invoice', {
        params: {
          fields: JSON.stringify(['grand_total']),
          filters: JSON.stringify([
            ['Sales Invoice', 'posting_date', '=', today],
            ['Sales Invoice', 'docstatus', '=', '1'],
          ]),
          limit: 0,
        },
      });
      const rows = (res.data.data ?? []) as { grand_total: number }[];
      return rows.reduce((s, r) => s + (r.grand_total ?? 0), 0);
    } catch {
      return 0;
    }
  },

  async getUnpaidInvoices(): Promise<{ count: number; amount: number }> {
    try {
      const res = await axiosInstance.get('/resource/Sales Invoice', {
        params: {
          fields: JSON.stringify(['outstanding_amount']),
          filters: JSON.stringify([
            ['Sales Invoice', 'docstatus', '=', '1'],
            ['Sales Invoice', 'outstanding_amount', '>', '0'],
          ]),
          limit: 0,
        },
      });
      const rows = (res.data.data ?? []) as { outstanding_amount: number }[];
      return {
        count: rows.length,
        amount: rows.reduce((s, r) => s + (r.outstanding_amount ?? 0), 0),
      };
    } catch {
      return { count: 0, amount: 0 };
    }
  },

  // ── Legacy helpers kept for backward compat ───────────────────────────────

  getSalesToday(): number {
    const today = new Date().toISOString().split('T')[0];
    return loadLocalInvoices().filter((r) => r.date === today).length;
  },

  getRevenuToday(): number {
    const today = new Date().toISOString().split('T')[0];
    return loadLocalInvoices()
      .filter((r) => r.date === today)
      .reduce((s, r) => s + r.total, 0);
  },

  /** Legacy: create single-item invoice (used by old InvoiceForm). */
  async createInvoiceLegacy(dto: CreateInvoiceDto): Promise<InvoiceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const record: InvoiceRecord = {
      id: `LOC-${Date.now()}`,
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
  },

  /** Legacy list (local storage). */
  async getInvoices(
    filters?: InvoiceFilters
  ): Promise<{ data: InvoiceRecord[]; total: number }> {
    const records = loadLocalInvoices();
    return { data: records, total: records.length };
  },
};

