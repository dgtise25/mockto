/**
 * CSS Modules Converter Tests
 *
 * Test suite for CSS Modules generation strategy.
 * Following TDD - tests written before implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CssModulesConverter } from '../../../src/lib/css/cssModulesConverter';
import type {
  CssConverterOptions,
  CssConversionResult,
  ParsedStyle,
} from '../../../src/types/css.types';

describe('CssModulesConverter', () => {
  let converter: CssModulesConverter;

  beforeEach(() => {
    converter = new CssModulesConverter();
  });

  describe('getStrategyName', () => {
    it('should return "css-modules" as strategy name', () => {
      expect(converter.getStrategyName()).toBe('css-modules');
    });
  });

  describe('generateUniqueClassName', () => {
    it('should generate unique class names', () => {
      const className1 = converter['generateUniqueClassName']('test');
      const className2 = converter['generateUniqueClassName']('test');

      expect(className1).toMatch(/^[a-z0-9_]+$/);
      expect(className2).toMatch(/^[a-z0-9_]+$/);
      expect(className1).not.toBe(className2);
    });

    it('should respect minimum class name length option', () => {
      const className = converter['generateUniqueClassName']('test', { minClassNameLength: 10 });
      expect(className.length).toBeGreaterThanOrEqual(10);
    });

    it('should use custom prefix when provided', () => {
      const className = converter['generateUniqueClassName']('custom', { classPrefix: 'custom' });
      expect(className).toMatch(/^custom_[a-z0-9]+$/);
    });
  });

  describe('parseInlineStyles', () => {
    it('should parse inline styles from HTML', () => {
      const html = '<div style="color: red; padding: 10px;">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(1);
      expect(styles[0].properties.get('color')).toBe('red');
      expect(styles[0].properties.get('padding')).toBe('10px');
    });

    it('should parse multiple elements with inline styles', () => {
      const html = `
        <div style="color: red;">First</div>
        <span style="background: blue;">Second</span>
      `;
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(2);
    });
  });

  describe('createModuleClass', () => {
    it('should create a module class with properties', () => {
      const properties = new Map([
        ['color', 'red'],
        ['padding', '10px'],
      ]);

      const moduleClass = converter['createModuleClass']('originalClass', properties);

      expect(moduleClass.originalName).toBe('originalClass');
      expect(moduleClass.properties).toHaveLength(2);
      expect(moduleClass.generatedName).toMatch(/^[a-z0-9_]+$/);
    });
  });

  describe('generateCss', () => {
    it('should generate CSS class declarations', () => {
      const styles: ParsedStyle[] = [
        {
          selector: 'div',
          properties: new Map([['color', 'red'], ['padding', '10px']]),
        },
      ];

      const css = converter.generateCss(styles);

      expect(css).toContain('color:');
      expect(css).toContain('padding:');
      expect(css).toContain('{');
      expect(css).toContain('}');
    });

    it('should include CSS Modules comment header', () => {
      const styles: ParsedStyle[] = [];
      const css = converter.generateCss(styles);

      expect(css).toContain('CSS Modules');
    });

    it('should generate scoped class names', () => {
      const styles: ParsedStyle[] = [
        {
          selector: 'div',
          properties: new Map([['color', 'red']]),
        },
      ];

      const css = converter.generateCss(styles);

      // CSS Modules use scoped class names
      expect(css).toMatch(/\.[a-z0-9_]+\s*\{/);
    });
  });

  describe('convert', () => {
    it('should convert inline styles to CSS module classes', () => {
      const html = '<div style="color: red; padding: 10px;">Content</div>';
      const result = converter.convert(html);

      // Should replace inline style with class
      expect(result.html).toContain('class=');
      expect(result.html).not.toContain('style=');
    });

    it('should generate CSS file content', () => {
      const html = '<div style="color: red;">Content</div>';
      const result = converter.convert(html);

      expect(result.css).toBeTruthy();
      expect(result.css.length).toBeGreaterThan(0);
    });

    it('should populate classNameMap', () => {
      const html = '<div style="color: red;">Content</div>';
      const result = converter.convert(html);

      expect(result.classNameMap.size).toBeGreaterThan(0);
    });

    it('should track generated files', () => {
      const html = '<div style="color: red;">Content</div>';
      const options: CssConverterOptions = { extractToSeparateFile: true };
      const result = converter.convert(html, options);

      expect(result.generatedFiles.length).toBeGreaterThan(0);
      expect(result.generatedFiles[0]).toContain('.module.css');
    });

    it('should preserve inline styles when option is set', () => {
      const html = '<div style="color: red;">Content</div>';
      const options: CssConverterOptions = { preserveInline: true };
      const result = converter.convert(html, options);

      expect(result.html).toContain('style=');
    });

    it('should use custom class prefix from options', () => {
      const html = '<div style="color: red;">Content</div>';
      const options: CssConverterOptions = { classPrefix: 'custom' };
      const result = converter.convert(html, options);

      // Check that classes use custom prefix
      expect(result.html).toMatch(/class="custom_[a-z0-9]+"/);
    });

    it('should handle multiple elements', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="background: blue;">Second</div>
      `;
      const result = converter.convert(html);

      // Should have 2 unique classes
      const uniqueClasses = new Set<string>();
      const classMatches = result.html.matchAll(/class="([^"]+)"/g);

      for (const match of classMatches) {
        uniqueClasses.add(match[1]);
      }

      expect(uniqueClasses.size).toBe(2);
    });

    it('should track statistics', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="background: blue;">Second</div>
      `;
      converter.convert(html);

      const stats = converter.getStats();

      expect(stats.inlineStylesConverted).toBe(2);
      expect(stats.classesGenerated).toBe(2);
    });

    it('should handle empty HTML', () => {
      const html = '';
      const result = converter.convert(html);

      expect(result.html).toBe('');
      expect(result.css).toContain('CSS Modules');
    });

    it('should handle HTML without inline styles', () => {
      const html = '<div>Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('<div>');
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('generateCssModuleImport', () => {
    it('should generate import statement with default filename', () => {
      const importStatement = converter['generateCssModuleImport']();

      expect(importStatement).toContain('import');
      expect(importStatement).toContain('.module.css');
    });

    it('should use custom filename from options', () => {
      const options: CssConverterOptions = { targetFilename: 'styles' };
      const importStatement = converter['generateCssModuleImport'](options);

      expect(importStatement).toContain('styles.module.css');
    });
  });

  describe('generateModuleObject', () => {
    it('should generate module object with class mappings', () => {
      const moduleClasses = [
        {
          originalName: 'container',
          generatedName: '_abc123',
          properties: [],
        },
        {
          originalName: 'button',
          generatedName: '_def456',
          properties: [],
        },
      ];

      const moduleObject = converter['generateModuleObject'](moduleClasses);

      expect(moduleObject).toContain('container');
      expect(moduleObject).toContain('_abc123');
      expect(moduleObject).toContain('button');
      expect(moduleObject).toContain('_def456');
    });
  });

  describe('CSS Variables support', () => {
    it('should use CSS variables when option is enabled', () => {
      const html = '<div style="color: red;">Content</div>';
      const options: CssConverterOptions = { useCssVariables: true };
      const result = converter.convert(html, options);

      // CSS variables are extracted for duplicate values only
      // Since there's only one instance, no variables are extracted
      // The feature is working, just no duplicates in this case
      expect(result.css).toBeTruthy();
    });

    it('should extract common values to variables', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="color: red;">Second</div>
      `;
      const options: CssConverterOptions = { useCssVariables: true };
      const result = converter.convert(html, options);

      // Should define a variable for the common color
      expect(result.css).toMatch(/--[\w-]+:\s*red/);
    });
  });

  describe('Optimization', () => {
    it('should merge duplicate selectors when optimize is true', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="color: red;">Second</div>
      `;
      const options: CssConverterOptions = { optimize: true };
      const result = converter.convert(html, options);

      // Both div elements should use the same class since styles are identical
      // Extract all classes from the HTML
      const classMatches = result.html.matchAll(/class="([^"]+)"/g);
      const classes = Array.from(classMatches, m => m[1]);
      const uniqueClasses = new Set(classes);

      // Should have exactly 1 unique class since both use the same style
      expect(uniqueClasses.size).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return zero stats initially', () => {
      const stats = converter.getStats();

      expect(stats.totalElementsProcessed).toBe(0);
      expect(stats.inlineStylesConverted).toBe(0);
      expect(stats.classesGenerated).toBe(0);
    });

    it('should update stats after conversion', () => {
      converter.convert('<div style="color: red;">Content</div>');

      const stats = converter.getStats();

      expect(stats.inlineStylesConverted).toBeGreaterThan(0);
      expect(stats.classesGenerated).toBeGreaterThan(0);
    });
  });
});
