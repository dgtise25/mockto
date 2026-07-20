/**
 * AmountInput Component
 * Text input for monetary amounts with inline validation
 */

import React, { useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { validateAmount } from '@/validation/amount';

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  min?: number;
  max?: number;
  id?: string;
  className?: string;
  onValidChange?: (value: number | null) => void;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  label,
  helperText,
  min,
  max,
  id = 'amount-input',
  className,
  onValidChange,
}) => {
  const [error, setError] = useState<string | undefined>(undefined);

  const runValidation = useCallback(
    (raw: string) => {
      const result = validateAmount(raw, { min, max });
      if (result.ok) {
        setError(undefined);
        onValidChange?.(result.value);
      } else {
        setError(result.error);
        onValidChange?.(null);
      }
    },
    [min, max, onValidChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      onChange(next);
      if (error) {
        runValidation(next);
      }
    },
    [onChange, error, runValidation]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      runValidation(e.target.value);
    },
    [runValidation]
  );

  const descriptionId = `${id}-description`;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label}
        </Label>
      )}

      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(error && 'border-destructive focus-visible:ring-destructive')}
        aria-invalid={!!error}
        aria-describedby={helperText || error ? descriptionId : undefined}
      />

      {(helperText || error) && (
        <div
          id={descriptionId}
          className={cn('mt-1 text-sm', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default AmountInput;
