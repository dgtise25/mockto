import React, { useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { validateAmount } from '@/validation/amount';

export interface AmountInputProps {
  onSubmit: (amount: string) => void;
  label?: string;
  id?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  onSubmit,
  label = 'Amount',
  id = 'amount',
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const runValidation = useCallback((next: string) => {
    const result = validateAmount(next);
    setError(result.valid ? undefined : result.error);
    return result.valid;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    runValidation(next);
  };

  const handleBlur = () => {
    runValidation(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (runValidation(value)) {
      onSubmit(value);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <div id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </div>
      )}
      <button type="submit" disabled={!!error || value.trim() === ''}>
        Submit
      </button>
    </form>
  );
};

export default AmountInput;
