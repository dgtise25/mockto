/**
 * Footer Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/Footer';

describe('Footer Component', () => {
  describe('Rendering', () => {
    it('should render the footer', () => {
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should display copyright notice', () => {
      render(<Footer />);
      expect(screen.getByText(/copyright/i)).toBeInTheDocument();
    });

    it('should display current year', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    });

    it('should display app name', () => {
      render(<Footer appName="Test App" />);
      expect(screen.getByText('Test App')).toBeInTheDocument();
    });
  });

  describe('Version Display', () => {
    it('should show version when enabled', () => {
      render(<Footer showVersion version="1.0.0" />);
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('should not show version by default', () => {
      render(<Footer />);
      expect(screen.queryByText(/\d+\.\d+\.\d+/)).not.toBeInTheDocument();
    });
  });

  describe('Links Section', () => {
    it('should show links when enabled', () => {
      render(<Footer showLinks />);
      expect(screen.getByRole('link', { name: /documentation/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
    });

    it('should not show links by default', () => {
      render(<Footer />);
      expect(screen.queryByRole('link', { name: /documentation/i })).not.toBeInTheDocument();
    });
  });

  describe('Back to Top', () => {
    it('should show back to top button when enabled', () => {
      render(<Footer showBackToTop />);
      expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
});
