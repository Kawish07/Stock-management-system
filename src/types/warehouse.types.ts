export type WarehouseType = 'Transit' | 'Storage' | 'Manufacturing' | 'Fixed Asset';

export interface Warehouse {
  name: string;
  warehouse_name: string;
  warehouse_type: WarehouseType;
  parent_warehouse?: string;
  city?: string;
  country?: string;
  is_group: boolean;
  disabled: boolean;
  account?: string;
}

export type CreateWarehouseDto = Omit<Warehouse, 'name'>;
export type UpdateWarehouseDto = Partial<CreateWarehouseDto>;
