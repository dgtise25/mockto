/**
 * Generator Types - Milestone 4
 *
 * Defines output format types for JSX/TSX generation from HTML AST.
 * These types are used by the converter to generate React component code.
 */

/**
 * Represents the target output format for generated React code
 */
export enum OutputFormat {
  /** JSX format for standard React components */
  JSX = 'jsx',
  /** TSX format with TypeScript annotations */
  TSX = 'tsx',
}

/**
 * Code formatting options for generated output
 */
export interface FormattingOptions {
  /** Indentation style ('spaces' | 'tabs') */
  indentStyle?: 'spaces' | 'tabs';
  /** Number of spaces per indentation level (default: 2) */
  indentSize?: number;
  /** Maximum line width before wrapping (default: 80) */
  printWidth?: number;
  /** Whether to use single quotes (default: false) */
  singleQuote?: boolean;
  /** Whether to add trailing commas (default: 'es5') */
  trailingComma?: 'none' | 'es5' | 'all';
  /** Whether to add semicolons (default: true) */
  semi?: boolean;
  /** Whether to format with Prettier (default: true) */
  prettier?: boolean;
}

/**
 * Generator configuration options
 */
export interface GeneratorOptions {
  /** Output format (JSX or TSX) */
  format: OutputFormat;
  /** Code formatting options */
  formatting?: FormattingOptions;
  /** Component name for the generated component */
  componentName?: string;
  /** Whether to add prop types interface in TSX */
  includePropTypes?: boolean;
  /** Whether to extract inline styles to style objects */
  extractStyles?: boolean;
  /** Whether to convert class to className */
  convertClassToClassName?: boolean;
  /** Custom import statements to add */
  customImports?: string[];
  /** Whether to add React import (default: true for non-auto-import setups) */
  includeReactImport?: boolean;
}

/**
 * Represents a generated React component file
 */
export interface GeneratedComponent {
  /** File name (e.g., 'Component.tsx') */
  fileName: string;
  /** File content */
  content: string;
  /** File type (component, style, type, etc.) */
  fileType: 'component' | 'style' | 'type' | 'index' | 'hook';
}

/**
 * Result of a JSX/TSX generation operation
 */
export interface GeneratorResult {
  /** Generated component files */
  files: GeneratedComponent[];
  /** Warnings generated during generation */
  warnings: string[];
  /** Statistics about the generation */
  stats: GeneratorStats;
  /** Entry point component file */
  entryPoint: GeneratedComponent;
}

/**
 * Statistics about code generation
 */
export interface GeneratorStats {
  /** Total number of components generated */
  componentsGenerated: number;
  /** Total number of JSX elements processed */
  elementsProcessed: number;
  /** Number of attributes transformed */
  attributesTransformed: number;
  /** Number of inline styles converted */
  inlineStylesConverted: number;
  /** Total lines of code generated */
  linesOfCode: number;
}

/**
 * HTML attribute transformation mapping
 */
export interface AttributeTransformation {
  /** Original HTML attribute name */
  originalName: string;
  /** Transformed React attribute name */
  transformedName: string;
  /** Transformation type */
  transformationType:
    | 'direct' // Direct mapping (class -> className)
    | 'event' // Event handler (onclick -> onClick)
    | 'style' // Style attribute transformation
    | 'boolean' // Boolean attribute (checked -> checked={true})
    | 'custom' // Custom transformation
    | 'remove'; // Attribute to remove
  /** Value transformation function (optional) */
  transform?: (value: string) => string | boolean | object;
}

/**
 * Style attribute representation
 */
export interface StyleAttribute {
  /** CSS property name */
  property: string;
  /** CSS value */
  value: string;
}

/**
 * Represents a React prop definition (for TypeScript generation)
 */
export interface PropDefinition {
  /** Prop name */
  name: string;
  /** Prop type */
  type: string;
  /** Whether prop is required */
  required: boolean;
  /** Default value (optional) */
  defaultValue?: string | number | boolean;
  /** Description for documentation */
  description?: string;
}

/**
 * Import statement representation
 */
export interface ImportStatement {
  /** Module source */
  from: string;
  /** Imported names (default import or named imports) */
  imports: Array<{
    name: string;
    isDefault?: boolean;
    isType?: boolean;
  }>;
}

/**
 * Component metadata extracted from HTML
 */
export interface ComponentMetadata {
  /** Detected component name */
  componentName: string;
  /** Detected props from dynamic attributes */
  props: PropDefinition[];
  /** Child component references */
  childComponents: string[];
  /** Used React hooks (useState, useEffect, etc.) */
  usedHooks: string[];
  /** External library dependencies */
  dependencies: string[];
}
