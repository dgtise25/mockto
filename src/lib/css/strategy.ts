/**
 * CSS Converter Strategy Pattern - Milestone 5
 *
 * Implements the Strategy Pattern for CSS conversion, allowing different
 * CSS strategies (Tailwind, CSS Modules, Vanilla CSS) to be used
 * interchangeably.
 */

import type {
  CssConversionResult,
  CssConverterOptions,
  ParsedStyle,
  CssConversionStats,
} from '../../types/css.types';

/**
 * ICssConverter Interface - Strategy Pattern
 *
 * All CSS converters must implement this interface.
 * The convert() method takes HTML and returns converted HTML with CSS.
 */
export interface ICssConverter {
  /**
   * Convert HTML with inline styles to use the target CSS strategy
   *
   * @param html - HTML string with inline styles or class attributes
   * @param options - Configuration options for the conversion
   * @returns Conversion result with transformed HTML and CSS
   */
  convert(html: string, options?: CssConverterOptions): CssConversionResult;

  /**
   * Parse inline styles from HTML elements
   *
   * @param html - HTML string to parse
   * @returns Array of parsed style data
   */
  parseInlineStyles(html: string): ParsedStyle[];

  /**
   * Generate CSS from parsed styles
   *
   * @param styles - Parsed style data
   * @param options - Configuration options
   * @returns CSS string
   */
  generateCss(styles: ParsedStyle[], options?: CssConverterOptions): string;

  /**
   * Get the strategy name for this converter
   */
  getStrategyName(): string;

  /**
   * Get conversion statistics
   */
  getStats(): CssConversionStats;
}

/**
 * CssConverterContext - Strategy Pattern Context
 *
 * Maintains a reference to a ICssConverter strategy and delegates
 * conversion work to it. Allows switching strategies at runtime.
 */
export class CssConverterContext {
  private strategy: ICssConverter;
  private conversionHistory: CssConversionResult[] = [];

  /**
   * Create a new context with the given strategy
   *
   * @param strategy - The CSS conversion strategy to use
   */
  constructor(strategy: ICssConverter) {
    this.strategy = strategy;
  }

  /**
   * Set a new conversion strategy
   *
   * @param strategy - The new strategy to use
   */
  setStrategy(strategy: ICssConverter): void {
    this.strategy = strategy;
  }

  /**
   * Get the current strategy
   */
  getStrategy(): ICssConverter {
    return this.strategy;
  }

  /**
   * Execute the conversion using the current strategy
   *
   * @param html - HTML to convert
   * @param options - Optional configuration
   * @returns Conversion result
   */
  convert(html: string, options?: CssConverterOptions): CssConversionResult {
    const result = this.strategy.convert(html, options);
    this.conversionHistory.push(result);
    return result;
  }

  /**
   * Parse inline styles using the current strategy
   *
   * @param html - HTML to parse
   * @returns Parsed styles
   */
  parseInlineStyles(html: string): ParsedStyle[] {
    return this.strategy.parseInlineStyles(html);
  }

  /**
   * Generate CSS using the current strategy
   *
   * @param styles - Parsed styles
   * @param options - Optional configuration
   * @returns CSS string
   */
  generateCss(styles: ParsedStyle[], options?: CssConverterOptions): string {
    return this.strategy.generateCss(styles, options);
  }

  /**
   * Get the current strategy name
   */
  getStrategyName(): string {
    return this.strategy.getStrategyName();
  }

  /**
   * Get statistics from the current strategy
   */
  getStats(): CssConversionStats {
    return this.strategy.getStats();
  }

  /**
   * Get conversion history
   */
  getHistory(): CssConversionResult[] {
    return [...this.conversionHistory];
  }

  /**
   * Clear conversion history
   */
  clearHistory(): void {
    this.conversionHistory = [];
  }
}

/**
 * BaseCssConverter - Abstract base class for CSS converters
 *
 * Provides common functionality for all CSS converters.
 */
export abstract class BaseCssConverter implements ICssConverter {
  protected stats: CssConversionStats = {
    totalElementsProcessed: 0,
    inlineStylesConverted: 0,
    classesGenerated: 0,
    rulesExtracted: 0,
    filesCreated: 0,
  };

  /**
   * Convert HTML - must be implemented by subclasses
   */
  abstract convert(
    html: string,
    options?: CssConverterOptions
  ): CssConversionResult;

  /**
   * Get the strategy name - must be implemented by subclasses
   */
  abstract getStrategyName(): string;

  /**
   * Parse inline styles from HTML
   */
  parseInlineStyles(html: string): ParsedStyle[] {
    const styles: ParsedStyle[] = [];
    const styleRegex = /style=["']([^"']+)["']/gi;
    let match;

    while ((match = styleRegex.exec(html)) !== null) {
      const styleString = match[1];
      const properties = this.parseStyleString(styleString);

      // Get the element tag (simplified - in real implementation would use proper HTML parser)
      const elementMatch =
        html.substring(0, match.index).match(/<(\w+)/);
      const selector = elementMatch ? elementMatch[1] : '*';

      styles.push({
        selector,
        properties,
      });
    }

    return styles;
  }

  /**
   * Parse a style string into key-value pairs
   */
  protected parseStyleString(styleString: string): Map<string, string> {
    const properties = new Map<string, string>();
    const declarations = styleString.split(';').filter(Boolean);

    for (const declaration of declarations) {
      const [property, ...valueParts] = declaration.split(':');
      if (property && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        properties.set(property.trim(), value);
      }
    }

    return properties;
  }

  /**
   * Generate CSS - default implementation
   */
  generateCss(styles: ParsedStyle[]): string {
    const lines: string[] = [];

    for (const style of styles) {
      if (style.selector) {
        const props = this.propertiesToString(style.properties);
        lines.push(`${style.selector} { ${props} }`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Convert properties map to CSS string
   */
  protected propertiesToString(
    properties: Map<string, string>,
    indent: number = 0
  ): string {
    const indentStr = ' '.repeat(indent);
    const entries: string[] = [];

    for (const [property, value] of properties.entries()) {
      entries.push(`${indentStr}${property}: ${value};`);
    }

    return entries.join(`\n${indentStr}`);
  }

  /**
   * Generate a unique class name
   */
  protected generateClassName(prefix: string = 'css'): string {
    const hash = Math.random().toString(36).substring(2, 8);
    const className = `${prefix}-${hash}`;
    this.stats.classesGenerated++;
    return className;
  }

  /**
   * Get statistics
   */
  getStats(): CssConversionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  protected resetStats(): void {
    this.stats = {
      totalElementsProcessed: 0,
      inlineStylesConverted: 0,
      classesGenerated: 0,
      rulesExtracted: 0,
      filesCreated: 0,
    };
  }
}

/**
 * Factory function to create a CSS converter
 *
 * @param strategy - The strategy type to create
 * @returns A new ICssConverter instance
 */
export function createCssConverter(strategy: string): ICssConverter {
  // This will be implemented when individual converters are created
  throw new Error(
    `Css converter for strategy '${strategy}' not yet implemented. Use individual converter classes directly.`
  );
}
