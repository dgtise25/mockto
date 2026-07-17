export interface AmountValidationOptions {
  min?: number;
  max?: number;
}

export interface AmountValidationResult {
  valid: boolean;
  error?: string;
}

const DEFAULT_MIN = 0;
const DEFAULT_MAX = Number.MAX_SAFE_INTEGER;
const DECIMAL_PLACES_RE = /^-?\d+(\.\d{1,2})?$/;

export function validateAmount(
  value: string | number | null | undefined,
  options: AmountValidationOptions = {}
): AmountValidationResult {
  const min = options.min ?? DEFAULT_MIN;
  const max = options.max ?? DEFAULT_MAX;

  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Amount is required' };
  }

  const stringValue = String(value).trim();
  if (stringValue === '') {
    return { valid: false, error: 'Amount is required' };
  }

  if (!DECIMAL_PLACES_RE.test(stringValue)) {
    const numeric = Number(stringValue);
    if (Number.isNaN(numeric)) {
      return { valid: false, error: 'Amount must be a valid number' };
    }
    return { valid: false, error: 'Amount must have at most 2 decimal places' };
  }

  const numeric = Number(stringValue);
  if (Number.isNaN(numeric)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (numeric < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  if (numeric < min) {
    return { valid: false, error: `Amount must be at least ${min}` };
  }

  if (numeric > max) {
    return { valid: false, error: `Amount must be at most ${max}` };
  }

  return { valid: true };
}
