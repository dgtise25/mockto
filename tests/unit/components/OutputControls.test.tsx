/**
 * OutputControls Component Tests
 * Tests for download/save buttons
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OutputControls } from '@/components/output/OutputControls';

describe('OutputControls Component', () => {
  const mockOnDownload = vi.fn();
  const mockOnCopy = vi.fn();
  const mockOnClear = vi.fn();

  const defaultProps = {
    code: `export default function Component() {
  return <div>Hello</div>;
}`,
    filename: 'Component',
    onDownload: mockOnDownload,
    onCopy: mockOnCopy,
    onClear: mockOnClear,
    hasOutput: true,
  };

  beforeEach(() => {
    mockOnDownload.mockClear();
    mockOnCopy.mockClear();
    mockOnClear.mockClear();
    (global.confirm as any) = vi.fn(() => true);
    (navigator.clipboard as any).writeText = vi.fn().mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render the controls container', () => {
      render(<OutputControls {...defaultProps} />);
      expect(screen.getByTestId('output-controls')).toBeInTheDocument();
    });

    it('should display filename when has output', () => {
      render(<OutputControls {...defaultProps} />);
      expect(screen.getByText('Component')).toBeInTheDocument();
    });

    it('should show file size', () => {
      render(<OutputControls {...defaultProps} />);
      expect(screen.getByTestId('file-size')).toBeInTheDocument();
    });
  });

  describe('Copy Button', () => {
    it('should render copy button', () => {
      render(<OutputControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should call onCopy when clicked', async () => {
      const user = userEvent.setup();
      render(<OutputControls {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalled();
    });

    it('should be disabled when no output', () => {
      render(<OutputControls {...defaultProps} hasOutput={false} code="" />);
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeDisabled();
    });
  });

  describe('Download Button', () => {
    it('should render download dropdown', () => {
      render(<OutputControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    it('should be disabled when no output', () => {
      render(<OutputControls {...defaultProps} hasOutput={false} code="" />);
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeDisabled();
    });
  });

  describe('Clear Button', () => {
    it('should render clear button', () => {
      render(<OutputControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should call onClear when clicked', async () => {
      const user = userEvent.setup();
      (global.confirm as any) = vi.fn(() => true);

      render(<OutputControls {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(mockOnClear).toHaveBeenCalled();
    });

    it('should not call onClear if user cancels', async () => {
      const user = userEvent.setup();
      (global.confirm as any) = vi.fn(() => false);

      render(<OutputControls {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(mockOnClear).not.toHaveBeenCalled();
    });
  });
});
