import { validateAmount } from '@/validation/amount';

export interface AmountFormState {
  value: string;
  error?: string;
}

export function handleAmountChange(value: string): AmountFormState {
  return { value, error: validateAmount(value).error };
}

export function handleAmountBlur(value: string): AmountFormState {
  return { value, error: validateAmount(value).error };
}

export interface AmountSubmitResult {
  valid: boolean;
  error?: string;
}

export function submitAmount(value: string): AmountSubmitResult {
  const result = validateAmount(value);
  return { valid: result.valid, error: result.error };
}
