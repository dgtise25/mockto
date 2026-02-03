/**
 * SettingsPanel Component
 * Settings form with all configuration options
 */

import React, { useCallback } from 'react';
import {
  Settings,
  RotateCcw,
  Download,
  Upload,
  Keyboard,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ConverterSettings,
  CssFrameworkOption,
  ComponentStyleOption,
  NamingConvention,
} from '@/types/ui.types';
import { cn } from '@/lib/utils';

export interface SettingsPanelProps {
  settings: ConverterSettings;
  onChange: (settings: ConverterSettings) => void;
  className?: string;
  showShortcuts?: boolean;
  onExport?: () => void;
  onImport?: () => void;
}

const DEFAULT_SETTINGS: ConverterSettings = {
  typescript: true,
  cssFramework: 'tailwind',
  componentStyle: 'functional',
  inlineStyles: false,
  extractAssets: true,
  namingConvention: 'pascal-case',
  outputPath: './src/components',
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  className,
  showShortcuts = false,
  onExport,
  onImport,
}) => {
  const updateSetting = useCallback(
    <K extends keyof ConverterSettings>(key: K, value: ConverterSettings[K]) => {
      onChange({ ...settings, [key]: value });
    },
    [settings, onChange]
  );

  const handleReset = useCallback(() => {
    onChange(DEFAULT_SETTINGS);
  }, [onChange]);

  const cssFrameworkOptions: { value: CssFrameworkOption; label: string }[] = [
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'css-modules', label: 'CSS Modules' },
    { value: 'vanilla', label: 'Vanilla CSS' },
    { value: 'styled-components', label: 'Styled Components' },
    { value: 'emotion', label: 'Emotion' },
  ];

  const componentStyleOptions: { value: ComponentStyleOption; label: string }[] = [
    { value: 'functional', label: 'Functional Components' },
    { value: 'class-based', label: 'Class Components' },
    { value: 'hooks-only', label: 'Hooks Only' },
  ];

  const namingConventionOptions: { value: NamingConvention; label: string }[] = [
    { value: 'pascal-case', label: 'Pascal Case (MyComponent)' },
    { value: 'camel-case', label: 'Camel Case (myComponent)' },
    { value: 'kebab-case', label: 'Kebab Case (my-component)' },
  ];

  const validatePath = (path: string): boolean => {
    return /^\.?\.?\/?[\w-\/]*$/.test(path);
  };

  const handlePathChange = (value: string) => {
    if (validatePath(value) || value === '') {
      updateSetting('outputPath', value);
    }
  };

  const isPathValid = validatePath(settings.outputPath);

  return (
    <div data-testid="settings-panel" className={cn('w-full', className)}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Converter Settings</h2>
          </div>
          <div className="flex gap-2">
            {onExport && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onExport}
                title="Export settings"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onImport && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onImport}
                title="Import settings"
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              title="Reset to defaults"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-4">
            {/* TypeScript Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="typescript">TypeScript</Label>
                <p className="text-xs text-muted-foreground">
                  Generate TypeScript code with type definitions
                </p>
              </div>
              <Switch
                id="typescript"
                checked={settings.typescript}
                onCheckedChange={(checked) => updateSetting('typescript', checked)}
                aria-label="TypeScript toggle"
              />
            </div>

            <Separator />

            {/* CSS Framework */}
            <div className="space-y-2">
              <Label htmlFor="css-framework">CSS Framework</Label>
              <Select
                value={settings.cssFramework}
                onValueChange={(value) => updateSetting('cssFramework', value as CssFrameworkOption)}
              >
                <SelectTrigger id="css-framework">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cssFrameworkOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Component Style */}
            <div className="space-y-2">
              <Label>Component Style</Label>
              <div className="space-y-2">
                {componentStyleOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`style-${option.value}`}
                      name="component-style"
                      checked={settings.componentStyle === option.value}
                      onChange={() => updateSetting('componentStyle', option.value)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`style-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Naming Convention */}
            <div className="space-y-2">
              <Label htmlFor="naming-convention">Naming Convention</Label>
              <Select
                value={settings.namingConvention}
                onValueChange={(value) => updateSetting('namingConvention', value as NamingConvention)}
              >
                <SelectTrigger id="naming-convention">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {namingConventionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-4">
            {/* Inline Styles */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inline-styles">Inline Styles</Label>
                <p className="text-xs text-muted-foreground">
                  Use inline styles instead of CSS classes
                </p>
              </div>
              <Switch
                id="inline-styles"
                checked={settings.inlineStyles}
                onCheckedChange={(checked) => updateSetting('inlineStyles', checked)}
              />
            </div>

            <Separator />

            {/* Extract Assets */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="extract-assets">Extract Assets</Label>
                <p className="text-xs text-muted-foreground">
                  Extract images, fonts, and other assets separately
                </p>
              </div>
              <Switch
                id="extract-assets"
                checked={settings.extractAssets}
                onCheckedChange={(checked) => updateSetting('extractAssets', checked)}
              />
            </div>

            <Separator />

            {/* Output Path */}
            <div className="space-y-2">
              <Label htmlFor="output-path">Output Path</Label>
              <Input
                id="output-path"
                name="output-path"
                type="text"
                value={settings.outputPath}
                onChange={(e) => handlePathChange(e.target.value)}
                placeholder="./src/components"
                aria-label="Output path"
                className={!isPathValid ? 'border-destructive' : ''}
              />
              {!isPathValid && (
                <p className="text-xs text-destructive">Invalid path format</p>
              )}
              <p className="text-xs text-muted-foreground">
                Relative path where components will be saved
              </p>
            </div>

            {showShortcuts && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    <Label>Keyboard Shortcuts</Label>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Ctrl + S - Download code</p>
                    <p>Ctrl + C - Copy to clipboard</p>
                    <p>Ctrl + / - Toggle settings</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPanel;
