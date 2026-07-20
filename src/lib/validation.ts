export type AmountValidationResult =
  | { ok: true; value: number }
  | { ok: false; error: string }

export function validateAmount(input: string): AmountValidationResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return { ok: false, error: 'Amount is required' }
  }

  const value = Number(trimmed)

  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return { ok: false, error: 'Enter a valid number' }
  }

  if (value <= 0) {
    return { ok: false, error: 'Amount must be greater than zero' }
  }

  const decimalMatch = trimmed.match(/\.(\d+)$/)
  if (decimalMatch && decimalMatch[1].length > 2) {
    return { ok: false, error: 'Maximum 2 decimal places' }
  }

  return { ok: true, value }
}
