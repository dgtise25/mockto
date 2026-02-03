/**
 * CSS Converter Types - Milestone 5
 *
 * Defines interfaces and types for the Strategy Pattern implementation
 * of CSS conversion (Tailwind, CSS Modules, Vanilla CSS).
 */

/**
 * Represents a CSS property with its value
 */
export interface CssProperty {
  property: string;
  value: string;
  important?: boolean;
}

/**
 * Represents a CSS rule with selectors and declarations
 */
export interface CssRule {
  selectors: string[];
  properties: CssProperty[];
  mediaQuery?: string;
}

/**
 * Represents a complete CSS stylesheet
 */
export interface CssStylesheet {
  rules: CssRule[];
  imports?: string[];
  variables?: Map<string, string>;
}

/**
 * CSS Conversion Strategy Enum
 */
export enum CssStrategy {
  TAILWIND = 'tailwind',
  CSS_MODULES = 'css-modules',
  VANILLA = 'vanilla',
}

/**
 * Configuration options for CSS conversion
 */
export interface CssConverterOptions {
  /** Whether to preserve inline styles */
  preserveInline?: boolean;
  /** Whether to extract CSS to separate files */
  extractToSeparateFile?: boolean;
  /** Custom class name prefix for CSS Modules */
  classPrefix?: string;
  /** Whether to use CSS custom properties (variables) */
  useCssVariables?: boolean;
  /** Minimum class name length for generated classes */
  minClassNameLength?: number;
  /** Whether to optimize/simplify CSS */
  optimize?: boolean;
  /** Target filename for extracted CSS */
  targetFilename?: string;
}

/**
 * Result of CSS conversion operation
 */
export interface CssConversionResult {
  /** Converted HTML with new class names */
  html: string;
  /** Generated CSS content */
  css: string;
  /** Map of original class names to new class names */
  classNameMap: Map<string, string>;
  /** List of generated files */
  generatedFiles: string[];
  /** Warnings generated during conversion */
  warnings: string[];
}

/**
 * Parsed style attribute or stylesheet data
 */
export interface ParsedStyle {
  /** Element type (for inline styles) or selector (for stylesheets) */
  selector?: string;
  /** CSS properties */
  properties: Map<string, string>;
  /** Nested rules (for media queries, pseudo-classes) */
  nestedRules?: ParsedStyle[];
}

/**
 * Tailwind utility class mapping
 */
export interface TailwindClassMapping {
  cssProperty: string;
  cssValue: string;
  tailwindClass: string;
  variant?: string; // hover:, focus:, md:, etc.
}

/**
 * CSS Module class definition
 */
export interface CssModuleClass {
  originalName: string;
  generatedName: string;
  properties: CssProperty[];
}

/**
 * Statistics about the conversion process
 */
export interface CssConversionStats {
  totalElementsProcessed: number;
  inlineStylesConverted: number;
  classesGenerated: number;
  rulesExtracted: number;
  filesCreated: number;
}
