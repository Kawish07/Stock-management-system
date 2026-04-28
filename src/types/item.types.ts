export interface Item {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  opening_stock: number;
  valuation_rate: number;
  reorder_level: number;
  description: string;
  is_stock_item: boolean;
  disabled: boolean;
  actual_qty?: number;
  image?: string;
}

export type CreateItemDto = Omit<Item, 'name' | 'actual_qty'>;
export type UpdateItemDto = Partial<CreateItemDto>;