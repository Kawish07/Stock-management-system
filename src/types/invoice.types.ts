export interface InvoiceItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom?: string;
  warehouse?: string;
}

export interface SalesInvoice {
  name?: string;
  customer: string;
  posting_date: string;
  due_date?: string;
  docstatus?: 0 | 1 | 2;
  items: InvoiceItem[];
  total_qty?: number;
  total?: number;
  grand_total?: number;
  remarks?: string;
  // Local-only fields (not sent to ERPNext)
  _local?: boolean;
}

// Shape used in the create form
export interface CreateInvoiceDto {
  customer: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  warehouse?: string;
  remarks?: string;
}

// Shape stored / displayed in the invoices list
export interface InvoiceRecord {
  id: string;
  customer: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  total: number;
  warehouse?: string;
  remarks?: string;
  date: string;
  docstatus: 0 | 1 | 2;
  source: 'erpnext' | 'local';
}
