import { describe, it, expect } from 'vitest';
import { validateAmount } from '@/validation/amount';

describe('validateAmount', () => {
  it('rejects empty input', () => {
    expect(validateAmount('').valid).toBe(false);
    expect(validateAmount(undefined).valid).toBe(false);
    expect(validateAmount(null).valid).toBe(false);
  });

  it('rejects non-numeric input', () => {
    const result = validateAmount('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/valid number/i);
  });

  it('rejects negative amounts', () => {
    const result = validateAmount('-5');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/negative/i);
  });

  it('rejects amounts with more than 2 decimal places', () => {
    const result = validateAmount('10.999');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/decimal/i);
  });

  it('accepts valid amounts', () => {
    expect(validateAmount('10').valid).toBe(true);
    expect(validateAmount('10.5').valid).toBe(true);
    expect(validateAmount('10.55').valid).toBe(true);
    expect(validateAmount(0).valid).toBe(true);
  });

  it('enforces min/max bounds', () => {
    expect(validateAmount('5', { min: 10 }).valid).toBe(false);
    expect(validateAmount('50', { max: 20 }).valid).toBe(false);
    expect(validateAmount('15', { min: 10, max: 20 }).valid).toBe(true);
  });
});
