export interface SalesInvoiceItem {
  item_code: string;
  item_name: string;
  description?: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  discount_percentage?: number;
  warehouse?: string;
  // UI-only (not sent to ERPNext)
  _id?: string;
}

export interface InvoiceTax {
  charge_type: 'On Net Total';
  account_head: string;
  description: string;
  rate: number;
  tax_amount?: number;
}

export interface SalesInvoice {
  name?: string;
  customer: string;
  customer_name?: string;
  posting_date: string;
  due_date: string;
  items: SalesInvoiceItem[];
  taxes?: InvoiceTax[];

  net_total?: number;
  total_taxes_and_charges?: number;
  grand_total?: number;
  outstanding_amount?: number;

  payment_terms_template?: string;
  mode_of_payment?: string;
  paid_amount?: number;
  remarks?: string;
  docstatus?: 0 | 1 | 2;

  discount_amount?: number;
  additional_discount_percentage?: number;

  // UI-only
  taxes_template?: string;
}

// Lightweight shape for the list view
export interface InvoiceListRow {
  name: string;
  customer: string;
  customer_name?: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  outstanding_amount: number;
  docstatus: 0 | 1 | 2;
}

// Legacy single-item shape (kept for backwards compat with local storage)
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

// Shape used in create form
export interface CreateInvoiceDto {
  customer: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  warehouse?: string;
  remarks?: string;
}
