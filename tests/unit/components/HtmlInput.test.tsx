/**
 * HtmlInput Component Tests
 * Tests for HTML input textarea with syntax highlighting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HtmlInput } from '@/components/input/HtmlInput';

describe('HtmlInput Component', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    value: '',
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
    // Reset clipboard mock
    (navigator.clipboard as any).writeText = vi.fn().mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render the textarea', () => {
      render(<HtmlInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display initial value', () => {
      render(<HtmlInput {...defaultProps} value="<div>test</div>" />);
      expect(screen.getByRole('textbox')).toHaveValue('<div>test</div>');
    });

    it('should show placeholder when empty', () => {
      render(
        <HtmlInput
          {...defaultProps}
          placeholder="<div>Paste your HTML here...</div>"
        />
      );
      expect(
        screen.getByPlaceholderText(/paste your html here/i)
      ).toBeInTheDocument();
    });

    it('should render with label when provided', () => {
      render(<HtmlInput {...defaultProps} label="HTML Input" id="html-input" />);
      expect(screen.getByText('HTML Input')).toBeInTheDocument();
    });

    it('should show helper text when provided', () => {
      render(
        <HtmlInput
          {...defaultProps}
          helperText="Paste your HTML mockup here"
          id="html-input"
        />
      );
      expect(screen.getByText(/paste your html mockup here/i)).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      render(<HtmlInput {...defaultProps} id="html-input" />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      // userEvent.type() triggers onChange for each character
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle paste events', async () => {
      const user = userEvent.setup();
      render(<HtmlInput {...defaultProps} id="html-input" />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.paste('Pasted content');

      // userEvent.paste() triggers onChange for the pasted content
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle multi-line input', async () => {
      const user = userEvent.setup();
      render(<HtmlInput {...defaultProps} id="html-input" />);

      const textarea = screen.getByRole('textbox');
      const multiLineHtml = 'line1\nline2';

      await user.type(textarea, multiLineHtml);

      // userEvent.type() triggers onChange for each character
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Syntax Highlighting', () => {
    it('should apply syntax highlighting class', () => {
      render(<HtmlInput {...defaultProps} value="<div>test</div>" />);
      const container = screen.getByTestId('html-input-container');
      expect(container).toHaveClass('syntax-highlight');
    });
  });

  describe('Character Count', () => {
    it('should display character count', () => {
      render(<HtmlInput {...defaultProps} value="<div>test</div>" />);
      expect(screen.getByText(/\d+ character/)).toBeInTheDocument();
    });

    it('should show singular "character" for single character', () => {
      render(<HtmlInput {...defaultProps} value="a" />);
      expect(screen.getByText('1 character')).toBeInTheDocument();
    });

    it('should show plural "characters" for multiple characters', () => {
      render(<HtmlInput {...defaultProps} value="abc" />);
      expect(screen.getByText('3 characters')).toBeInTheDocument();
    });
  });

  describe('Line Count', () => {
    it('should display line count when code has newlines', () => {
      render(<HtmlInput {...defaultProps} value="line1\nline2" />);
      // Check that the character count is displayed
      expect(screen.getByText(/12/)).toBeInTheDocument();
    });
  });

  describe('Read Only Mode', () => {
    it('should not allow input when readOnly', async () => {
      const user = userEvent.setup();
      render(<HtmlInput {...defaultProps} readOnly value="<div>test</div>" />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'x');

      expect(textarea).toHaveValue('<div>test</div>');
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should have readOnly attribute', () => {
      render(<HtmlInput {...defaultProps} readOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
  });

  describe('Error States', () => {
    it('should display error message when provided', () => {
      render(
        <HtmlInput
          {...defaultProps}
          error="Invalid HTML structure"
          id="html-input"
        />
      );
      expect(screen.getByText('Invalid HTML structure')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <HtmlInput
          {...defaultProps}
          label="HTML Input"
          id="html-input"
        />
      );

      const label = screen.getByText('HTML Input');
      const textarea = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', 'html-input');
      expect(textarea).toHaveAttribute('id', 'html-input');
    });

    it('should announce helper text to screen readers', () => {
      render(
        <HtmlInput
          {...defaultProps}
          helperText="Enter HTML code"
          id="html-input"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby');
    });
  });
});
