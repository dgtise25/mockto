import {
  validateAmount,
  AmountValidationOptions,
  AmountValidationResult,
} from '@/validation/amount';

export interface AmountFormState {
  amount: string;
}

export interface AmountFormSubmitResult {
  valid: boolean;
  error?: string;
  amount?: number;
}

export function validateAmountField(
  amount: string,
  options?: AmountValidationOptions
): AmountValidationResult {
  return validateAmount(amount, options);
}

export function submitAmountForm(
  state: AmountFormState,
  options?: AmountValidationOptions
): AmountFormSubmitResult {
  const result = validateAmount(state.amount, options);
  if (!result.valid) {
    return { valid: false, error: result.error };
  }
  return { valid: true, amount: Number(state.amount) };
}
