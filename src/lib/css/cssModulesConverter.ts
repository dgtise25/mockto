/**
 * CSS Modules Converter - Milestone 5
 *
 * Converts inline styles to CSS Modules with scoped class names.
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
  CssModuleClass,
} from '../../types/css.types';

/**
 * CssModulesConverter
 *
 * Converts HTML with inline styles to use CSS Modules.
 * CSS Modules provide scoped, locally-scoped class names to avoid conflicts.
 */
export class CssModulesConverter extends BaseCssConverter implements ICssConverter {
  private moduleClasses: CssModuleClass[] = [];
  private classNameCache: Map<string, string> = new Map();

  /**
   * Get the strategy name
   */
  getStrategyName(): string {
    return 'css-modules';
  }

  /**
   * Convert HTML with inline styles to CSS Modules
   */
  convert(html: string, options?: CssConverterOptions): CssConversionResult {
    this.resetStats();
    this.moduleClasses = [];
    this.classNameCache.clear();

    const warnings: string[] = [];
    const classNameMap = new Map<string, string>();

    // Parse inline styles from HTML
    const styles = this.parseInlineStyles(html);

    // Process each style and create module classes
    const classReplacements: Array<{ match: string; replacement: string }> = [];

    for (const style of styles) {
      const propertiesKey = this.getPropertiesKey(style.properties);

      // Check if we already have a class for these properties (optimization)
      let existingClass: string | undefined;
      if (options?.optimize) {
        existingClass = this.classNameCache.get(propertiesKey);
      }

      let className: string;
      if (existingClass) {
        className = existingClass;
      } else {
        className = this.generateUniqueClassName(
          style.selector || 'class',
          options
        );

        const moduleClass: CssModuleClass = {
          originalName: style.selector || 'unknown',
          generatedName: className,
          properties: this.mapToPropertiesArray(style.properties),
        };

        this.moduleClasses.push(moduleClass);

        if (options?.optimize) {
          this.classNameCache.set(propertiesKey, className);
        }
      }

      // Store the replacement for this style (match the exact style attribute)
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
      const filename =
        options.targetFilename || 'styles';
      generatedFiles.push(`${filename}.module.css`);
      this.stats.filesCreated++;
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
  public override generateCss(styles: ParsedStyle[], options?: CssConverterOptions): string {
    const lines: string[] = [];

    // Add header comment
    lines.push('/*');
    lines.push(' * CSS Modules - Auto-generated');
    lines.push(' * Class names are scoped to prevent conflicts');
    lines.push(' */');
    lines.push('');

    // If moduleClasses is empty and styles are provided, generate module classes first
    const classesToGenerate = this.moduleClasses.length > 0
      ? this.moduleClasses
      : styles.map(style => this.createModuleClass(style.selector || 'unknown', style.properties));

    // Add CSS variables if enabled
    if (options?.useCssVariables) {
      const variables = this.extractCssVariables(styles);
      if (variables.size > 0) {
        lines.push(':root {');
        for (const [name, value] of variables.entries()) {
          lines.push(`  ${name}: ${value};`);
        }
        lines.push('}');
        lines.push('');
      }
    }

    // Generate class declarations
    for (const moduleClass of classesToGenerate) {
      lines.push(`.${moduleClass.generatedName} {`);

      for (const prop of moduleClass.properties) {
        if (options?.useCssVariables) {
          const varName = this.getCssVariableName();
          if (varName) {
            lines.push(`  ${prop.property}: var(${varName});`);
            continue;
          }
        }
        lines.push(`  ${prop.property}: ${prop.value}${prop.important ? ' !important' : ''};`);
      }

      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Create a CSS module class definition
   */
  protected createModuleClass(
    originalName: string,
    properties: Map<string, string>
  ): CssModuleClass {
    return {
      originalName,
      generatedName: this.generateUniqueClassName(originalName),
      properties: this.mapToPropertiesArray(properties),
    };
  }

  /**
   * Generate a unique class name
   */
  protected generateUniqueClassName(
    _originalName: string,
    options?: CssConverterOptions
  ): string {
    const customPrefix = options?.classPrefix || '';
    const minLength = options?.minClassNameLength || 6;
    const hash = this.generateHash(minLength);

    // CSS Modules typically use underscore prefix for scoped names
    // If a custom prefix is provided, use it with underscore
    // Otherwise, just use underscore with hash
    const className = customPrefix
      ? `${customPrefix}_${hash}`
      : `_${hash}`;

    this.stats.classesGenerated++;
    return className;
  }

  /**
   * Generate a short hash for class names
   */
  private generateHash(minLength: number = 6): string {
    // Generate enough characters to meet minimum length
    const neededChars = Math.max(minLength, 6);
    let hash = '';
    while (hash.length < neededChars) {
      hash += Math.random().toString(36).substring(2, 10);
    }
    return hash.substring(0, neededChars);
  }

  /**
   * Get a unique key for a set of properties
   */
  private getPropertiesKey(properties: Map<string, string>): string {
    const entries = Array.from(properties.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prop, val]) => `${prop}:${val}`)
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
      const important = value.includes('!important');
      const cleanValue = value.replace('!important', '').trim();

      result.push({
        property,
        value: cleanValue,
        important,
      });
    }

    return result;
  }

  /**
   * Extract common CSS values to variables
   */
  private extractCssVariables(styles: ParsedStyle[]): Map<string, string> {
    const valueCounts = new Map<string, number>();
    const propertyValues = new Map<string, Set<string>>();

    // Count occurrences of each value
    for (const style of styles) {
      for (const [property, value] of style.properties.entries()) {
        const cleanValue = value.replace('!important', '').trim();

        valueCounts.set(cleanValue, (valueCounts.get(cleanValue) || 0) + 1);

        if (!propertyValues.has(property)) {
          propertyValues.set(property, new Set());
        }
        propertyValues.get(property)!.add(cleanValue);
      }
    }

    // Create variables for values that appear multiple times
    const variables = new Map<string, string>();
    let varIndex = 0;

    for (const [value, count] of valueCounts.entries()) {
      if (count >= 2) {
        const varName = `--css-var-${varIndex++}`;
        variables.set(varName, value);
      }
    }

    return variables;
  }

  /**
   * Get CSS variable name for a property-value pair
   */
  private getCssVariableName(): string | null {
    // This would need to be implemented with proper variable tracking
    // For now, return null to indicate no variable exists
    return null;
  }

  /**
   * Generate CSS module import statement
   */
  protected generateCssModuleImport(options?: CssConverterOptions): string {
    const filename = options?.targetFilename || 'styles';
    return `import styles from './${filename}.module.css';`;
  }

  /**
   * Generate module object with class mappings
   */
  protected generateModuleObject(moduleClasses: CssModuleClass[]): string {
    const lines: string[] = [];

    lines.push('const styles = {');
    for (const moduleClass of moduleClasses) {
      lines.push(
        `  ${moduleClass.originalName}: '${moduleClass.generatedName}',`
      );
    }
    lines.push('};');

    return lines.join('\n');
  }

  /**
   * Generate usage example
   */
  protected generateUsageExample(options?: CssConverterOptions): string {
    const importStatement = this.generateCssModuleImport(options);

    return `
${importStatement}

// Example usage:
function MyComponent() {
  return <div className={${this.moduleClasses.length > 0 ? `styles.${this.moduleClasses[0].originalName}` : 'styles.className'}}>
    Content
  </div>;
}
`;
  }
}
