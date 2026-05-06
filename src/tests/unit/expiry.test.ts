import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getExpiryStatus, daysUntilExpiry } from '@/types/expiry.types';

// Fix "today" to 2026-05-06 for deterministic tests
const FIXED_DATE = new Date('2026-05-06T00:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getExpiryStatus', () => {
  it('returns ok for undefined', () => {
    expect(getExpiryStatus(undefined)).toBe('ok');
  });

  it('returns expired for a past date', () => {
    expect(getExpiryStatus('2026-04-01')).toBe('expired');
  });

  it('returns expired for yesterday', () => {
    expect(getExpiryStatus('2026-05-05')).toBe('expired');
  });

  it('returns near for today', () => {
    expect(getExpiryStatus('2026-05-06')).toBe('near');
  });

  it('returns near for within 30 days', () => {
    expect(getExpiryStatus('2026-06-01')).toBe('near');
  });

  it('returns ok for more than 30 days away', () => {
    expect(getExpiryStatus('2026-07-01')).toBe('ok');
  });
});

describe('daysUntilExpiry', () => {
  it('returns null for undefined', () => {
    expect(daysUntilExpiry(undefined)).toBeNull();
  });

  it('returns 0 for today', () => {
    expect(daysUntilExpiry('2026-05-06')).toBe(0);
  });

  it('returns positive days for future date', () => {
    expect(daysUntilExpiry('2026-05-16')).toBe(10);
  });

  it('returns negative days for past date', () => {
    expect(daysUntilExpiry('2026-04-26')).toBe(-10);
  });
});
