/**
 * Amount validation
 * Pure validator for numeric amount input (no framework/runtime deps)
 */

const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

export type AmountValidationResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export interface ValidateAmountOptions {
  min?: number;
  max?: number;
}

export function validateAmount(
  raw: string,
  options: ValidateAmountOptions = {}
): AmountValidationResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, error: 'Amount is required' };
  }

  if (trimmed.startsWith('-')) {
    return { ok: false, error: 'Amount cannot be negative' };
  }

  if (!AMOUNT_REGEX.test(trimmed)) {
    return {
      ok: false,
      error: 'Amount must be a number with up to 2 decimal places',
    };
  }

  const value = Number(trimmed);

  const { min, max } = options;
  if (min !== undefined && value < min) {
    return { ok: false, error: `Amount must be at least ${min}` };
  }
  if (max !== undefined && value > max) {
    return { ok: false, error: `Amount must be at most ${max}` };
  }

  return { ok: true, value };
}
