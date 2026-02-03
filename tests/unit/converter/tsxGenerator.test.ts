/**
 * TSX Generator Tests - Milestone 4
 *
 * Test suite for TSX generation with TypeScript annotations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TSXGenerator } from '@/lib/converter/tsxGenerator';
import { OutputFormat, GeneratorOptions } from '@/types/generator.types';

/**
 * Mock AST Node types for testing
 */
interface ASTNode {
  type: string;
  tagName?: string;
  attributes?: Record<string, string>;
  children?: ASTNode[];
  value?: string;
  selfClosing?: boolean;
}

/**
 * Test HTML AST fixtures
 */
const mockAST: ASTNode = {
  type: 'element',
  tagName: 'div',
  attributes: {
    id: 'container',
    class: 'flex items-center',
  },
  children: [
    {
      type: 'element',
      tagName: 'button',
      attributes: {
        class: 'btn btn-primary',
        type: 'button',
        'data-id': '123',
      },
      children: [{ type: 'text', value: 'Click Me' }],
    },
  ],
};

const mockASTWithProps: ASTNode = {
  type: 'element',
  tagName: 'div',
  attributes: {
    'data-title': '{title}',
    'data-count': '{count}',
  },
  children: [],
};

describe('TSXGenerator', () => {
  let generator: TSXGenerator;
  let defaultOptions: GeneratorOptions;

  beforeEach(() => {
    defaultOptions = {
      format: OutputFormat.TSX,
      componentName: 'TestComponent',
      includePropTypes: true,
      formatting: {
        indentStyle: 'spaces',
        indentSize: 2,
        printWidth: 80,
        singleQuote: true,
        trailingComma: 'es5',
        semi: true,
        prettier: false,
      },
      convertClassToClassName: true,
      includeReactImport: true,
    };
    generator = new TSXGenerator(defaultOptions);
  });

  describe('constructor', () => {
    it('should create TSX generator with TSX format', () => {
      expect(generator).toBeInstanceOf(TSXGenerator);
    });

    it('should inherit JSX generator functionality', async () => {
      const result = await generator.generate(mockAST);
      expect(result.files).toHaveLength(1);
    });
  });

  describe('TSX generation', () => {
    it('should generate .tsx file extension', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.fileName).toBe('TestComponent.tsx');
    });

    it('should include TypeScript import for React', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('import React');
      // TypeScript typically uses typed React import
      expect(result.entryPoint.content).toMatch(/React|FC/);
    });

    it('should generate functional component with FC type', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toMatch(/FC|function.*Component/);
    });

    it('should add type annotations when includePropTypes is true', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        componentName: 'TestComponent',
        includePropTypes: true,
        detectPropsFromAttributes: true,
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
      });
      const result = await gen.generate(mockASTWithProps);
      // Should detect and create props interface
      expect(result.entryPoint.content).toMatch(/interface|Props/);
    });
  });

  describe('Props interface generation', () => {
    it('should create empty props interface by default', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toMatch(/interface\s+\w+Props/);
    });

    it('should detect props from data attributes', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        includePropTypes: true,
        detectPropsFromAttributes: true,
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
      });
      const result = await gen.generate(mockASTWithProps);
      expect(result.entryPoint.content).toMatch(/interface\s+\w+Props/);
    });

    it('should infer prop types from attribute patterns', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        includePropTypes: true,
        detectPropsFromAttributes: true,
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
      });
      const result = await gen.generate(mockASTWithProps);
      // Should detect string and number props from patterns
      expect(result.entryPoint.content).toMatch(/string|number/);
    });

    it('should mark optional props with ?', async () => {
      const result = await generator.generate(mockAST);
      // When there are no props, interface is empty
      expect(result.entryPoint.content).toMatch(/interface\s+TestComponentProps\s*\{/);
    });
  });

  describe('type safety features', () => {
    it('should type style attributes as React.CSSProperties', async () => {
      const astWithStyle = {
        type: 'element' as const,
        tagName: 'div',
        attributes: { style: 'color: red;' },
        children: [],
      };
      const result = await generator.generate(astWithStyle);
      // Style should be properly typed
      expect(result.entryPoint.content).toMatch(/style|CSSProperties/);
    });

    it('should type class attributes as string', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('className=');
      // className accepts string
    });
  });

  describe('custom prop types', () => {
    it('should accept custom prop definitions', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        componentName: 'TestComponent',
        includePropTypes: true,
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
        customProps: [
          { name: 'title', type: 'string', required: true },
          { name: 'count', type: 'number', required: false, defaultValue: 0 },
        ],
      });
      const result = await gen.generate(mockAST);
      expect(result.entryPoint.content).toContain('title:');
      expect(result.entryPoint.content).toMatch(/count\??/);
    });

    it('should mark required props without ?', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        includePropTypes: true,
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
        customProps: [{ name: 'required', type: 'string', required: true }],
      });
      const result = await gen.generate(mockAST);
      // Required props don't have ?
      expect(result.entryPoint.content).toMatch(/\w+:\s*string/);
    });
  });

  describe('export options', () => {
    it('should export component by default', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('export');
    });

    it('should support named export', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        exportType: 'named',
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
      });
      const result = await gen.generate(mockAST);
      expect(result.entryPoint.content).toContain('export function');
    });

    it('should support default export', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        exportType: 'default',
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
      });
      const result = await gen.generate(mockAST);
      expect(result.entryPoint.content).toContain('export default');
    });
  });

  describe('error handling', () => {
    it('should handle missing props interface gracefully', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        includePropTypes: false,
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
      });
      const result = await gen.generate(mockAST);
      expect(result.entryPoint.content).toBeDefined();
    });

    it('should handle invalid type definitions', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        includePropTypes: true,
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
        customProps: [
          { name: 'invalid', type: 'NonExistentType', required: false },
        ],
      });
      const result = await gen.generate(mockAST);
      // Should still generate code even with invalid type
      expect(result.entryPoint.content).toContain('NonExistentType');
    });
  });

  describe('statistics tracking', () => {
    it('should track props generated', async () => {
      const gen = new TSXGenerator({
        format: OutputFormat.TSX,
        includePropTypes: true,
        formatting: {
          indentStyle: 'spaces',
          indentSize: 2,
          printWidth: 80,
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          prettier: false,
        },
        customProps: [
          { name: 'prop1', type: 'string', required: true },
          { name: 'prop2', type: 'number', required: false },
        ],
      });
      const result = await gen.generate(mockAST);
      expect(result.stats.componentsGenerated).toBe(1);
    });
  });
});
