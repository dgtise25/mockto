/**
 * JSX Generator Tests - Milestone 4
 *
 * Test suite for JSX generation from HTML AST.
 * Following TDD approach with comprehensive coverage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSXGenerator } from '@/lib/converter/jsxGenerator';
import {
  OutputFormat,
  GeneratorOptions,
  GeneratedComponent,
  AttributeTransformation,
} from '@/types/generator.types';

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
    class: 'flex items-center justify-center',
    'data-testid': 'test-container',
  },
  children: [
    {
      type: 'element',
      tagName: 'button',
      attributes: {
        class: 'btn btn-primary',
        type: 'button',
        onclick: 'handleClick()',
        disabled: '',
        'aria-label': 'Click me',
      },
      children: [
        {
          type: 'text',
          value: 'Click Me',
        },
      ],
    },
    {
      type: 'element',
      tagName: 'input',
      attributes: {
        type: 'text',
        placeholder: 'Enter text',
        required: '',
      },
      selfClosing: true,
    },
    {
      type: 'element',
      tagName: 'img',
      attributes: {
        src: '/image.png',
        alt: 'Test image',
      },
      selfClosing: true,
    },
  ],
};

const mockASTWithStyle: ASTNode = {
  type: 'element',
  tagName: 'div',
  attributes: {
    style: 'color: red; background-color: blue; padding: 10px;',
  },
  children: [],
};

const mockNestedAST: ASTNode = {
  type: 'element',
  tagName: 'div',
  attributes: { class: 'wrapper' },
  children: [
    {
      type: 'element',
      tagName: 'header',
      attributes: { class: 'header' },
      children: [
        {
          type: 'element',
          tagName: 'nav',
          attributes: { class: 'nav' },
          children: [
            {
              type: 'element',
              tagName: 'ul',
              attributes: {},
              children: [
                {
                  type: 'element',
                  tagName: 'li',
                  attributes: {},
                  children: [{ type: 'text', value: 'Item 1' }],
                },
                {
                  type: 'element',
                  tagName: 'li',
                  attributes: {},
                  children: [{ type: 'text', value: 'Item 2' }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'element',
      tagName: 'main',
      attributes: {},
      children: [{ type: 'text', value: 'Main content' }],
    },
  ],
};

describe('JSXGenerator', () => {
  let generator: JSXGenerator;
  let defaultOptions: GeneratorOptions;

  beforeEach(() => {
    defaultOptions = {
      format: OutputFormat.JSX,
      componentName: 'TestComponent',
      formatting: {
        indentStyle: 'spaces',
        indentSize: 2,
        printWidth: 80,
        singleQuote: true,
        trailingComma: 'es5',
        semi: true,
        prettier: false, // Disabled for consistent testing
      },
      convertClassToClassName: true,
      includeReactImport: true,
    };
    generator = new JSXGenerator(defaultOptions);
  });

  describe('constructor', () => {
    it('should create generator with default options', () => {
      const gen = new JSXGenerator({ format: OutputFormat.JSX });
      expect(gen).toBeInstanceOf(JSXGenerator);
    });

    it('should merge provided options with defaults', () => {
      const customOptions: GeneratorOptions = {
        format: OutputFormat.JSX,
        componentName: 'CustomComponent',
        formatting: { indentSize: 4 },
      };
      const gen = new JSXGenerator(customOptions);
      expect(gen).toBeInstanceOf(JSXGenerator);
    });
  });

  describe('generate', () => {
    it('should generate basic JSX component', async () => {
      const result = await generator.generate(mockAST);
      expect(result.files).toHaveLength(1);
      expect(result.entryPoint.fileType).toBe('component');
      expect(result.entryPoint.fileName).toBe('TestComponent.jsx');
      expect(result.entryPoint.content).toContain('function TestComponent()');
      expect(result.entryPoint.content).toContain('return');
    });

    it('should generate with proper React import', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain("import React from 'react'");
    });

    it('should skip React import when disabled', async () => {
      const gen = new JSXGenerator({
        format: OutputFormat.JSX,
        includeReactImport: false,
      });
      const result = await gen.generate(mockAST);
      expect(result.entryPoint.content).not.toContain("import React from 'react'");
    });

    it('should convert class attribute to className', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('className=');
      expect(result.entryPoint.content).not.toContain(' class=');
    });

    it('should handle multiple className values', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('flex items-center justify-center');
    });

    it('should handle self-closing elements', async () => {
      const result = await generator.generate(mockAST);
      // Input and img should be self-closing
      expect(result.entryPoint.content).toMatch(/<input\s+[^>]*\/>/);
      expect(result.entryPoint.content).toMatch(/<img\s+[^>]*\/>/);
    });

    it('should convert onclick to onClick', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('onClick');
      expect(result.entryPoint.content).not.toContain('onclick');
    });

    it('should handle boolean attributes', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('disabled');
    });

    it('should preserve data attributes', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('data-testid');
    });

    it('should preserve aria attributes', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('aria-label');
    });

    it('should preserve id attributes', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('id=');
    });

    it('should generate correct statistics', async () => {
      const result = await generator.generate(mockAST);
      expect(result.stats.componentsGenerated).toBe(1);
      expect(result.stats.elementsProcessed).toBeGreaterThan(0);
    });

    it('should handle nested elements correctly', async () => {
      const result = await generator.generate(mockNestedAST);
      expect(result.entryPoint.content).toContain('<header');
      expect(result.entryPoint.content).toContain('<nav');
      expect(result.entryPoint.content).toContain('<ul');
      expect(result.entryPoint.content).toContain('<li');
    });

    it('should handle text nodes', async () => {
      const result = await generator.generate(mockAST);
      expect(result.entryPoint.content).toContain('Click Me');
    });
  });

  describe('attribute transformation', () => {
    it('should handle class attribute in output', async () => {
      const result = await generator.generate({
        type: 'element',
        tagName: 'div',
        attributes: { class: 'test-class' },
        children: [],
      });
      expect(result.entryPoint.content).toContain('className=');
      expect(result.entryPoint.content).toContain('test-class');
    });

    it('should handle event handlers in output', async () => {
      const result = await generator.generate({
        type: 'element',
        tagName: 'button',
        attributes: { onclick: 'handleClick()' },
        children: [],
      });
      expect(result.entryPoint.content).toContain('onClick=');
      expect(result.entryPoint.content).toContain('handleClick()');
    });

    it('should handle boolean attributes in output', async () => {
      const result = await generator.generate({
        type: 'element',
        tagName: 'input',
        attributes: { disabled: '', checked: '' },
        children: [],
      });
      expect(result.entryPoint.content).toContain('disabled');
      expect(result.entryPoint.content).toContain('checked');
    });

    it('should preserve data attributes in output', async () => {
      const result = await generator.generate({
        type: 'element',
        tagName: 'div',
        attributes: { 'data-id': '123', 'data-test': 'value' },
        children: [],
      });
      expect(result.entryPoint.content).toContain('data-id');
      expect(result.entryPoint.content).toContain('data-test');
    });
  });

  describe('style attribute transformation', () => {
    it('should convert inline style to object', async () => {
      const result = await generator.generate(mockASTWithStyle);
      expect(result.entryPoint.content).toContain('style={{');
      expect(result.entryPoint.content).toContain('color:');
      expect(result.entryPoint.content).toContain('backgroundColor:');
    });

    it('should convert CSS property names to camelCase', async () => {
      const result = await generator.generate(mockASTWithStyle);
      expect(result.entryPoint.content).toContain('backgroundColor');
      expect(result.entryPoint.content).toContain('padding');
    });

    it('should extract style when option is enabled', async () => {
      const gen = new JSXGenerator({
        format: OutputFormat.JSX,
        extractStyles: true,
      });
      const result = await gen.generate(mockASTWithStyle);
      expect(result.stats.inlineStylesConverted).toBeGreaterThan(0);
    });
  });

  describe('custom imports', () => {
    it('should add custom import statements', async () => {
      const gen = new JSXGenerator({
        format: OutputFormat.JSX,
        customImports: ["import { Icon } from './Icon'"],
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
      expect(result.entryPoint.content).toContain("import { Icon } from './Icon'");
    });

    it('should add multiple custom imports', async () => {
      const gen = new JSXGenerator({
        format: OutputFormat.JSX,
        customImports: [
          "import { Icon } from './Icon'",
          "import { Button } from './Button'",
        ],
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
      expect(result.entryPoint.content).toContain("import { Icon } from './Icon'");
      expect(result.entryPoint.content).toContain("import { Button } from './Button'");
    });
  });

  describe('error handling', () => {
    it('should handle empty AST', async () => {
      const result = await generator.generate({ type: 'text', value: '' });
      expect(result.files).toHaveLength(1);
    });

    it('should handle null attributes', async () => {
      const result = await generator.generate({
        type: 'element',
        tagName: 'div',
        children: [],
      });
      expect(result.entryPoint.content).toContain('<div');
    });

    it('should handle missing children', async () => {
      const result = await generator.generate({
        type: 'element',
        tagName: 'div',
      });
      expect(result.entryPoint.content).toContain('<div');
    });
  });

  describe('warning collection', () => {
    it('should warn about deprecated attributes', async () => {
      const node = {
        type: 'element',
        tagName: 'input',
        attributes: { type: 'text', autocomplete: 'off' },
        children: [],
      };
      const result = await generator.generate(node);
      // autocomplete should be autoComplete
      expect(result.entryPoint.content).toContain('autoComplete');
    });

    it('should collect warnings for unsupported features', async () => {
      const node = {
        type: 'element',
        tagName: 'script',
        attributes: { type: 'text/javascript' },
        children: [{ type: 'text', value: 'console.log("test")' }],
      };
      const result = await generator.generate(node);
      // Script tags might generate warnings
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('formatting options', () => {
    it('should respect indent size option', async () => {
      const gen = new JSXGenerator({
        format: OutputFormat.JSX,
        formatting: { indentSize: 4, prettier: false },
      });
      const result = await gen.generate(mockAST);
      // Check for proper indentation pattern
      expect(result.entryPoint.content).toMatch(/\s{4}/);
    });

    it('should respect single quote option', async () => {
      const gen = new JSXGenerator({
        format: OutputFormat.JSX,
        formatting: { singleQuote: true, prettier: false },
      });
      const result = await gen.generate(mockAST);
      expect(result.entryPoint.content).toContain("'");
    });
  });

  describe('component naming', () => {
    it('should use provided component name', async () => {
      const gen = new JSXGenerator({
        format: OutputFormat.JSX,
        componentName: 'MyCustomComponent',
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
      expect(result.entryPoint.content).toContain('function MyCustomComponent()');
      expect(result.entryPoint.fileName).toBe('MyCustomComponent.jsx');
    });

    it('should use default name when not provided', async () => {
      const gen = new JSXGenerator({
        format: OutputFormat.JSX,
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
      expect(result.entryPoint.content).toContain('function Component()');
    });
  });
});
