/**
 * Tailwind CSS Converter - Milestone 5
 *
 * Converts inline styles to Tailwind CSS utility classes.
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
} from '../../types/css.types';

/**
 * Mapping of CSS properties to Tailwind utility classes
 * (Available for future expansion)
 */
// interface TailwindMapping {
//   // Colors
//   textColor: Record<string, string>;
//   backgroundColor: Record<string, string>;
//   borderColor: Record<string, string>;
//
//   // Spacing
//   padding: Record<string, string>;
//   margin: Record<string, string>;
//
//   // Layout
//   display: Record<string, string>;
//   flexDirection: Record<string, string>;
//   justifyContent: Record<string, string>;
//   alignItems: Record<string, string>;
//   gap: Record<string, string>;
//
//   // Typography
//   fontSize: Record<string, string>;
//   fontWeight: Record<string, string>;
//   lineHeight: Record<string, string>;
//   textAlign: Record<string, string>;
//
//   // Borders
//   borderWidth: Record<string, string>;
//   borderRadius: Record<string, string>;
// }

/**
 * Tailwind CSS converter implementation
 */
export class TailwindConverter extends BaseCssConverter implements ICssConverter {
  // Tailwind utility class mappings (available for future expansion)
  // private static readonly TAILWIND_MAPPING: Partial<TailwindMapping> = {
  //   textColor: {
  //     'black': 'text-black',
  //     'white': 'text-white',
  //     'gray-500': 'text-gray-500',
  //     'red-500': 'text-red-500',
  //     'blue-500': 'text-blue-500',
  //   },
  //   backgroundColor: {
  //     'black': 'bg-black',
  //     'white': 'bg-white',
  //     'gray-100': 'bg-gray-100',
  //     'red-500': 'bg-red-500',
  //     'blue-500': 'bg-blue-500',
  //   },
  // };

  constructor() {
    super();
  }

  /**
   * Get the strategy name
   */
  getStrategyName(): string {
    return 'tailwind';
  }

  /**
   * Convert HTML with inline styles to Tailwind classes
   */
  convert(
    html: string,
    options?: CssConverterOptions
  ): CssConversionResult {
    this.resetStats();
    const warnings: string[] = [];
    const classNameMap = new Map<string, string>();

    // Parse inline styles and convert to Tailwind
    // Store replacements to apply them all at once
    const replacements: Array<{ original: string; replacement: string }> = [];

    // Use matchAll to avoid state issues with global regex
    const styleMatches = html.matchAll(/style=["']([^"']+)["']/g);

    for (const match of styleMatches) {
      const fullMatch = match[0];
      const styleAttr = match[1];
      const properties = this.parseStyleString(styleAttr);
      const tailwindClasses = this.convertStyleToTailwind(styleAttr);

      // Track unsupported properties
      for (const [property, value] of properties.entries()) {
        const className = this.getPropertyClass(property, value);
        if (!className) {
          warnings.push(`Unsupported property: ${property}: ${value}`);
        }
      }

      // Count this inline style as processed
      this.stats.inlineStylesConverted++;

      if (tailwindClasses) {
        const selector = `el-${this.stats.inlineStylesConverted}`;
        classNameMap.set(selector, tailwindClasses);
        this.stats.classesGenerated += tailwindClasses.split(' ').length;

        if (options?.preserveInline) {
          replacements.push({
            original: fullMatch,
            replacement: `${fullMatch} class="${tailwindClasses}"`,
          });
        } else {
          replacements.push({
            original: fullMatch,
            replacement: `class="${tailwindClasses}"`,
          });
        }
      }

      this.stats.totalElementsProcessed++;
    }

    // Apply all replacements
    let convertedHtml = html;
    for (const replacement of replacements) {
      convertedHtml = convertedHtml.replace(replacement.original, replacement.replacement);
    }

    return {
      html: convertedHtml,
      css: '',
      classNameMap,
      generatedFiles: [],
      warnings,
    };
  }

  /**
   * Parse style string into properties map
   */
  private parseStyleString(style: string): Map<string, string> {
    const properties = new Map<string, string>();
    const declarations = style.split(';').filter(Boolean);

    for (const declaration of declarations) {
      const colonIndex = declaration.indexOf(':');
      if (colonIndex === -1) continue;

      const property = declaration.substring(0, colonIndex).trim();
      const value = declaration.substring(colonIndex + 1).trim();

      if (property && value) {
        properties.set(property, value);
      }
    }

    return properties;
  }

  /**
   * Convert inline style string to Tailwind classes
   */
  private convertStyleToTailwind(style: string): string {
    const classes: string[] = [];
    const declarations = style.split(';').filter(Boolean);

    for (const declaration of declarations) {
      const colonIndex = declaration.indexOf(':');
      if (colonIndex === -1) continue;

      const property = declaration.substring(0, colonIndex).trim();
      const value = declaration.substring(colonIndex + 1).trim();

      if (!property || !value) continue;

      const className = this.getPropertyClass(property, value);

      if (className) {
        classes.push(className);
      }
    }

    return classes.join(' ');
  }

  /**
   * Get Tailwind class for a CSS property-value pair
   */
  private getPropertyClass(property: string, value: string): string | null {
    // Simple mapping for common properties
    const propertyMappings: Record<string, (val: string) => string | null> = {
      'flex-direction': (val) => {
        const flexDirMap: Record<string, string> = {
          'row': 'flex-row',
          'column': 'flex-col',
          'row-reverse': 'flex-row-reverse',
          'column-reverse': 'flex-col-reverse',
        };
        return flexDirMap[val] || null;
      },
      'width': (val) => {
        if (val === '50%') return 'w-1/2';
        if (val === '100%') return 'w-full';
        if (val.endsWith('%')) {
          const pct = parseInt(val);
          if (pct === 25) return 'w-1/4';
          if (pct === 33) return 'w-1/3';
          if (pct === 66) return 'w-2/3';
          if (pct === 75) return 'w-3/4';
        }
        return null;
      },
      'height': (val) => {
        if (val === '100px') return 'h-25';
        if (val === '100%') return 'h-full';
        return null;
      },
      'border': (val) => {
        if (val.includes('solid')) return 'border';
        return null;
      },
      'border-radius': (val) => {
        const radiusMap: Record<string, string> = {
          '4px': 'rounded',
          '8px': 'rounded-lg',
          '12px': 'rounded-xl',
          '16px': 'rounded-2xl',
          '9999px': 'rounded-full',
        };
        return radiusMap[val] || null;
      },
      'box-shadow': (val) => {
        const shadowMap: Record<string, string> = {
          '0 1px 2px 0 rgba(0, 0, 0, 0.05)': 'shadow-sm',
          '0 2px 4px rgba(0,0,0,0.1)': 'shadow-md',
          '0 4px 6px -1px rgba(0, 0, 0, 0.1)': 'shadow-lg',
          '0 10px 15px -3px rgba(0, 0, 0, 0.1)': 'shadow-xl',
        };
        return shadowMap[val] || null;
      },
      'opacity': (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return null;
        const pct = Math.round(num * 100);
        return `opacity-${pct}`;
      },
      'position': (val) => {
        const positionMap: Record<string, string> = {
          'static': 'static',
          'fixed': 'fixed',
          'absolute': 'absolute',
          'relative': 'relative',
          'sticky': 'sticky',
        };
        return positionMap[val] || null;
      },
      'top': (val) => {
        if (val === '0') return 'top-0';
        if (val === 'auto') return 'top-auto';
        return null;
      },
      'left': (val) => {
        if (val === '0') return 'left-0';
        if (val === 'auto') return 'left-auto';
        return null;
      },
      'right': (val) => {
        if (val === '0') return 'right-0';
        if (val === 'auto') return 'right-auto';
        return null;
      },
      'bottom': (val) => {
        if (val === '0') return 'bottom-0';
        if (val === 'auto') return 'bottom-auto';
        return null;
      },
      'overflow': (val) => {
        const overflowMap: Record<string, string> = {
          'hidden': 'overflow-hidden',
          'scroll': 'overflow-scroll',
          'auto': 'overflow-auto',
          'visible': 'overflow-visible',
        };
        return overflowMap[val] || null;
      },
      'overflow-x': (val) => {
        const overflowMap: Record<string, string> = {
          'hidden': 'overflow-x-hidden',
          'scroll': 'overflow-x-scroll',
          'auto': 'overflow-x-auto',
        };
        return overflowMap[val] || null;
      },
      'overflow-y': (val) => {
        const overflowMap: Record<string, string> = {
          'hidden': 'overflow-y-hidden',
          'scroll': 'overflow-y-scroll',
          'auto': 'overflow-y-auto',
        };
        return overflowMap[val] || null;
      },
      'grid-template-columns': (val) => {
        if (val === '1fr 1fr') return 'grid-cols-2';
        if (val === '1fr 1fr 1fr') return 'grid-cols-3';
        if (val === 'repeat(3, 1fr)') return 'grid-cols-3';
        if (val === 'repeat(4, 1fr)') return 'grid-cols-4';
        return null;
      },
      'display': (val) => {
        const displayMap: Record<string, string> = {
          'flex': 'flex',
          'grid': 'grid',
          'block': 'block',
          'inline-block': 'inline-block',
          'hidden': 'hidden',
        };
        return displayMap[val] ? displayMap[val] : null;
      },
      'text-align': (val) => {
        const alignMap: Record<string, string> = {
          'left': 'text-left',
          'center': 'text-center',
          'right': 'text-right',
        };
        return alignMap[val] || null;
      },
      'color': (val) => {
        // Map common colors to Tailwind text color classes
        const colorMap: Record<string, string> = {
          'black': 'text-black',
          'white': 'text-white',
          'red': 'text-red-500',
          'blue': 'text-blue-500',
          'green': 'text-green-500',
        };
        return colorMap[val] || null;
      },
      'background-color': (val) => {
        const bgMap: Record<string, string> = {
          'black': 'bg-black',
          'white': 'bg-white',
          'red': 'bg-red-500',
          'blue': 'bg-blue-500',
        };
        return bgMap[val] || null;
      },
      'font-weight': (val) => {
        const weightMap: Record<string, string> = {
          'bold': 'font-bold',
          'normal': 'font-normal',
          '600': 'font-semibold',
          '700': 'font-bold',
        };
        return weightMap[val] || null;
      },
      'gap': (val) => {
        // Map gap values to Tailwind spacing classes
        const gapMap: Record<string, string> = {
          '0.25rem': 'gap-1',
          '0.5rem': 'gap-2',
          '1rem': 'gap-4',
          '1.5rem': 'gap-6',
          '2rem': 'gap-8',
          '4px': 'gap-1',
          '8px': 'gap-2',
          '16px': 'gap-4',
          '24px': 'gap-6',
          '32px': 'gap-8',
        };
        return gapMap[val] || null;
      },
      'padding': (val) => {
        const paddingMap: Record<string, string> = {
          '0': 'p-0',
          '4px': 'p-1',
          '8px': 'p-2',
          '12px': 'p-3',
          '16px': 'p-4',
          '24px': 'p-6',
          '32px': 'p-8',
          '0.25rem': 'p-1',
          '0.5rem': 'p-2',
          '1rem': 'p-4',
          '1.5rem': 'p-6',
          '2rem': 'p-8',
        };
        return paddingMap[val] || null;
      },
      'margin': (val) => {
        const marginMap: Record<string, string> = {
          '0': 'm-0',
          '4px': 'm-1',
          '8px': 'm-2',
          '12px': 'm-3',
          '16px': 'm-4',
          '24px': 'm-6',
          '32px': 'm-8',
          'auto': 'mx-auto',
          '0.25rem': 'm-1',
          '0.5rem': 'm-2',
          '1rem': 'm-4',
          '1.5rem': 'm-6',
          '2rem': 'm-8',
        };
        return marginMap[val] || null;
      },
      'align-items': (val) => {
        const alignMap: Record<string, string> = {
          'start': 'items-start',
          'end': 'items-end',
          'center': 'items-center',
          'stretch': 'items-stretch',
          'flex-start': 'items-start',
          'flex-end': 'items-end',
        };
        return alignMap[val] || null;
      },
      'justify-content': (val) => {
        const justifyMap: Record<string, string> = {
          'start': 'justify-start',
          'end': 'justify-end',
          'center': 'justify-center',
          'between': 'justify-between',
          'around': 'justify-around',
          'evenly': 'justify-evenly',
        };
        return justifyMap[val] || null;
      },
    };

    const mapper = propertyMappings[property.toLowerCase()];
    return mapper ? mapper(value) : null;
  }

  /**
   * Convert CSS properties map to Tailwind classes
   * Used by tests to verify property-to-class mappings
   */
  propertiesToTailwindClasses(properties: Map<string, string>): string[] {
    const classes: string[] = [];

    for (const [property, value] of properties.entries()) {
      const className = this.getPropertyClass(property, value);
      if (className) {
        classes.push(className);
      }
    }

    return classes;
  }

  /**
   * Generate CSS from parsed styles
   * For Tailwind, returns empty string since utility classes are used
   */
  generateCss(_styles: ParsedStyle[]): string {
    // Tailwind uses utility classes, so no CSS is generated
    return '';
  }

  /**
   * Parse CSS string to structured styles
   */
  protected parseCss(css: string): ParsedStyle[] {
    const styles: ParsedStyle[] = [];
    const declarations = css.split(';').filter(Boolean);

    for (const declaration of declarations) {
      const [property, value] = declaration.split(':').map(s => s.trim());
      if (property && value) {
        const properties = new Map<string, string>();
        properties.set(property, value);
        styles.push({
          selector: '*',
          properties,
        });
      }
    }

    return styles;
  }

  /**
   * Convert parsed styles to Tailwind classes
   */
  protected stylesToString(styles: ParsedStyle[]): string {
    return styles
      .map(style => {
        let className = '';
        for (const [property, value] of style.properties.entries()) {
          const cls = this.getPropertyClass(property, value);
          if (cls) className += cls + ' ';
        }
        return className.trim();
      })
      .filter(Boolean)
      .join(' ');
  }
}
