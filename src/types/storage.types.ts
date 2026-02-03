/**
 * Storage Types - Milestone 6-8
 *
 * Defines interfaces and types for the Settings Store module.
 * Handles user preferences, localStorage operations, and migration support.
 */

import { OutputFormat } from './generator.types';
import { CssStrategy } from './css.types';

// Re-export OutputFormat for convenience
export { OutputFormat, CssStrategy };

/**
 * Current schema version for settings migration
 */
export const SETTINGS_SCHEMA_VERSION = 1;

/**
 * Storage key prefixes for namespacing
 */
export enum StorageKeyPrefix {
  SETTINGS = 'mockto-settings',
  CACHE = 'mockto-cache',
  HISTORY = 'mockto-history',
  TEMP = 'mockto-temp',
}

/**
 * All storage keys used by the application
 */
export enum StorageKeys {
  /** Main user settings */
  SETTINGS = `${StorageKeyPrefix.SETTINGS}:main`,
  /** Settings schema version */
  SETTINGS_VERSION = `${StorageKeyPrefix.SETTINGS}:version`,
  /** Exported settings data */
  SETTINGS_EXPORT = `${StorageKeyPrefix.SETTINGS}:export`,
  /** Cached conversion results */
  CONVERSION_CACHE = `${StorageKeyPrefix.CACHE}:conversions`,
  /** Conversion history */
  CONVERSION_HISTORY = `${StorageKeyPrefix.HISTORY}:items`,
  /** Temporary storage for ongoing operations */
  TEMP_DATA = `${StorageKeyPrefix.TEMP}:data`,
}

/**
 * Code formatting preferences
 */
export interface FormattingSettings {
  /** Indentation style */
  indentStyle: 'spaces' | 'tabs';
  /** Number of spaces per indentation level */
  indentSize: number;
  /** Maximum line width before wrapping */
  printWidth: number;
  /** Whether to use single quotes */
  singleQuote: boolean;
  /** Trailing comma style */
  trailingComma: 'none' | 'es5' | 'all';
  /** Whether to add semicolons */
  semi: boolean;
  /** Whether to format with Prettier */
  prettier: boolean;
}

/**
 * CSS conversion preferences
 */
export interface CssSettings {
  /** CSS conversion strategy */
  strategy: CssStrategy;
  /** Whether to preserve inline styles */
  preserveInline: boolean;
  /** Whether to extract CSS to separate files */
  extractToSeparateFile: boolean;
  /** Custom class name prefix for CSS Modules */
  classPrefix: string;
  /** Whether to use CSS custom properties (variables) */
  useCssVariables: boolean;
  /** Minimum class name length for generated classes */
  minClassNameLength: number;
  /** Whether to optimize/simplify CSS */
  optimize: boolean;
  /** Target filename for extracted CSS */
  targetFilename: string;
}

/**
 * Component generation preferences
 */
export interface ComponentSettings {
  /** Output format (JSX or TSX) */
  outputFormat: OutputFormat;
  /** Whether to add prop types interface in TSX */
  includePropTypes: boolean;
  /** Whether to extract inline styles to style objects */
  extractStyles: boolean;
  /** Whether to convert class to className */
  convertClassToClassName: boolean;
  /** Whether to add React import */
  includeReactImport: boolean;
  /** Custom component name template */
  componentNameTemplate: string;
  /** Whether to generate index files */
  generateIndexFiles: boolean;
  /** Component style option */
  componentStyle: 'functional' | 'class-based' | 'hooks-only';
  /** Naming convention for components */
  namingConvention: 'pascal-case' | 'camel-case' | 'kebab-case';
}

/**
 * Advanced/Experimental features preferences
 */
export interface AdvancedSettings {
  /** Enable component splitting based on patterns */
  enableComponentSplitting: boolean;
  /** Maximum file size before splitting (in KB) */
  maxFileSizeKB: number;
  /** Enable semantic analysis for better prop detection */
  enableSemanticAnalysis: boolean;
  /** Enable automatic pattern detection */
  enablePatternDetection: boolean;
  /** Custom attribute transformations */
  customTransformations: Record<string, string>;
  /** Whether to extract assets separately */
  extractAssets: boolean;
}

/**
 * UI/Editor preferences
 */
export interface UISettings {
  /** Selected theme */
  theme: 'light' | 'dark' | 'auto';
  /** Editor font size */
  editorFontSize: number;
  /** Editor tab size */
  editorTabSize: number;
  /** Whether to show line numbers */
  showLineNumbers: boolean;
  /** Whether to enable word wrap */
  enableWordWrap: boolean;
  /** Preview panel position */
  previewPosition: 'right' | 'bottom' | 'none';
  /** Default output path for generated components */
  outputPath: string;
}

/**
 * Main application settings interface
 */
export interface AppSettings {
  /** Schema version for migration support */
  schemaVersion: number;
  /** Component generation settings */
  component: ComponentSettings;
  /** CSS conversion settings */
  css: CssSettings;
  /** Code formatting settings */
  formatting: FormattingSettings;
  /** Advanced/experimental features */
  advanced: AdvancedSettings;
  /** UI/editor preferences */
  ui: UISettings;
  /** Timestamp when settings were last updated */
  lastUpdated: number;
  /** Application version that created these settings */
  appVersion?: string;
}

/**
 * Settings validation result
 */
export interface SettingsValidationResult {
  /** Whether settings are valid */
  isValid: boolean;
  /** Validation errors if any */
  errors: string[];
  /** Missing required settings */
  missing: string[];
  /** Unknown settings (potential version mismatch) */
  unknown: string[];
}

/**
 * Migration step definition
 */
export interface MigrationStep {
  /** Source version */
  fromVersion: number;
  /** Target version */
  toVersion: number;
  /** Migration function */
  migrate: (settings: unknown) => AppSettings;
  /** Description of what changes */
  description: string;
}

/**
 * Storage quota information
 */
export interface StorageQuotaInfo {
  /** Total quota in bytes */
  quota: number;
  /** Currently used bytes */
  usage: number;
  /** Remaining bytes */
  remaining: number;
  /** Usage percentage */
  usagePercentage: number;
}

/**
 * Storage operation result
 */
export interface StorageOperationResult<T = unknown> {
  /** Whether operation was successful */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Error code if applicable */
  errorCode?: string;
}

/**
 * Settings export/import format
 */
export interface SettingsExport {
  /** Exported settings */
  settings: AppSettings;
  /** Export metadata */
  metadata: {
    /** Export timestamp */
    exportedAt: number;
    /** Application version */
    appVersion: string;
    /** Schema version */
    schemaVersion: number;
    /** Export format version */
    formatVersion: number;
  };
}

/**
 * Storage error codes
 */
export enum StorageErrorCode {
  /** Storage is not available (e.g., private browsing) */
  STORAGE_DISABLED = 'STORAGE_DISABLED',
  /** Quota exceeded */
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  /** Invalid data format */
  INVALID_DATA = 'INVALID_DATA',
  /** Access denied */
  ACCESS_DENIED = 'ACCESS_DENIED',
  /** Migration failed */
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  /** Unknown error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Type-safe storage item wrapper
 */
export interface StorageItem<T> {
  /** Stored value */
  value: T;
  /** Version for migration support */
  version: number;
  /** Timestamp when item was stored */
  timestamp: number;
  /** Optional checksum for validation */
  checksum?: string;
}

/**
 * Default settings values
 */
export const DEFAULT_FORMATTING_SETTINGS: FormattingSettings = {
  indentStyle: 'spaces',
  indentSize: 2,
  printWidth: 80,
  singleQuote: false,
  trailingComma: 'es5',
  semi: true,
  prettier: true,
};

export const DEFAULT_CSS_SETTINGS: CssSettings = {
  strategy: CssStrategy.TAILWIND,
  preserveInline: false,
  extractToSeparateFile: true,
  classPrefix: '',
  useCssVariables: true,
  minClassNameLength: 4,
  optimize: true,
  targetFilename: 'styles.css',
};

export const DEFAULT_COMPONENT_SETTINGS: ComponentSettings = {
  outputFormat: OutputFormat.TSX,
  includePropTypes: true,
  extractStyles: false,
  convertClassToClassName: true,
  includeReactImport: false,
  componentNameTemplate: '{auto}',
  generateIndexFiles: true,
  componentStyle: 'functional',
  namingConvention: 'pascal-case',
};

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  enableComponentSplitting: true,
  maxFileSizeKB: 500,
  enableSemanticAnalysis: true,
  enablePatternDetection: true,
  customTransformations: {},
  extractAssets: true,
};

export const DEFAULT_UI_SETTINGS: UISettings = {
  theme: 'auto',
  editorFontSize: 14,
  editorTabSize: 2,
  showLineNumbers: true,
  enableWordWrap: true,
  previewPosition: 'right',
  outputPath: './src/components',
};

/**
 * Complete default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  component: DEFAULT_COMPONENT_SETTINGS,
  css: DEFAULT_CSS_SETTINGS,
  formatting: DEFAULT_FORMATTING_SETTINGS,
  advanced: DEFAULT_ADVANCED_SETTINGS,
  ui: DEFAULT_UI_SETTINGS,
  lastUpdated: Date.now(),
};

/**
 * Partial settings type for updates
 */
export type PartialSettings = Partial<Omit<AppSettings, 'schemaVersion' | 'lastUpdated'>> & {
  schemaVersion?: number;
  lastUpdated?: number;
};

/**
 * Settings category for granular updates
 */
export type SettingsCategory = keyof Omit<AppSettings, 'schemaVersion' | 'lastUpdated'>;

/**
 * Settings update options
 */
export interface SettingsUpdateOptions {
  /** Whether to validate before updating */
  validate?: boolean;
  /** Whether to trigger migration if needed */
  migrate?: boolean;
  /** Whether to persist immediately */
  persist?: boolean;
}
