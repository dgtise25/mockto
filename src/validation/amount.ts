export interface AmountValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a raw amount string: must be a non-negative number
 * with at most 2 decimal places.
 */
export function validateAmount(value: string): AmountValidationResult {
  const trimmed = value.trim();

  if (trimmed === '') {
    return { valid: false, error: 'Amount is required' };
  }

  const parsed = Number(trimmed);

  if (Number.isNaN(parsed)) {
    return { valid: false, error: 'Amount must be a number' };
  }

  if (parsed < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  const decimalMatch = trimmed.match(/\.(\d+)$/);
  if (decimalMatch && decimalMatch[1].length > 2) {
    return { valid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  return { valid: true };
}
