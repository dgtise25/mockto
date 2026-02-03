/**
 * CSS Converter Module - Milestone 5
 *
 * Exports all CSS converter implementations and utilities.
 * Provides Strategy Pattern implementation for CSS conversion.
 */

// Import converter implementations first
import { TailwindConverter } from './tailwindConverter';
import { CssModulesConverter } from './cssModulesConverter';
import { VanillaCssConverter } from './vanillaCssConverter';

// Strategy Pattern Base
export type {
  CssConverterContext,
} from './strategy';
export {
  BaseCssConverter,
  createCssConverter,
} from './strategy';

// Converter Implementations
export { TailwindConverter as TailwindCssConverter } from './tailwindConverter';
export { CssModulesConverter } from './cssModulesConverter';
export { VanillaCssConverter } from './vanillaCssConverter';

// Types
export type {
  CssProperty,
  CssRule,
  CssStylesheet,
  CssStrategy,
  CssConverterOptions,
  CssConversionResult,
  ParsedStyle,
  TailwindClassMapping,
  CssModuleClass,
  CssConversionStats,
} from '../../types/css.types';


/**
 * Factory function to create a CSS converter by strategy name
 *
 * @param strategy - The CSS strategy to use
 * @returns A new converter instance
 *
 * @example
 * ```typescript
 * import { createConverter } from './css';
 *
 * const tailwindConverter = createConverter('tailwind');
 * const modulesConverter = createConverter('css-modules');
 * const vanillaConverter = createConverter('vanilla');
 * ```
 */
export function createConverter(strategy: 'tailwind'): TailwindConverter;
export function createConverter(strategy: 'css-modules'): CssModulesConverter;
export function createConverter(strategy: 'vanilla'): VanillaCssConverter;
export function createConverter(strategy: 'tailwind' | 'css-modules' | 'vanilla'): TailwindConverter | CssModulesConverter | VanillaCssConverter {
  switch (strategy) {
    case 'tailwind':
      return new TailwindConverter();
    case 'css-modules':
      return new CssModulesConverter();
    case 'vanilla':
      return new VanillaCssConverter();
    default:
      throw new Error(`Unknown CSS strategy: ${strategy}`);
  }
}

/**
 * Convert HTML using the specified CSS strategy
 *
 * @param html - HTML string to convert
 * @param strategy - CSS strategy to use
 * @param options - Optional converter options
 * @returns Conversion result
 *
 * @example
 * ```typescript
 * import { convert } from './css';
 *
 * const result = convert('<div style="color: red;">Text</div>', 'tailwind');
 * console.log(result.html); // <div class="text-red-500">Text</div>
 * ```
 */
export function convert(
  html: string,
  strategy: 'tailwind',
  options?: import('../../types/css.types').CssConverterOptions
): import('../../types/css.types').CssConversionResult;
export function convert(
  html: string,
  strategy: 'css-modules',
  options?: import('../../types/css.types').CssConverterOptions
): import('../../types/css.types').CssConversionResult;
export function convert(
  html: string,
  strategy: 'vanilla',
  options?: import('../../types/css.types').CssConverterOptions
): import('../../types/css.types').CssConversionResult;
export function convert(
  html: string,
  strategy: 'tailwind' | 'css-modules' | 'vanilla',
  options?: import('../../types/css.types').CssConverterOptions
): import('../../types/css.types').CssConversionResult {
  // Use type assertion since the overload doesn't narrow properly
  const converter = createConverter(strategy as 'tailwind');
  return (converter as any).convert(html, options);
}

/**
 * Create a CSS converter context for runtime strategy switching
 *
 * @param initialStrategy - The initial CSS strategy
 * @returns A new CssConverterContext
 *
 * @example
 * ```typescript
 * import { createContext } from './css';
 *
 * const context = createContext('tailwind');
 * let result = context.convert(html);
 *
 * // Switch to CSS Modules
 * context.setStrategy(new CssModulesConverter());
 * result = context.convert(html);
 * ```
 */
export function createContext(
  initialStrategy: 'tailwind' | 'css-modules' | 'vanilla'
): import('./strategy').CssConverterContext {
  const { CssConverterContext } = require('./strategy');
  const converter = createConverter(initialStrategy as 'tailwind');
  return new CssConverterContext(converter as any);
}

/**
 * CSS Strategy Registry
 *
 * Registry of all available CSS conversion strategies.
 */
export const CSS_STRATEGIES = {
  TAILWIND: 'tailwind',
  CSS_MODULES: 'css-modules',
  VANILLA: 'vanilla',
} as const;

/**
 * Type guard to check if a value is a valid CSS strategy
 */
export function isValidStrategy(
  strategy: string
): strategy is keyof typeof CSS_STRATEGIES {
  return Object.values(CSS_STRATEGIES).includes(strategy as any);
}

/**
 * Get all available CSS strategies
 */
export function getAvailableStrategies(): ReadonlyArray<string> {
  return Object.values(CSS_STRATEGIES);
}

/**
 * Get default options for a specific strategy
 */
export function getDefaultOptions(
  strategy: keyof typeof CSS_STRATEGIES
): import('../../types/css.types').CssConverterOptions {
  const defaults: Record<
    string,
    import('../../types/css.types').CssConverterOptions
  > = {
    tailwind: {
      preserveInline: false,
      optimize: true,
    },
    'css-modules': {
      preserveInline: false,
      classPrefix: '_',
      useCssVariables: true,
      minClassNameLength: 6,
      optimize: true,
    },
    vanilla: {
      preserveInline: false,
      extractToSeparateFile: true,
      optimize: true,
      targetFilename: 'styles',
    },
  };

  return { ...defaults[strategy] };
}

/**
 * Compare conversion results between strategies
 */
export function compareStrategies(
  html: string,
  options?: import('../../types/css.types').CssConverterOptions
): Record<
  keyof typeof CSS_STRATEGIES,
  import('../../types/css.types').CssConversionResult
> {
  const results: Record<
    string,
    import('../../types/css.types').CssConversionResult
  > = {};

  for (const strategy of Object.values(CSS_STRATEGIES)) {
    const converter = createConverter(strategy as any);
    results[strategy] = converter.convert(html, options);
  }

  return results as any;
}
