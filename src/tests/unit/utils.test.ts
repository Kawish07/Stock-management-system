import { describe, it, expect } from 'vitest';
import { formatDate, formatNumber, formatCurrency, cn } from '@/lib/utils';

describe('formatDate', () => {
  it('returns - for empty string', () => {
    expect(formatDate('')).toBe('-');
  });

  it('formats a valid ISO date', () => {
    expect(formatDate('2026-05-06')).toBe('May 6, 2026');
  });

  it('returns - for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('-');
  });

  it('accepts a custom pattern', () => {
    expect(formatDate('2026-01-15', 'dd/MM/yyyy')).toBe('15/01/2026');
  });
});

describe('formatNumber', () => {
  it('formats with 2 decimal places by default', () => {
    expect(formatNumber(1234.5)).toBe('1,234.50');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0.00');
  });

  it('formats with custom decimals', () => {
    expect(formatNumber(99.9999, 0)).toBe('100');
  });
});

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('deduplicates tailwind conflicts', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });
});
