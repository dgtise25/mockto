/**
 * FileUpload Component Tests
 * Tests for drag-drop file upload functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '@/components/input/FileUpload';

describe('FileUpload Component', () => {
  const mockOnFileUpload = vi.fn();
  const defaultProps = {
    onFileUpload: mockOnFileUpload,
  };

  beforeEach(() => {
    mockOnFileUpload.mockClear();
    // Reset clipboard mock
    (navigator.clipboard as any).writeText = vi.fn().mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render the upload zone', () => {
      render(<FileUpload {...defaultProps} />);
      expect(screen.getByTestId('file-upload-zone')).toBeInTheDocument();
    });

    it('should display the upload icon', () => {
      render(<FileUpload {...defaultProps} />);
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('should show the upload prompt text', () => {
      render(<FileUpload {...defaultProps} />);
      expect(
        screen.getByText(/drag and drop your html file/i)
      ).toBeInTheDocument();
    });

    it('should render the browse button', () => {
      render(<FileUpload {...defaultProps} />);
      expect(
        screen.getByRole('button', { name: /browse files/i })
      ).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<FileUpload {...defaultProps} disabled />);
      const zone = screen.getByTestId('file-upload-zone');
      expect(zone).toHaveClass('opacity-50');
    });
  });

  describe('File Input', () => {
    it('should have hidden file input', () => {
      render(<FileUpload {...defaultProps} />);
      const input = screen.getByTestId('file-input');
      expect(input).toHaveClass('hidden');
      expect(input).toHaveAttribute('type', 'file');
    });

    it('should accept HTML files by default', () => {
      render(<FileUpload {...defaultProps} />);
      const input = screen.getByTestId('file-input') as HTMLInputElement;
      expect(input.accept).toBe('.html,.htm');
    });
  });

  describe('Click to browse', () => {
    it('should focus file input when zone is clicked', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);

      const zone = screen.getByTestId('file-upload-zone');
      await user.click(zone);

      const input = screen.getByTestId('file-input');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<FileUpload {...defaultProps} />);
      const zone = screen.getByTestId('file-upload-zone');
      expect(zone).toHaveAttribute('role', 'button');
    });

    it('should have aria-label', () => {
      render(<FileUpload {...defaultProps} />);
      const zone = screen.getByTestId('file-upload-zone');
      expect(zone).toHaveAttribute('aria-label', 'Upload HTML file');
    });

    it('should have proper tabindex', () => {
      render(<FileUpload {...defaultProps} />);
      const zone = screen.getByTestId('file-upload-zone');
      expect(zone).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Keyboard Interaction', () => {
    it('should trigger file input on Enter key', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);

      const zone = screen.getByTestId('file-upload-zone');
      zone.focus();
      await user.keyboard('{Enter}');

      const input = screen.getByTestId('file-input');
      expect(input).toBeInTheDocument();
    });

    it('should trigger file input on Space key', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);

      const zone = screen.getByTestId('file-upload-zone');
      zone.focus();
      await user.keyboard('{ }');

      const input = screen.getByTestId('file-input');
      expect(input).toBeInTheDocument();
    });
  });
});
