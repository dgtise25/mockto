/**
 * Code Formatter - Milestone 4
 *
 * Prettier integration for formatting generated JSX/TSX code.
 * Provides consistent code styling and formatting options.
 */

import prettier from 'prettier';

/**
 * Format result with cursor position
 */
interface FormatWithCursorResult {
  formatted: string;
  cursorOffset: number;
}

/**
 * Code formatter using Prettier for consistent code styling
 */
export class CodeFormatter {
  private options: {
    indentStyle: 'spaces';
    indentSize: number;
    printWidth: number;
    singleQuote: boolean;
    trailingComma: 'none' | 'es5' | 'all';
    semi: boolean;
    prettier: boolean;
  };

  /**
   * Default formatting options
   */
  private static readonly DEFAULT_OPTIONS = {
    indentStyle: 'spaces' as const,
    indentSize: 2,
    printWidth: 80,
    singleQuote: true,
    trailingComma: 'es5' as 'none' | 'es5' | 'all',
    semi: true,
    prettier: true,
  };

  /**
   * Create a new code formatter
   * @param options - Formatting options
   */
  constructor(options?: Partial<typeof CodeFormatter.DEFAULT_OPTIONS>) {
    this.options = { ...CodeFormatter.DEFAULT_OPTIONS, ...options };
  }

  /**
   * Format code using configured options (async)
   * @param code - Code to format
   * @param parser - Prettier parser to use
   * @returns Formatted code
   */
  async format(code: string | null | undefined, parser: 'jsx' | 'tsx' | 'typescript' = 'typescript'): Promise<string> {
    if (!code || code.trim() === '') {
      return code || '';
    }

    if (!this.options.prettier) {
      return code;
    }

    try {
      const prettierConfig = this.getPrettierConfig(parser);
      return await prettier.format(code, prettierConfig);
    } catch (error) {
      console.warn('Prettier formatting failed:', error);
      // Return original code if formatting fails
      return code;
    }
  }

  /**
   * Format code with custom configuration (async)
   * @param code - Code to format
   * @param parser - Prettier parser to use
   * @param customConfig - Custom Prettier configuration
   * @returns Formatted code
   */
  async formatWithConfig(
    code: string,
    parser: 'jsx' | 'tsx' | 'typescript',
    customConfig: prettier.Options
  ): Promise<string> {
    try {
      const config = {
        ...this.getPrettierConfig(parser),
        ...customConfig,
      };
      return await prettier.format(code, config);
    } catch (error) {
      console.warn('Prettier formatting with custom config failed:', error);
      return code;
    }
  }

  /**
   * Format code from AST (async)
   * @param code - Code to format
   * @param parser - Parser to use
   * @returns Formatted code
   */
  async formatAST(code: string, parser: string = 'babel'): Promise<string> {
    try {
      return await prettier.format(code, {
        parser: parser as prettier.BuiltInParserName,
        ...this.getPrettierConfig('typescript'),
      });
    } catch (error) {
      console.warn('Prettier AST formatting failed:', error);
      return code;
    }
  }

  /**
   * Check if code is formatted (async)
   * @param code - Code to check
   * @param parser - Parser to use
   * @returns True if code is already formatted
   */
  async check(code: string, parser: 'jsx' | 'tsx' | 'typescript' = 'typescript'): Promise<boolean> {
    try {
      const prettierConfig = this.getPrettierConfig(parser);
      return await prettier.check(code, prettierConfig);
    } catch (error) {
      return false;
    }
  }

  /**
   * Format code and preserve cursor position (async)
   * @param code - Code to format
   * @param parser - Parser to use
   * @param cursorOffset - Current cursor position
   * @returns Formatted code and new cursor position
   */
  async formatWithCursor(
    code: string,
    parser: 'jsx' | 'tsx' | 'typescript' = 'typescript',
    cursorOffset: number
  ): Promise<FormatWithCursorResult> {
    try {
      const prettierConfig = this.getPrettierConfig(parser);
      return await prettier.formatWithCursor(code, {
        ...prettierConfig,
        cursorOffset,
      });
    } catch (error) {
      console.warn('Prettier formatWithCursor failed:', error);
      return { formatted: code, cursorOffset };
    }
  }

  /**
   * Get Prettier configuration from options
   * @param parser - Parser to use
   * @returns Prettier configuration
   */
  private getPrettierConfig(parser: 'jsx' | 'tsx' | 'typescript'): prettier.Options {
    return {
      parser: parser === 'jsx' ? 'babel' : parser === 'tsx' ? 'babel-ts' : 'typescript',
      useTabs: false,
      tabWidth: this.options.indentSize,
      printWidth: this.options.printWidth,
      singleQuote: this.options.singleQuote,
      trailingComma: this.options.trailingComma,
      semi: this.options.semi,
      jsxSingleQuote: false,
      arrowParens: 'always',
      endOfLine: 'lf',
      bracketSpacing: true,
      jsxBracketSameLine: false,
      plugins: [],
    };
  }

  /**
   * Get list of supported Prettier parsers
   * @returns Array of parser names
   */
  getSupportedParsers(): string[] {
    return [
      'javascript',
      'typescript',
      'jsx',
      'tsx',
      'json',
      'css',
      'scss',
      'less',
      'html',
      'vue',
      'angular',
      'markdown',
      'yaml',
      'graphql',
    ];
  }

  /**
   * Get current formatting options
   * @returns Current options
   */
  getOptions(): typeof CodeFormatter.DEFAULT_OPTIONS {
    return { ...this.options };
  }

  /**
   * Update formatting options
   * @param options - New options to merge
   */
  updateOptions(options: Partial<typeof CodeFormatter.DEFAULT_OPTIONS>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Reset to default options
   */
  resetToDefaults(): void {
    this.options = { ...CodeFormatter.DEFAULT_OPTIONS };
  }

  /**
   * Create a snapshot of current options
   * @returns Snapshot of options
   */
  snapshot(): typeof CodeFormatter.DEFAULT_OPTIONS {
    return JSON.parse(JSON.stringify(this.options));
  }

  /**
   * Restore options from snapshot
   * @param snapshot - Snapshot to restore
   */
  restore(snapshot: typeof CodeFormatter.DEFAULT_OPTIONS): void {
    this.options = JSON.parse(JSON.stringify(snapshot));
  }

  /**
   * Load Prettier configuration from project (async)
   * @returns Prettier configuration or null
   */
  async loadConfig(): Promise<prettier.Config | null> {
    try {
      return await prettier.resolveConfig(process.cwd());
    } catch {
      return null;
    }
  }

  /**
   * Load Prettier configuration from specific file (async)
   * @param filePath - Path to config file
   * @returns Prettier configuration or null
   */
  async loadConfigFromFile(filePath: string): Promise<prettier.Config | null> {
    try {
      const configFile = await prettier.resolveConfigFile(filePath);
      if (configFile) {
        return await prettier.resolveConfig(process.cwd());
      }
      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Create a default code formatter instance
 */
export function createCodeFormatter(
  options?: {
    indentStyle?: 'spaces';
    indentSize?: number;
    printWidth?: number;
    singleQuote?: boolean;
    trailingComma?: 'none' | 'es5' | 'all';
    semi?: boolean;
    prettier?: boolean;
  }
): CodeFormatter {
  return new CodeFormatter(options);
}

/**
 * Default formatter instance
 */
export const defaultFormatter = new CodeFormatter();
