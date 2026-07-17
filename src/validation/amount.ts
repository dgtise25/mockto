export interface AmountValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_DECIMAL_PLACES = 2;

export function validateAmount(value: string | number): AmountValidationResult {
  const raw = typeof value === 'number' ? String(value) : value;

  if (raw === null || raw === undefined || raw.trim() === '') {
    return { valid: false, error: 'Amount is required.' };
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return { valid: false, error: 'Amount must be a valid number.' };
  }

  if (parsed < 0) {
    return { valid: false, error: 'Amount cannot be negative.' };
  }

  const decimalMatch = raw.trim().match(/\.(\d+)$/);
  if (decimalMatch && decimalMatch[1].length > MAX_DECIMAL_PLACES) {
    return { valid: false, error: `Amount cannot have more than ${MAX_DECIMAL_PLACES} decimal places.` };
  }

  return { valid: true };
}
