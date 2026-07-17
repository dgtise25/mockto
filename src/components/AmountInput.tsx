import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { validateAmount, AmountValidationOptions } from '@/validation/amount';

export interface AmountInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'min' | 'max'> {
  value: string;
  onChange: (value: string, error?: string) => void;
  min?: number;
  max?: number;
  label?: string;
}

const ALLOWED_KEYS = [
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Tab',
  'Home',
  'End',
];

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, min, max, label, className, id, ...props }, ref) => {
    const [error, setError] = React.useState<string | undefined>();
    const options: AmountValidationOptions = { min, max };

    const runValidation = (next: string) => {
      const result = validateAmount(next, options);
      setError(result.valid ? undefined : result.error);
      return result;
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      const result = runValidation(next);
      onChange(next, result.error);
    };

    const handleBlur = () => {
      runValidation(value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (ALLOWED_KEYS.includes(event.key) || event.metaKey || event.ctrlKey) {
        return;
      }
      if (!/^[0-9.]$/.test(event.key)) {
        event.preventDefault();
      }
    };

    return (
      <div className="flex flex-col gap-1">
        {label && <Label htmlFor={id}>{label}</Label>}
        <Input
          id={id}
          ref={ref}
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-invalid={!!error}
          className={cn(error && 'border-destructive', className)}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
AmountInput.displayName = 'AmountInput';
