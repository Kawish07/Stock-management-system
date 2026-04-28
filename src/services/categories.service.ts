import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category.types';

// 'description' is a Text field — blocked by ERPNext's get_list validation.
// It is available on the single-document GET used in getCategory().
const FIELDS = ['name', 'item_group_name', 'parent_item_group', 'is_group'];

function normalize(raw: Record<string, unknown>): Category {
  return {
    name: String(raw.name ?? ''),
    item_group_name: String(raw.item_group_name ?? ''),
    parent_item_group: String(raw.parent_item_group ?? ''),
    is_group: Boolean(raw.is_group),
    description: raw.description ? String(raw.description) : undefined,
  };
}

export const categoriesService = {
  async getAllCategories(): Promise<Category[]> {
    try {
      const res = await axiosInstance.get('/resource/Item Group', {
        params: {
          fields: JSON.stringify(FIELDS),
          limit: 100,
          order_by: 'name asc',
        },
      });
      return (res.data.data as Record<string, unknown>[]).map(normalize);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async getCategory(name: string): Promise<Category> {
    try {
      const res = await axiosInstance.get(`/resource/Item Group/${encodeURIComponent(name)}`);
      return normalize(res.data.data as Record<string, unknown>);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      const res = await axiosInstance.post('/resource/Item Group', data);
      return normalize(res.data.data as Record<string, unknown>);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async updateCategory(name: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      // ERPNext autonames Item Group docs from item_group_name, so a plain PUT
      // cannot rename them. Use frappe.client.rename_doc when the name changes.
      const newName = data.item_group_name;
      let targetName = name;

      if (newName && newName !== name) {
        await axiosInstance.post('/method/frappe.client.rename_doc', {
          doctype: 'Item Group',
          old_name: name,
          new_name: newName,
          merge: false,
        });
        targetName = newName;
      }

      // Build update payload (exclude item_group_name if it was the only change)
      const { item_group_name: _renamed, ...rest } = data;
      const hasOtherChanges = Object.keys(rest).length > 0;

      if (hasOtherChanges) {
        const res = await axiosInstance.put(
          `/resource/Item Group/${encodeURIComponent(targetName)}`,
          rest
        );
        return normalize(res.data.data as Record<string, unknown>);
      }

      // Fetch the (possibly renamed) doc to return a consistent Category object
      const res = await axiosInstance.get(
        `/resource/Item Group/${encodeURIComponent(targetName)}`
      );
      return normalize(res.data.data as Record<string, unknown>);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  async deleteCategory(name: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/Item Group/${encodeURIComponent(name)}`);
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  buildCategoryTree(flatList: Category[]): Category[] {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    flatList.forEach((cat) => {
      map.set(cat.name, { ...cat, children: [] });
    });

    map.forEach((cat) => {
      const parentName = cat.parent_item_group;
      if (!parentName || !map.has(parentName)) {
        roots.push(cat);
      } else {
        const parent = map.get(parentName)!;
        (parent.children = parent.children ?? []).push(cat);
      }
    });

    return roots;
  },
};
