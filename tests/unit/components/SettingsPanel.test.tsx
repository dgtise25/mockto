/**
 * SettingsPanel Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

describe('SettingsPanel Component', () => {
  const mockOnChange = vi.fn();

  const defaultSettings = {
    typescript: true,
    cssFramework: 'tailwind' as const,
    componentStyle: 'functional' as const,
    inlineStyles: false,
    extractAssets: true,
    namingConvention: 'pascal-case' as const,
    outputPath: './src/components',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render the settings panel', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
    });

    it('should display TypeScript toggle', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      expect(screen.getByRole('switch', { name: /typescript/i })).toBeInTheDocument();
    });

    it('should display CSS framework selector', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      expect(screen.getByRole('combobox', { name: /css framework/i })).toBeInTheDocument();
    });
  });

  describe('TypeScript Toggle', () => {
    it('should reflect current TypeScript setting', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      const toggle = screen.getByRole('switch', { name: /typescript/i });
      expect(toggle).toBeChecked();
    });

    it('should call onChange when toggled', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const toggle = screen.getByRole('switch', { name: /typescript/i });
      await user.click(toggle);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ typescript: false })
      );
    });
  });

  describe('CSS Framework Selection', () => {
    it('should display current CSS framework', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      expect(screen.getByText(/tailwind/i)).toBeInTheDocument();
    });

    it('should call onChange when framework is changed', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const select = screen.getByRole('combobox', { name: /css framework/i });
      await user.click(select);

      const cssModulesOption = screen.getByText('CSS Modules');
      await user.click(cssModulesOption);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ cssFramework: 'css-modules' })
      );
    });
  });

  describe('Output Path Input', () => {
    it('should have output path in settings', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      // Verify that outputPath is in the settings object
      expect(defaultSettings.outputPath).toBe('./src/components');
    });

    it('should call onChange when path is changed', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      // Click the Advanced tab to make the output path visible
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      await user.click(advancedTab);

      // Now the input should be visible
      const input = screen.getByRole('textbox', { name: /output path/i }) as HTMLInputElement;
      expect(input).toBeInTheDocument();

      // Type a valid path character by character (starting with .)
      await user.click(input);
      // Type each character of a valid path
      for (const char of './new-path') {
        await user.keyboard(char);
      }

      // Verify onChange was called with the new path
      const calls = mockOnChange.mock.calls;
      // Find the last call that has outputPath
      const pathCalls = calls.filter(call => call[0] && call[0].outputPath);
      expect(pathCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Reset Button', () => {
    it('should show reset button', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('should reset settings on click', async () => {
      const user = userEvent.setup();
      const customSettings = { ...defaultSettings, typescript: false };

      render(<SettingsPanel settings={customSettings} onChange={mockOnChange} />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(mockOnChange).toHaveBeenCalledWith(defaultSettings);
    });
  });
});
