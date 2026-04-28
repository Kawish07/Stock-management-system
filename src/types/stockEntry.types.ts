export type StockEntryType =
  | 'Material Receipt'
  | 'Material Issue'
  | 'Material Transfer'
  | 'Stock Reconciliation';

export type StockEntryStatus = 'Draft' | 'Submitted' | 'Cancelled';

export interface StockEntryItem {
  item_code: string;
  item_name: string;
  description?: string;
  s_warehouse?: string;
  t_warehouse?: string;
  qty: number;
  uom: string;
  stock_uom: string;
  basic_rate: number;
  basic_amount: number;
  allow_zero_valuation_rate?: boolean;
}

export interface StockEntry {
  name?: string;
  stock_entry_type: StockEntryType;
  posting_date: string;
  posting_time: string;
  docstatus: 0 | 1 | 2;
  remarks?: string;
  items: StockEntryItem[];
  total_amount?: number;
}
