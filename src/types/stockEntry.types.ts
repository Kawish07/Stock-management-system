export const STOCK_ENTRY_TYPES = [
  'Material Receipt',
  'Material Issue',
  'Material Transfer',
  'Stock Reconciliation',
] as const;

export type StockEntryType = (typeof STOCK_ENTRY_TYPES)[number];

export const ENTRY_TYPE_LABELS: Record<StockEntryType, string> = {
  'Material Receipt': 'Stock In',
  'Material Issue': 'Stock Out',
  'Material Transfer': 'Stock Transfer',
  'Stock Reconciliation': 'Stock Adjustment',
};

export const ENTRY_TYPE_BADGE_CLASSES: Record<StockEntryType, string> = {
  'Material Receipt': 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-100',
  'Material Issue': 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-100',
  'Material Transfer': 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100',
  'Stock Reconciliation': 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100',
};

export function getStockEntryTypeLabel(type: StockEntryType): string {
  return ENTRY_TYPE_LABELS[type];
}

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
  company?: string;
  items: StockEntryItem[];
  total_amount?: number;
}
