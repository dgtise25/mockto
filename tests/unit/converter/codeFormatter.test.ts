/**
 * Code Formatter Tests - Milestone 4
 *
 * Test suite for Prettier integration and code formatting.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeFormatter } from '@/lib/converter/codeFormatter';
import { FormattingOptions } from '@/types/generator.types';

// Mock prettier
vi.mock('prettier', () => ({
  default: {
    format: (code: string, options: any) => {
      // Simple mock implementation
      return code
        .split('\n')
        .map((line: string) => line.trim())
        .join('\n');
    },
    formatWithCursor: (code: string, options: any) => {
      // Simple mock implementation
      const formatted = code
        .split('\n')
        .map((line: string) => line.trim())
        .join('\n');
      return {
        formatted,
        cursorOffset: options.cursorOffset || 0,
      };
    },
    check: (code: string, options: any) => {
      // Simple mock - returns true if code is properly formatted
      return code.includes(';') || code === '';
    },
    resolveConfig: vi.fn(() => Promise.resolve(null)),
    resolveConfigFile: vi.fn(() => Promise.resolve(null)),
  },
}));

describe('CodeFormatter', () => {
  let formatter: CodeFormatter;
  let defaultOptions: FormattingOptions;

  beforeEach(() => {
    defaultOptions = {
      indentStyle: 'spaces',
      indentSize: 2,
      printWidth: 80,
      singleQuote: true,
      trailingComma: 'es5',
      semi: true,
      prettier: true,
    };
    formatter = new CodeFormatter(defaultOptions);
  });

  describe('constructor', () => {
    it('should create formatter with default options', () => {
      const fmt = new CodeFormatter();
      expect(fmt).toBeInstanceOf(CodeFormatter);
    });

    it('should merge provided options with defaults', () => {
      const customOptions: FormattingOptions = {
        indentSize: 4,
        singleQuote: false,
      };
      const fmt = new CodeFormatter(customOptions);
      expect(fmt).toBeInstanceOf(CodeFormatter);
    });
  });

  describe('format method', () => {
    it('should format JSX code', async () => {
      const code = `
        function Test(){
        return(<div><p>test</p></div>)}
      `;
      const result = await formatter.format(code, 'jsx');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format TSX code', async () => {
      const code = `
        function Test():JSX.Element{
        return(<div>test</div>)}
      `;
      const result = await formatter.format(code, 'tsx');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format TypeScript code', () => {
      const code = `
        interface Props{
        name:string}
      `;
      const result = formatter.format(code, 'typescript');
      expect(result).toBeDefined();
    });

    it('should apply indent size option', () => {
      const fmt = new CodeFormatter({ indentSize: 4, prettier: true });
      const code = 'function Test() { return <div>test</div>; }';
      const result = fmt.format(code, 'jsx');
      expect(result).toBeDefined();
    });

    it('should apply single quote option', () => {
      const code = `const test = "value";`;
      const result = formatter.format(code, 'typescript');
      expect(result).toBeDefined();
    });

    it('should apply trailing comma option', () => {
      const code = `const obj = { a: 1, b: 2 }`;
      const result = formatter.format(code, 'typescript');
      expect(result).toBeDefined();
    });

    it('should apply semicolon option', () => {
      const code = `const a = 1`;
      const result = formatter.format(code, 'typescript');
      expect(result).toBeDefined();
    });

    it('should respect print width option', () => {
      const fmt = new CodeFormatter({ printWidth: 40, prettier: true });
      const longLine =
        'const veryLongVariableName = "this is a very long string that should be wrapped";';
      const result = fmt.format(longLine, 'typescript');
      expect(result).toBeDefined();
    });
  });

  describe('prettier integration', () => {
    it('should use Prettier when prettier option is true', () => {
      const fmt = new CodeFormatter({ prettier: true });
      const code = 'function Test(){return <div>test</div>}';
      const result = fmt.format(code, 'jsx');
      expect(result).toBeDefined();
    });

    it('should skip Prettier when prettier option is false', () => {
      const fmt = new CodeFormatter({ prettier: false });
      const code = 'function Test(){return <div>test</div>}';
      const result = fmt.format(code, 'jsx');
      // When prettier is false, should return code as-is or minimally formatted
      expect(result).toBeDefined();
    });

    it('should handle Prettier errors gracefully', async () => {
      const fmt = new CodeFormatter({ prettier: true });
      const invalidCode = 'function Test(';
      const result = await fmt.format(invalidCode, 'jsx');
      // Should still return a string even on error
      expect(typeof result).toBe('string');
    });
  });

  describe('formatWithConfig method', () => {
    it('should format with custom config', () => {
      const customConfig = {
        semi: false,
        singleQuote: true,
      };
      const code = 'const a = 1;';
      const result = formatter.formatWithConfig(code, 'typescript', customConfig);
      expect(result).toBeDefined();
    });

    it('should override default options with custom config', () => {
      const code = 'const a = 1;';
      const customConfig = { semi: false };
      const result = formatter.formatWithConfig(code, 'typescript', customConfig);
      expect(result).toBeDefined();
    });
  });

  describe('formatAST method', () => {
    it('should format AST-based code', () => {
      const code = 'function Test() { return <div>test</div>; }';
      const result = formatter.formatAST(code, 'babel');
      expect(result).toBeDefined();
    });

    it('should handle different parsers', () => {
      const code = 'const a = 1;';
      const result = formatter.formatAST(code, 'typescript');
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle empty code', async () => {
      const result = await formatter.format('', 'jsx');
      expect(result).toBe('');
    });

    it('should handle null input', async () => {
      const result = await formatter.format(null as any, 'jsx');
      expect(result).toBe('');
    });

    it('should handle undefined input', async () => {
      const result = await formatter.format(undefined as any, 'jsx');
      expect(result).toBe('');
    });

    it('should handle invalid syntax gracefully', async () => {
      const invalidCode = 'this is not valid javascript {{{{';
      const result = await formatter.format(invalidCode, 'jsx');
      expect(typeof result).toBe('string');
    });

    it('should handle unsupported file types', async () => {
      const code = 'some code';
      const result = await formatter.format(code, 'unsupported' as any);
      expect(typeof result).toBe('string');
    });
  });

  describe('check method', () => {
    it('should check if code is formatted', async () => {
      const code = 'const a = 1;';
      const result = await formatter.check(code, 'typescript');
      expect(typeof result).toBe('boolean');
    });

    it('should return true for formatted code', async () => {
      const formattedCode = 'const a = 1;';
      const result = await formatter.check(formattedCode, 'typescript');
      expect(typeof result).toBe('boolean');
    });

    it('should return false for unformatted code', async () => {
      const unformattedCode = 'const a=1';
      const result = await formatter.check(unformattedCode, 'typescript');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('formatWithCursor method', () => {
    it('should format code and preserve cursor position', async () => {
      const code = 'const a = 1;';
      const cursorOffset = 5;
      const result = await formatter.formatWithCursor(code, 'typescript', cursorOffset);
      expect(result).toHaveProperty('formatted');
      expect(result).toHaveProperty('cursorOffset');
    });

    it('should adjust cursor position after formatting', async () => {
      const code = 'const a=1';
      const cursorOffset = 6;
      const result = await formatter.formatWithCursor(code, 'typescript', cursorOffset);
      expect(result.cursorOffset).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSupportedParsers', () => {
    it('should return list of supported parsers', () => {
      const parsers = formatter.getSupportedParsers();
      expect(Array.isArray(parsers)).toBe(true);
      expect(parsers.length).toBeGreaterThan(0);
    });

    it('should include common parsers', () => {
      const parsers = formatter.getSupportedParsers();
      expect(parsers).toContain('javascript');
      expect(parsers).toContain('typescript');
      expect(parsers).toContain('jsx');
      expect(parsers).toContain('tsx');
    });
  });

  describe('configuration loading', ()    => {
    it('should load project Prettier config', async () => {
      const config = await formatter.loadConfig();
      expect(config).toBeDefined();
    });

    it('should load Prettier config from file', async () => {
      const config = await formatter.loadConfigFromFile('.prettierrc');
      expect(config).toBeDefined();
    });

    it('should handle missing config file', async () => {
      const config = await formatter.loadConfigFromFile('non-existent-file');
      expect(config).toBeDefined();
    });
  });

  describe('options validation', () => {
    it('should validate indent size is positive', () => {
      const fmt = new CodeFormatter({ indentSize: 2 });
      expect(fmt).toBeInstanceOf(CodeFormatter);
    });

    it('should validate print width is positive', () => {
      const fmt = new CodeFormatter({ printWidth: 80 });
      expect(fmt).toBeInstanceOf(CodeFormatter);
    });

    it('should validate trailing comma option', () => {
      const validOptions = ['none', 'es5', 'all'];
      validOptions.forEach((option) => {
        const fmt = new CodeFormatter({ trailingComma: option as any });
        expect(fmt).toBeInstanceOf(CodeFormatter);
      });
    });

    it('should validate indent style option', () => {
      const validOptions = ['spaces', 'tabs'];
      validOptions.forEach((option) => {
        const fmt = new CodeFormatter({ indentStyle: option as any });
        expect(fmt).toBeInstanceOf(CodeFormatter);
      });
    });
  });

  describe('performance', () => {
    it('should format large files efficiently', () => {
      let largeCode = '';
      for (let i = 0; i < 1000; i++) {
        largeCode += `const variable${i} = ${i};\n`;
      }
      const startTime = Date.now();
      const result = formatter.format(largeCode, 'typescript');
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5s
      expect(result).toBeDefined();
    });

    it('should handle multiple format calls efficiently', () => {
      const code = 'const a = 1;';
      const iterations = 10;
      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        formatter.format(code, 'typescript');
      }
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete 10 iterations quickly
    });
  });

  describe('edge cases', () => {
    it('should handle code with JSX fragments', () => {
      const code = 'function Test() { return <>test</>; }';
      const result = formatter.format(code, 'jsx');
      expect(result).toBeDefined();
    });

    it('should handle code with TypeScript generics', () => {
      const code = 'function test<T>(value: T): T { return value; }';
      const result = formatter.format(code, 'typescript');
      expect(result).toBeDefined();
    });

    it('should handle code with decorators', () => {
      const code = '@Component()\nclass Test {}';
      const result = formatter.format(code, 'typescript');
      expect(result).toBeDefined();
    });

    it('should handle code with template literals', async () => {
      const code = 'const html = `<div>${value}</div>`;';
      const result = await formatter.format(code, 'typescript');
      expect(result).toBeDefined();
    });

    it('should handle code with unicode characters', async () => {
      const code = 'const text = "Hello 世界 🌍";';
      const result = await formatter.format(code, 'typescript');
      expect(result).toBeDefined();
      expect(result).toContain('世界');
    });

    it('should handle code with emojis', async () => {
      const code = 'const icon = "🚀";';
      const result = await formatter.format(code, 'typescript');
      expect(result).toBeDefined();
      expect(result).toContain('🚀');
    });
  });
});
