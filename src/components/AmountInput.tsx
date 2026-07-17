import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { validateAmount } from '@/validation/amount';

export interface AmountInputProps
  extends Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'onBlur'> {
  value: string;
  onChange: (value: string, error?: string) => void;
  onValidityChange?: (valid: boolean) => void;
}

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, onValidityChange, className, ...props }, ref) => {
    const [error, setError] = React.useState<string | undefined>();

    const validate = (next: string) => {
      const result = validateAmount(next);
      setError(result.error);
      onValidityChange?.(result.valid);
      return result;
    };

    return (
      <div className="flex flex-col gap-1">
        <Input
          ref={ref}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={value}
          aria-invalid={!!error}
          className={cn(error && 'border-destructive', className)}
          onChange={(e) => {
            const next = e.target.value;
            const result = validate(next);
            onChange(next, result.error);
          }}
          onBlur={(e) => validate(e.target.value)}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
AmountInput.displayName = 'AmountInput';

export { AmountInput };
