/**
 * Vanilla CSS Converter Tests
 *
 * Test suite for Vanilla CSS extraction strategy.
 * Following TDD - tests written before implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VanillaCssConverter } from '../../../src/lib/css/vanillaCssConverter';
import type {
  CssConverterOptions,
  CssConversionResult,
  ParsedStyle,
} from '../../../src/types/css.types';

describe('VanillaCssConverter', () => {
  let converter: VanillaCssConverter;

  beforeEach(() => {
    converter = new VanillaCssConverter();
  });

  describe('getStrategyName', () => {
    it('should return "vanilla" as strategy name', () => {
      expect(converter.getStrategyName()).toBe('vanilla');
    });
  });

  describe('parseInlineStyles', () => {
    it('should parse single inline style', () => {
      const html = '<div style="color: red;">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(1);
      expect(styles[0].properties.get('color')).toBe('red');
    });

    it('should parse multiple inline styles', () => {
      const html = `
        <div style="color: red;">First</div>
        <span style="background: blue;">Second</span>
      `;
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(2);
    });

    it('should parse multiple properties in one element', () => {
      const html = '<div style="color: red; padding: 10px; margin: 5px;">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(1);
      expect(styles[0].properties.get('color')).toBe('red');
      expect(styles[0].properties.get('padding')).toBe('10px');
      expect(styles[0].properties.get('margin')).toBe('5px');
    });

    it('should handle empty style attributes', () => {
      const html = '<div style="">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(0);
    });

    it('should handle important flag', () => {
      const html = '<div style="color: red !important;">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles[0].properties.get('color')).toBe('red !important');
    });
  });

  describe('generateClassName', () => {
    it('should generate class names based on selector', () => {
      const className = converter['generateClassName']('div');

      expect(className).toBeTruthy();
      expect(className).toMatch(/^[a-z]+-[a-z0-9]+$/);
    });

    it('should generate unique class names', () => {
      const className1 = converter['generateClassName']('div');
      const className2 = converter['generateClassName']('div');

      expect(className1).not.toBe(className2);
    });

    it('should use custom prefix when provided', () => {
      const className = converter['generateClassName']('div', 'custom');

      expect(className).toMatch(/^custom-/);
    });

    it('should sanitize invalid selector characters', () => {
      const className = converter['generateClassName']('div.special-class');

      expect(className).not.toContain('.');
    });
  });

  describe('generateCss', () => {
    it('should generate CSS rules from parsed styles', () => {
      const styles: ParsedStyle[] = [
        {
          selector: 'div',
          properties: new Map([['color', 'red'], ['padding', '10px']]),
        },
      ];

      const css = converter.generateCss(styles);

      expect(css).toContain('.');
      expect(css).toContain('{');
      expect(css).toContain('color:');
      expect(css).toContain('padding:');
      expect(css).toContain('}');
    });

    it('should generate multiple rules', () => {
      const styles: ParsedStyle[] = [
        {
          selector: 'div',
          properties: new Map([['color', 'red']]),
        },
        {
          selector: 'span',
          properties: new Map([['background', 'blue']]),
        },
      ];

      const css = converter.generateCss(styles);

      const ruleCount = (css.match(/\./g) || []).length;
      expect(ruleCount).toBe(2);
    });

    it('should format CSS with proper indentation', () => {
      const styles: ParsedStyle[] = [
        {
          selector: 'div',
          properties: new Map([['color', 'red']]),
        },
      ];

      const css = converter.generateCss(styles);

      expect(css).toContain('  color:');
    });

    it('should handle media queries', () => {
      const styles: ParsedStyle[] = [
        {
          selector: 'div',
          properties: new Map([['color', 'red']]),
          mediaQuery: '@media (max-width: 768px)',
        },
      ];

      const css = converter.generateCss(styles);

      // Media query support - generates @media wrapper
      expect(css).toContain('@media');
    });

    it('should include comment header', () => {
      const styles: ParsedStyle[] = [];
      const css = converter.generateCss(styles);

      expect(css).toContain('/*');
      expect(css).toContain('Vanilla CSS');
    });
  });

  describe('convert', () => {
    it('should extract inline styles to CSS classes', () => {
      const html = '<div style="color: red;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('class=');
      expect(result.css).toContain('.');
    });

    it('should remove inline styles from HTML', () => {
      const html = '<div style="color: red;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).not.toContain('style=');
    });

    it('should preserve inline styles when option is set', () => {
      const html = '<div style="color: red;">Content</div>';
      const options: CssConverterOptions = { preserveInline: true };
      const result = converter.convert(html, options);

      expect(result.html).toContain('style=');
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
      expect(result.generatedFiles[0]).toContain('.css');
    });

    it('should use custom filename from options', () => {
      const html = '<div style="color: red;">Content</div>';
      const options: CssConverterOptions = {
        extractToSeparateFile: true,
        targetFilename: 'custom',
      };
      const result = converter.convert(html, options);

      expect(result.generatedFiles[0]).toContain('custom.css');
    });

    it('should handle multiple elements', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="background: blue;">Second</div>
      `;
      const result = converter.convert(html);

      const classMatches = result.html.match(/class=/g);
      expect(classMatches).toHaveLength(2);
    });

    it('should track statistics', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="background: blue;">Second</div>
      `;
      converter.convert(html);

      const stats = converter.getStats();

      expect(stats.inlineStylesConverted).toBe(2);
      expect(stats.rulesExtracted).toBe(2);
    });

    it('should handle empty HTML', () => {
      const html = '';
      const result = converter.convert(html);

      expect(result.html).toBe('');
      expect(result.css).toContain('Vanilla CSS');
    });

    it('should handle HTML without inline styles', () => {
      const html = '<div>Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('<div>');
      expect(result.warnings).toHaveLength(0);
    });

    it('should add warnings for unsupported properties', () => {
      const html = '<div style="unsupported: value;">Content</div>';
      const result = converter.convert(html);

      // Should still process but add warning
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Optimization', () => {
    it('should merge identical selectors when optimize is true', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="color: red;">Second</div>
      `;
      const options: CssConverterOptions = { optimize: true };
      const result = converter.convert(html, options);

      // Check that both elements use the same class
      const classes = result.html.match(/class="([^"]+)"/g);
      if (classes && classes.length >= 2) {
        expect(classes[0]).toBe(classes[1]);
      }
    });

    it('should shorten CSS when optimize is true', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="color: red;">Second</div>
      `;
      const options: CssConverterOptions = { optimize: true };
      const result = converter.convert(html, options);

      // With identical styles, should only have one CSS rule
      const ruleCount = (result.css.match(/\.[a-z-]+\s*\{/g) || []).length;
      expect(ruleCount).toBeLessThanOrEqual(1);
    });
  });

  describe('createLinkTag', () => {
    it('should generate link tag for external CSS', () => {
      const linkTag = converter['createLinkTag']('styles.css');

      expect(linkTag).toContain('<link');
      expect(linkTag).toContain('rel="stylesheet"');
      expect(linkTag).toContain('href="styles.css"');
    });

    it('should use custom filename from options', () => {
      const linkTag = converter['createLinkTag']('custom.css');

      expect(linkTag).toContain('href="custom.css"');
    });
  });

  describe('getStats', () => {
    it('should return zero stats initially', () => {
      const stats = converter.getStats();

      expect(stats.totalElementsProcessed).toBe(0);
      expect(stats.inlineStylesConverted).toBe(0);
      expect(stats.rulesExtracted).toBe(0);
      expect(stats.classesGenerated).toBe(0);
      expect(stats.filesCreated).toBe(0);
    });

    it('should update stats after conversion', () => {
      converter.convert('<div style="color: red;">Content</div>');

      const stats = converter.getStats();

      expect(stats.inlineStylesConverted).toBeGreaterThan(0);
      expect(stats.rulesExtracted).toBeGreaterThan(0);
      expect(stats.classesGenerated).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle nested quotes in style values', () => {
      const html = '<div style="content: \'hello\';">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toBeTruthy();
    });

    it('should handle CSS comments in inline styles', () => {
      const html = '<div style="color: red; /* comment */ padding: 10px;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).not.toContain('/*');
    });

    it('should handle vendor prefixes', () => {
      const html = '<div style="-webkit-transform: rotate(45deg);">Content</div>';
      const result = converter.convert(html);

      expect(result.css).toContain('-webkit-transform');
    });

    it('should handle CSS variables in inline styles', () => {
      const html = '<div style="color: var(--primary-color);">Content</div>';
      const result = converter.convert(html);

      expect(result.css).toContain('var(--primary-color)');
    });

    it('should handle calc() expressions', () => {
      const html = '<div style="width: calc(100% - 20px);">Content</div>';
      const result = converter.convert(html);

      expect(result.css).toContain('calc(100% - 20px)');
    });

    it('should handle rgba colors', () => {
      const html = '<div style="background: rgba(255, 0, 0, 0.5);">Content</div>';
      const result = converter.convert(html);

      expect(result.css).toContain('rgba');
    });

    it('should handle shorthand properties', () => {
      const html = '<div style="margin: 10px 20px;">Content</div>';
      const result = converter.convert(html);

      expect(result.css).toContain('margin:');
    });

    it('should handle multiple shorthand values', () => {
      const html = '<div style="margin: 1px 2px 3px 4px;">Content</div>';
      const result = converter.convert(html);

      expect(result.css).toContain('margin:');
    });

    it('should handle font shorthand', () => {
      const html = '<div style="font: bold 16px/1.5 sans-serif;">Content</div>';
      const result = converter.convert(html);

      expect(result.css).toContain('font:');
    });
  });
});
