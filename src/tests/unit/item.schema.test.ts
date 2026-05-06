import { describe, it, expect } from 'vitest';
import { itemSchema } from '@/lib/validators/item.schema';

const validItem = {
  item_code: 'ITEM-001',
  item_name: 'Test Item',
  item_group: 'Products',
  stock_uom: 'Nos',
};

describe('itemSchema', () => {
  it('passes with valid data', () => {
    const result = itemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('fails when item_code is empty', () => {
    const result = itemSchema.safeParse({ ...validItem, item_code: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Item code is required');
  });

  it('fails when item_name is empty', () => {
    const result = itemSchema.safeParse({ ...validItem, item_name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Item name is required');
  });

  it('fails when item_code exceeds 140 chars', () => {
    const result = itemSchema.safeParse({ ...validItem, item_code: 'A'.repeat(141) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Item code too long');
  });

  it('defaults opening_stock to 0', () => {
    const result = itemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opening_stock).toBe(0);
  });

  it('defaults is_stock_item to true', () => {
    const result = itemSchema.safeParse(validItem);
    if (result.success) expect(result.data.is_stock_item).toBe(true);
  });

  it('coerces ERPNext integer 1 to true for is_stock_item', () => {
    const result = itemSchema.safeParse({ ...validItem, is_stock_item: 1 });
    if (result.success) expect(result.data.is_stock_item).toBe(true);
  });

  it('coerces ERPNext integer 0 to false for disabled', () => {
    const result = itemSchema.safeParse({ ...validItem, disabled: 0 });
    if (result.success) expect(result.data.disabled).toBe(false);
  });

  it('rejects negative opening_stock', () => {
    const result = itemSchema.safeParse({ ...validItem, opening_stock: -1 });
    expect(result.success).toBe(false);
  });
});
