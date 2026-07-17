import { describe, expect, it } from 'vitest';
import { validateAmount } from '@/validation/amount';

describe('validateAmount', () => {
  it('rejects empty values', () => {
    expect(validateAmount('').valid).toBe(false);
    expect(validateAmount('   ').valid).toBe(false);
  });

  it('rejects non-numeric values', () => {
    expect(validateAmount('abc').valid).toBe(false);
  });

  it('rejects negative values', () => {
    expect(validateAmount('-5').valid).toBe(false);
    expect(validateAmount(-5).valid).toBe(false);
  });

  it('rejects more than 2 decimal places', () => {
    expect(validateAmount('10.999').valid).toBe(false);
  });

  it('accepts a valid amount', () => {
    const result = validateAmount('10.50');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts a valid integer number input', () => {
    expect(validateAmount(100).valid).toBe(true);
  });
});
