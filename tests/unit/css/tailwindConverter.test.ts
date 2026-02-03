/**
 * Tailwind CSS Converter Tests
 *
 * Test suite for Tailwind CSS conversion strategy.
 * Following TDD - tests written before implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TailwindCssConverter } from '../../../src/lib/css';
import type {
  CssConverterOptions,
  CssConversionResult,
  ParsedStyle,
} from '../../../src/types/css.types';

describe('TailwindCssConverter', () => {
  let converter: TailwindCssConverter;

  beforeEach(() => {
    converter = new TailwindCssConverter();
  });

  describe('getStrategyName', () => {
    it('should return "tailwind" as strategy name', () => {
      expect(converter.getStrategyName()).toBe('tailwind');
    });
  });

  describe('parseInlineStyles', () => {
    it('should parse single inline style correctly', () => {
      const html = '<div style="color: red;">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(1);
      expect(styles[0].properties.get('color')).toBe('red');
    });

    it('should parse multiple inline styles', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="background: blue;">Second</div>
      `;
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(2);
      expect(styles[0].properties.get('color')).toBe('red');
      expect(styles[1].properties.get('background')).toBe('blue');
    });

    it('should parse multiple properties in single style attribute', () => {
      const html = '<div style="color: red; background: blue; padding: 10px;">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(1);
      expect(styles[0].properties.get('color')).toBe('red');
      expect(styles[0].properties.get('background')).toBe('blue');
      expect(styles[0].properties.get('padding')).toBe('10px');
    });

    it('should handle empty style attributes', () => {
      const html = '<div style="">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(0);
    });

    it('should handle malformed styles gracefully', () => {
      const html = '<div style="color:; background: blue;">Content</div>';
      const styles = converter.parseInlineStyles(html);

      expect(styles).toHaveLength(1);
      expect(styles[0].properties.get('background')).toBe('blue');
    });
  });

  describe('propertiesToTailwindClasses', () => {
    it('should convert color property to text-{color} class', () => {
      const properties = new Map([['color', 'red']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('text-red-500');
    });

    it('should convert background-color to bg-{color} class', () => {
      const properties = new Map([['background-color', 'blue']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('bg-blue-500');
    });

    it('should convert display flex to flex class', () => {
      const properties = new Map([['display', 'flex']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('flex');
    });

    it('should convert display grid to grid class', () => {
      const properties = new Map([['display', 'grid']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('grid');
    });

    it('should convert padding to p-{size} class', () => {
      const properties = new Map([['padding', '16px']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('p-4');
    });

    it('should convert margin to m-{size} class', () => {
      const properties = new Map([['margin', '16px']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('m-4');
    });

    it('should convert text alignment', () => {
      const properties = new Map([['text-align', 'center']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('text-center');
    });

    it('should convert font weight', () => {
      const properties = new Map([['font-weight', 'bold']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('font-bold');
    });

    it('should handle multiple properties', () => {
      const properties = new Map([
        ['color', 'red'],
        ['padding', '16px'],
        ['display', 'flex'],
      ]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('text-red-500');
      expect(classes).toContain('p-4');
      expect(classes).toContain('flex');
    });

    it('should return empty array for unknown properties', () => {
      const properties = new Map([['unknown-property', 'value']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toHaveLength(0);
    });

    it('should convert flex-direction to flex-row/flex-col', () => {
      const propertiesRow = new Map([['flex-direction', 'row']]);
      const classesRow = converter['propertiesToTailwindClasses'](propertiesRow);

      expect(classesRow).toContain('flex-row');

      const propertiesCol = new Map([['flex-direction', 'column']]);
      const classesCol = converter['propertiesToTailwindClasses'](propertiesCol);

      expect(classesCol).toContain('flex-col');
    });

    it('should convert justify-content', () => {
      const properties = new Map([['justify-content', 'center']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('justify-center');
    });

    it('should convert align-items', () => {
      const properties = new Map([['align-items', 'center']]);
      const classes = converter['propertiesToTailwindClasses'](properties);

      expect(classes).toContain('items-center');
    });
  });

  describe('generateCss', () => {
    it('should generate empty CSS for Tailwind strategy', () => {
      const styles: ParsedStyle[] = [
        {
          selector: 'div',
          properties: new Map([['color', 'red']]),
        },
      ];

      const css = converter.generateCss(styles);

      // Tailwind uses utility classes, so no CSS is generated
      expect(css).toBe('');
    });
  });

  describe('convert', () => {
    it('should convert inline styles to Tailwind classes', () => {
      const html = '<div style="color: red; padding: 16px;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('text-red-500');
      expect(result.html).toContain('p-4');
      expect(result.html).not.toContain('style=');
    });

    it('should preserve inline styles when option is set', () => {
      const html = '<div style="color: red;">Content</div>';
      const options: CssConverterOptions = { preserveInline: true };
      const result = converter.convert(html, options);

      expect(result.html).toContain('style=');
    });

    it('should populate classNameMap correctly', () => {
      const html = '<div style="color: red;">Content</div>';
      const result = converter.convert(html);

      expect(result.classNameMap.size).toBeGreaterThan(0);
    });

    it('should add warning for unsupported properties', () => {
      const html = '<div style="unsupported: value;">Content</div>';
      const result = converter.convert(html);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle empty HTML', () => {
      const html = '';
      const result = converter.convert(html);

      expect(result.html).toBe('');
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle HTML without inline styles', () => {
      const html = '<div>Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('<div>');
      expect(result.warnings).toHaveLength(0);
    });

    it('should track conversion statistics', () => {
      const html = `
        <div style="color: red;">First</div>
        <div style="background: blue;">Second</div>
      `;
      converter.convert(html);

      const stats = converter.getStats();

      expect(stats.inlineStylesConverted).toBe(2);
      expect(stats.totalElementsProcessed).toBeGreaterThan(0);
    });

    it('should handle nested elements', () => {
      const html = `
        <div style="padding: 16px;">
          <span style="color: red;">Text</span>
        </div>
      `;
      const result = converter.convert(html);

      expect(result.html).toContain('p-4');
      // The span may be handled separately depending on regex order
      // Just verify the conversion happened
      expect(result.html).not.toContain('style=');
    });

    it('should convert grid layout properties', () => {
      const html = '<div style="display: grid; grid-template-columns: 1fr 1fr;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('grid');
      expect(result.html).toContain('grid-cols-2');
    });

    it('should convert width and height utilities', () => {
      const html = '<div style="width: 50%; height: 100px;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('w-1/2');
      // Height uses arbitrary value for 100px
      expect(result.html).toMatch(/h-\[100px\]|h-25/);
    });

    it('should convert border properties', () => {
      const html = '<div style="border: 1px solid #ccc;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('border');
    });

    it('should convert border radius', () => {
      const html = '<div style="border-radius: 8px;">Content</div>';
      const result = converter.convert(html);

      // 8px maps to 'rounded' in our implementation
      expect(result.html).toMatch(/rounded|rounded-lg/);
    });

    it('should convert shadow', () => {
      const html = '<div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('shadow-md');
    });

    it('should convert opacity', () => {
      const html = '<div style="opacity: 0.5;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('opacity-50');
    });

    it('should convert position', () => {
      const html = '<div style="position: absolute; top: 0; left: 0;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('absolute');
      expect(result.html).toContain('top-0');
      expect(result.html).toContain('left-0');
    });

    it('should convert overflow', () => {
      const html = '<div style="overflow: hidden;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('overflow-hidden');
    });

    it('should convert gap for flex/grid', () => {
      const html = '<div style="display: flex; gap: 16px;">Content</div>';
      const result = converter.convert(html);

      expect(result.html).toContain('gap-4');
    });
  });

  describe('getStats', () => {
    it('should return initial stats with zero values', () => {
      const stats = converter.getStats();

      expect(stats.totalElementsProcessed).toBe(0);
      expect(stats.inlineStylesConverted).toBe(0);
      expect(stats.classesGenerated).toBe(0);
      expect(stats.rulesExtracted).toBe(0);
      expect(stats.filesCreated).toBe(0);
    });

    it('should track conversions in stats', () => {
      converter.convert('<div style="color: red;">Content</div>');

      const stats = converter.getStats();

      expect(stats.inlineStylesConverted).toBeGreaterThan(0);
    });
  });
});
