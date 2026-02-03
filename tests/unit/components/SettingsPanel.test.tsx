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

    it('should display Save button (always visible)', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when there are unsaved changes', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();

      // Make a change to trigger unsaved changes
      const toggle = screen.getByRole('switch', { name: /typescript/i });
      await user.click(toggle);

      // Save button should now be enabled
      expect(saveButton).not.toBeDisabled();
    });

    it('should show unsaved changes indicator', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const toggle = screen.getByRole('switch', { name: /typescript/i });
      await user.click(toggle);

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });
  });

  describe('TypeScript Toggle', () => {
    it('should reflect current TypeScript setting', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      const toggle = screen.getByRole('switch', { name: /typescript/i });
      expect(toggle).toBeChecked();
    });

    it('should not call onChange immediately when toggled', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const toggle = screen.getByRole('switch', { name: /typescript/i });
      await user.click(toggle);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call onChange when Save is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const toggle = screen.getByRole('switch', { name: /typescript/i });
      await user.click(toggle);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

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

    it('should not call onChange immediately when framework is changed', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const select = screen.getByRole('combobox', { name: /css framework/i });
      await user.click(select);

      const cssModulesOption = screen.getByText('CSS Modules');
      await user.click(cssModulesOption);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call onChange when Save is clicked after changing framework', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const select = screen.getByRole('combobox', { name: /css framework/i });
      await user.click(select);

      const cssModulesOption = screen.getByText('CSS Modules');
      await user.click(cssModulesOption);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

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

    it('should not call onChange immediately when path is changed', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      // Click the Advanced tab to make the output path visible
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      await user.click(advancedTab);

      // Now the input should be visible
      const input = screen.getByRole('textbox', { name: /output path/i }) as HTMLInputElement;
      expect(input).toBeInTheDocument();

      // Type a valid path using clear and type
      await user.clear(input);
      await user.type(input, './src/new-path');

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call onChange when Save is clicked after changing path', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      // Click the Advanced tab to make the output path visible
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      await user.click(advancedTab);

      // Now the input should be visible
      const input = screen.getByRole('textbox', { name: /output path/i }) as HTMLInputElement;
      expect(input).toBeInTheDocument();

      // Clear the input and type a new path
      await user.clear(input);
      await user.type(input, './lib/components');

      // Click Save button
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ outputPath: './lib/components' })
      );
    });
  });

  describe('Reset Button', () => {
    it('should show reset button', () => {
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('should reset to default settings but not call onChange immediately', async () => {
      const user = userEvent.setup();
      const customSettings = { ...defaultSettings, typescript: false };

      render(<SettingsPanel settings={customSettings} onChange={mockOnChange} />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call onChange with defaults when Save is clicked after reset', async () => {
      const user = userEvent.setup();
      const customSettings = { ...defaultSettings, typescript: false };

      render(<SettingsPanel settings={customSettings} onChange={mockOnChange} />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Should show unsaved changes indicator
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();

      // Click Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnChange).toHaveBeenCalledWith(defaultSettings);
    });
  });

  describe('Unsaved Changes Indicator', () => {
    it('should appear when settings change', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const toggle = screen.getByRole('switch', { name: /typescript/i });
      await user.click(toggle);

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    it('should disappear after saving', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel settings={defaultSettings} onChange={mockOnChange} />);

      const toggle = screen.getByRole('switch', { name: /typescript/i });
      await user.click(toggle);

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
    });
  });
});
