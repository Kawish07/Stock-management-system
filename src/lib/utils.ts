import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, pattern = 'MMM d, yyyy'): string {
  if (!dateStr) return '-';
  try {
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? format(parsed, pattern) : '-';
  } catch {
    return '-';
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Slugify a display name into an ERPNext-style item code.
 * e.g. "Blue Widget 500g" → "BLUE-WIDGET-500G"
 */
export function generateItemCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getDocStatusLabel(docstatus: number): string {
  switch (docstatus) {
    case 0:
      return 'Draft';
    case 1:
      return 'Submitted';
    case 2:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export function getDocStatusVariant(
  docstatus: number
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (docstatus) {
    case 0:
      return 'secondary';
    case 1:
      return 'default';
    case 2:
      return 'destructive';
    default:
      return 'outline';
  }
}
