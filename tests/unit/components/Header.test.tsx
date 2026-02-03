/**
 * Header Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';

describe('Header Component', () => {
  describe('Rendering', () => {
    it('should render the header', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should display default title', () => {
      render(<Header />);
      expect(screen.getByText('HTML to React Converter')).toBeInTheDocument();
    });

    it('should display custom title', () => {
      render(<Header title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should display logo', () => {
      render(<Header />);
      expect(screen.getByTestId('app-logo')).toBeInTheDocument();
    });

    it('should display version when provided', () => {
      render(<Header version="1.0.0" />);
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('should show theme toggle when enabled', () => {
      render(<Header showThemeToggle />);
      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have skip to content link', () => {
      render(<Header />);
      const skipLink = screen.getByRole('link', { name: /skip to content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveClass('sr-only');
    });
  });
});
