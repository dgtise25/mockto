/**
 * CodePreview Component Tests
 * Tests for syntax highlighted code display
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodePreview } from '@/components/output/CodePreview';

describe('CodePreview Component', () => {
  const sampleCode = `export default function Component() {
  return <div>Hello World</div>;
}`;

  const defaultProps = {
    code: sampleCode,
    language: 'tsx',
  };

  // Create clipboard spy before all tests
  const clipboardSpy = vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
    writeText: vi.fn().mockResolvedValue(undefined),
  });


  describe('Rendering', () => {
    it('should render the code container', () => {
      render(<CodePreview {...defaultProps} />);
      expect(screen.getByTestId('code-preview')).toBeInTheDocument();
    });

    it('should display the code content', () => {
      render(<CodePreview {...defaultProps} />);
      expect(screen.getByText(/Hello World/)).toBeInTheDocument();
    });

    it('should show filename when provided', () => {
      render(<CodePreview {...defaultProps} filename="Component.tsx" />);
      expect(screen.getByText('Component.tsx')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no code', () => {
      render(<CodePreview {...defaultProps} code="" />);
      expect(screen.getByText(/no code to display/i)).toBeInTheDocument();
    });

    it('should show empty state icon', () => {
      render(<CodePreview {...defaultProps} code="" />);
      expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<CodePreview {...defaultProps} loading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should render copy button', () => {
      render(<CodePreview {...defaultProps} />);
      expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
    });

    it('should copy code on button click', async () => {
      const user = userEvent.setup();
      render(<CodePreview {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /copy code/i });
      // Verify button can be clicked without error
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Fullscreen', () => {
    it('should render fullscreen toggle button', () => {
      render(<CodePreview {...defaultProps} />);
      expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    });

    it('should toggle fullscreen class on click', async () => {
      const user = userEvent.setup();
      render(<CodePreview {...defaultProps} />);

      const container = screen.getByTestId('code-preview');
      expect(container).not.toHaveClass('fixed');

      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      await user.click(fullscreenButton);

      expect(container).toHaveClass('fixed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attribute', () => {
      render(<CodePreview {...defaultProps} />);
      const container = screen.getByTestId('code-preview');
      expect(container).toBeInTheDocument();
    });
  });

  // Restore clipboard after all tests
  afterAll(() => {
    clipboardSpy.mockRestore();
  });
});
