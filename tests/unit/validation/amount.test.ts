import { describe, it, expect } from 'vitest';
import { validateAmount } from '@/validation/amount';

describe('validateAmount', () => {
  it('accepts a valid amount', () => {
    expect(validateAmount('10.50')).toEqual({ ok: true, value: 10.5 });
  });

  it('rejects empty input', () => {
    expect(validateAmount('')).toEqual({ ok: false, error: 'Amount is required' });
  });

  it('rejects non-numeric input', () => {
    const result = validateAmount('12abc');
    expect(result.ok).toBe(false);
  });

  it('rejects negative amounts', () => {
    const result = validateAmount('-5');
    expect(result.ok).toBe(false);
  });

  it('rejects more than 2 decimal places', () => {
    const result = validateAmount('1.005');
    expect(result.ok).toBe(false);
  });

  it('enforces min/max bounds', () => {
    expect(validateAmount('5', { min: 10 })).toEqual({
      ok: false,
      error: 'Amount must be at least 10',
    });
    expect(validateAmount('100', { max: 50 })).toEqual({
      ok: false,
      error: 'Amount must be at most 50',
    });
    expect(validateAmount('25', { min: 10, max: 50 })).toEqual({ ok: true, value: 25 });
  });
});
