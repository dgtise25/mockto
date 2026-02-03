/**
 * UI Component Type Definitions
 * Types for UI components in the application
 */

/** File upload result */
export interface FileUploadResult {
  file: File;
  content: string;
}

/** HTML input props */
export interface HtmlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minRows?: number;
  maxRows?: number;
}

/** Code preview props */
export interface CodePreviewProps {
  code: string;
  language: string;
  filename?: string;
  lineNumbers?: boolean;
}

/** Output controls props */
export interface OutputControlsProps {
  code: string;
  filename: string;
  onDownload: (format: 'tsx' | 'jsx' | 'zip') => void;
  onCopy: () => void;
  onClear: () => void;
  hasOutput: boolean;
}

/** Settings panel props */
export interface SettingsPanelProps {
  settings: ConverterSettings;
  onChange: (settings: ConverterSettings) => void;
}

/** Converter settings */
export interface ConverterSettings {
  typescript: boolean;
  cssFramework: CssFrameworkOption;
  componentStyle: ComponentStyleOption;
  inlineStyles: boolean;
  extractAssets: boolean;
  namingConvention: NamingConvention;
  outputPath: string;
}

/** CSS framework options */
export type CssFrameworkOption =
  | 'tailwind'
  | 'css-modules'
  | 'vanilla'
  | 'styled-components'
  | 'emotion';

/** Component style options */
export type ComponentStyleOption =
  | 'functional'
  | 'class-based'
  | 'hooks-only';

/** Naming convention options */
export type NamingConvention =
  | 'pascal-case'
  | 'camel-case'
  | 'kebab-case';

/** Header props */
export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showNavigation?: boolean;
}

/** Footer props */
export interface FooterProps {
  showVersion?: boolean;
  showLinks?: boolean;
}

/** Drag drop zone props */
export interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}
