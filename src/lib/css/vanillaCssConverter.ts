/**
 * Vanilla CSS Converter - Milestone 5
 *
 * Extracts inline styles to a separate vanilla CSS file.
 * Implements the ICssConverter interface for the Strategy Pattern.
 */

import {
  BaseCssConverter,
  type ICssConverter,
} from './strategy';
import type {
  CssConversionResult,
  CssConverterOptions,
  ParsedStyle,
  CssRule,
  CssStylesheet,
} from '../../types/css.types';

/**
 * VanillaCssConverter
 *
 * Converts HTML with inline styles to use external CSS classes.
 * Extracts styles to a traditional CSS file with class selectors.
 */
export class VanillaCssConverter extends BaseCssConverter implements ICssConverter {
  private cssRules: CssRule[] = [];
  private classNameCache: Map<string, string> = new Map();
  private propertiesCache: Map<string, string> = new Map();

  /**
   * Get the strategy name
   */
  getStrategyName(): string {
    return 'vanilla';
  }

  /**
   * Convert HTML with inline styles to external CSS classes
   */
  convert(html: string, options?: CssConverterOptions): CssConversionResult {
    this.resetStats();
    this.cssRules = [];
    this.classNameCache.clear();
    this.propertiesCache.clear();

    const warnings: string[] = [];
    const classNameMap = new Map<string, string>();

    // Parse inline styles from HTML
    const styles = this.parseInlineStyles(html);

    // Process each style and create CSS rules
    const classReplacements: Array<{ match: string; replacement: string }> = [];

    for (const style of styles) {
      const propertiesKey = this.getPropertiesKey(style.properties);

      // Check for identical existing rule (optimization)
      let className: string;
      let isNewRule = true;

      if (options?.optimize) {
        const existingClass = this.propertiesCache.get(propertiesKey);
        if (existingClass) {
          className = existingClass;
          isNewRule = false;
        } else {
          className = this.generateClassName(style.selector || 'class', options?.classPrefix);
          this.propertiesCache.set(propertiesKey, className);
        }
      } else {
        className = this.generateClassName(style.selector || 'class', options?.classPrefix);
      }

      // Create CSS rule only if new
      if (isNewRule) {
        const rule: CssRule = {
          selectors: [`.${className}`],
          properties: this.mapToPropertiesArray(style.properties),
        };

        this.cssRules.push(rule);
        this.stats.rulesExtracted++;
      }

      // Store the replacement for this style
      const styleString = this.propertiesToInlineString(style.properties);
      const matchPattern = `style="${styleString}"`;

      if (!options?.preserveInline) {
        classReplacements.push({
          match: matchPattern,
          replacement: `class="${className}"`,
        });
      } else {
        classReplacements.push({
          match: matchPattern,
          replacement: `${matchPattern} class="${className}"`,
        });
      }

      classNameMap.set(style.selector || 'unknown', className);
      this.stats.totalElementsProcessed++;
      this.stats.inlineStylesConverted++;
    }

    // Apply all replacements to HTML
    let convertedHtml = html;
    for (const replacement of classReplacements) {
      convertedHtml = convertedHtml.replace(replacement.match, replacement.replacement);
    }

    // Generate CSS
    const css = this.generateCss(styles, options);

    // Track generated files
    const generatedFiles: string[] = [];
    if (options?.extractToSeparateFile) {
      const filename = options.targetFilename || 'styles';
      generatedFiles.push(`${filename}.css`);
      this.stats.filesCreated++;
    }

    // Optionally add link tag to HTML
    if (options?.extractToSeparateFile && !convertedHtml.includes('<link')) {
      const linkTag = this.createLinkTag(generatedFiles[0]);
      convertedHtml = linkTag + '\n' + convertedHtml;
    }

    return {
      html: convertedHtml,
      css,
      classNameMap,
      generatedFiles,
      warnings,
    };
  }

  /**
   * Convert properties map to CSS string for matching
   */
  private propertiesToInlineString(properties: Map<string, string>): string {
    const entries: string[] = [];
    for (const [property, value] of properties.entries()) {
      entries.push(`${property}: ${value}`);
    }
    return entries.join('; ') + ';';
  }

  /**
   * Generate CSS from parsed styles
   */
  generateCss(styles: ParsedStyle[], options?: CssConverterOptions): string {
    const lines: string[] = [];

    // Add header comment
    lines.push('/*');
    lines.push(' * Vanilla CSS - Auto-generated');
    lines.push(' * Extracted from inline styles');
    lines.push(' */');
    lines.push('');

    // If cssRules is empty and styles are provided, generate rules first
    const rulesToGenerate = this.cssRules.length > 0
      ? this.cssRules
      : styles.map(style => ({
          selectors: [`.${this.generateClassName(style.selector || 'class', options?.classPrefix)}`],
          properties: this.mapToPropertiesArray(style.properties),
          mediaQuery: (style as any).mediaQuery, // Preserve mediaQuery from input style
        }));

    // Generate CSS rules
    for (const rule of rulesToGenerate) {
      if (rule.mediaQuery) {
        lines.push(`${rule.mediaQuery} {`);
      }

      // Combine selectors
      const selectorString = rule.selectors.join(', ');
      lines.push(`${selectorString} {`);

      // Add properties
      for (const prop of rule.properties) {
        const important = prop.important ? ' !important' : '';
        lines.push(`  ${prop.property}: ${prop.value}${important};`);
      }

      lines.push('}');

      if (rule.mediaQuery) {
        lines.push('}');
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate a class name based on selector
   */
  protected generateClassName(
    selector: string,
    prefix?: string
  ): string {
    const sanitizedSelector = this.sanitizeSelector(selector);
    const classPrefix = prefix || sanitizedSelector;
    const hash = this.generateHash();
    const className = `${classPrefix}-${hash}`;

    this.stats.classesGenerated++;
    return className;
  }

  /**
   * Generate a short hash
   */
  private generateHash(): string {
    return Math.random().toString(36).substring(2, 7);
  }

  /**
   * Sanitize selector for use in class name
   */
  private sanitizeSelector(selector: string): string {
    // Remove special characters and convert to lowercase
    return selector
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10) || 'class';
  }

  /**
   * Get a unique key for a set of properties
   */
  private getPropertiesKey(properties: Map<string, string>): string {
    const entries = Array.from(properties.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prop, val]) => {
        const cleanVal = val.replace('!important', '').trim();
        return `${prop}:${cleanVal}`;
      })
      .join(';');

    return entries;
  }

  /**
   * Map properties map to array format
   */
  private mapToPropertiesArray(
    properties: Map<string, string>
  ): Array<{ property: string; value: string; important?: boolean }> {
    const result: Array<{
      property: string;
      value: string;
      important?: boolean;
    }> = [];

    for (const [property, value] of properties.entries()) {
      const hasImportant = value.includes('!important');
      const cleanValue = value.replace('!important', '').trim();

      result.push({
        property,
        value: cleanValue,
        important: hasImportant,
      });
    }

    return result;
  }

  /**
   * Create a link tag for external CSS
   */
  protected createLinkTag(filename: string): string {
    return `<link rel="stylesheet" href="${filename}">`;
  }

  /**
   * Create a stylesheet object from rules
   */
  protected createStylesheet(): CssStylesheet {
    return {
      rules: this.cssRules,
      imports: [],
      variables: new Map(),
    };
  }

  /**
   * Optimize CSS rules by merging duplicates
   */
  protected optimizeRules(): void {
    const ruleMap = new Map<string, CssRule>();

    for (const rule of this.cssRules) {
      const key = this.getRuleKey(rule);

      if (ruleMap.has(key)) {
        // Merge selectors
        const existingRule = ruleMap.get(key)!;
        existingRule.selectors.push(...rule.selectors);
      } else {
        ruleMap.set(key, { ...rule, selectors: [...rule.selectors] });
      }
    }

    this.cssRules = Array.from(ruleMap.values());
  }

  /**
   * Get a unique key for a CSS rule
   */
  private getRuleKey(rule: CssRule): string {
    const props = rule.properties
      .map((p) => `${p.property}:${p.value}`)
      .sort()
      .join(';');

    return `${rule.mediaQuery || ''}:${props}`;
  }

  /**
   * Minify CSS output
   */
  protected minifyCss(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove space around punctuation
      .trim();
  }

  /**
   * Format CSS with pretty printing
   */
  protected prettifyCss(css: string): string {
    // Add newlines after rules and properties
    let formatted = css
      .replace(/\}/g, '}\n')
      .replace(/;/g, ';\n')
      .replace(/\{/g, ' {\n  ')
      .replace(/\n\s*\n/g, '\n');

    // Fix double newlines
    formatted = formatted.replace(/\n\n+/g, '\n');

    return formatted;
  }

  /**
   * Extract CSS variables from properties
   */
  protected extractVariables(properties: Map<string, string>): Map<string, string> {
    const variables = new Map<string, string>();

    for (const [property, value] of properties.entries()) {
      if (value.startsWith('var(--')) {
        // Variable reference
        const varName = value.match(/var\(([^)]+)\)/)?.[1];
        if (varName) {
          variables.set(property, varName);
        }
      }
    }

    return variables;
  }

  /**
   * Add CSS variables to stylesheet
   */
  protected addVariablesToCss(
    variables: Map<string, string>,
    lines: string[]
  ): void {
    if (variables.size === 0) return;

    lines.push(':root {');
    for (const [property, value] of variables.entries()) {
      lines.push(`  ${property}: ${value};`);
    }
    lines.push('}');
    lines.push('');
  }
}
