import { describe, it, expect } from 'vitest'
import { validateAmount } from '@/lib/validation'

describe('validateAmount', () => {
  it('rejects empty input', () => {
    expect(validateAmount('')).toEqual({ ok: false, error: 'Amount is required' })
  })

  it('rejects whitespace-only input', () => {
    expect(validateAmount('   ')).toEqual({ ok: false, error: 'Amount is required' })
  })

  it('rejects non-numeric input', () => {
    expect(validateAmount('12abc')).toEqual({ ok: false, error: 'Enter a valid number' })
  })

  it('rejects negative amounts', () => {
    expect(validateAmount('-5')).toEqual({ ok: false, error: 'Amount must be greater than zero' })
  })

  it('rejects zero', () => {
    expect(validateAmount('0')).toEqual({ ok: false, error: 'Amount must be greater than zero' })
  })

  it('rejects more than 2 decimal places', () => {
    expect(validateAmount('1.234')).toEqual({ ok: false, error: 'Maximum 2 decimal places' })
  })

  it('rejects Infinity', () => {
    expect(validateAmount('Infinity')).toEqual({ ok: false, error: 'Enter a valid number' })
  })

  it('accepts a whole number', () => {
    expect(validateAmount('10')).toEqual({ ok: true, value: 10 })
  })

  it('accepts a value with 2 decimal places', () => {
    expect(validateAmount('10.50')).toEqual({ ok: true, value: 10.5 })
  })
})
