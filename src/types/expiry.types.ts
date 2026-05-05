export interface Batch {
  name: string;
  batch_id: string;
  item: string;
  item_name?: string;
  expiry_date?: string;
  manufacturing_date?: string;
  batch_qty?: number;
  description?: string;
  creation?: string;
}

export interface ExpiryItem {
  name: string;
  item_code: string;
  item_name: string;
  item_group?: string;
  custom_expiry_date?: string;
}

export interface BatchWithQty extends Batch {
  actual_qty: number;
  warehouse?: string;
}

export type CreateBatchDto = {
  batch_id: string;
  item: string;
  expiry_date?: string;
  manufacturing_date?: string;
  description?: string;
};

export type UpdateBatchDto = Partial<Omit<CreateBatchDto, 'batch_id' | 'item'>>;

export type ExpiryStatus = 'expired' | 'near' | 'ok';

export function getExpiryStatus(expiryDate: string | undefined): ExpiryStatus {
  if (!expiryDate) return 'ok';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'near';
  return 'ok';
}

export function daysUntilExpiry(expiryDate: string | undefined): number | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
