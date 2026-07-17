import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AmountInput } from '@/forms/amount-input';

describe('amount input validation (issue #1)', () => {
  it('accepts a valid amount and submits it', () => {
    const onSubmit = vi.fn();
    render(<AmountInput onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '12.50' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith('12.50');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('rejects empty input', () => {
    const onSubmit = vi.fn();
    render(<AmountInput onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText('Amount'));

    expect(screen.getByRole('alert')).toHaveTextContent('Amount is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects negative input', () => {
    const onSubmit = vi.fn();
    render(<AmountInput onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '-5' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(screen.getByRole('alert')).toHaveTextContent('Amount cannot be negative');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects non-numeric input', () => {
    const onSubmit = vi.fn();
    render(<AmountInput onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be a number');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects amounts with more than 2 decimal places', () => {
    const onSubmit = vi.fn();
    render(<AmountInput onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '1.234' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Amount cannot have more than 2 decimal places'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
