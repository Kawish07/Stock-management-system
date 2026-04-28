export interface Category {
  name: string;
  item_group_name: string;
  parent_item_group: string;
  is_group: boolean;
  description?: string;
  item_count?: number;
  children?: Category[];
}

export type CreateCategoryDto = {
  item_group_name: string;
  parent_item_group?: string;
  is_group?: boolean;
  description?: string;
};

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

/** @deprecated Use Category */
export type ItemGroup = Category;
