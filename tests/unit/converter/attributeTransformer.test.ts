/**
 * Attribute Transformer Tests - Milestone 4
 *
 * Test suite for HTML to React attribute transformation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AttributeTransformer } from '@/lib/converter/attributeTransformer';
import { AttributeTransformation } from '@/types/generator.types';

describe('AttributeTransformer', () => {
  let transformer: AttributeTransformer;

  beforeEach(() => {
    transformer = new AttributeTransformer();
  });

  describe('standard attribute transformations', () => {
    it('should transform class to className', () => {
      const result = transformer.transform('class', 'my-class');
      expect(result.name).toBe('className');
      expect(result.value).toBe('my-class');
      expect(result.type).toBe('direct');
    });

    it('should transform for to htmlFor', () => {
      const result = transformer.transform('for', 'input-id');
      expect(result.name).toBe('htmlFor');
      expect(result.value).toBe('input-id');
    });

    it('should transform tabindex to tabIndex', () => {
      const result = transformer.transform('tabindex', '0');
      expect(result.name).toBe('tabIndex');
      expect(result.value).toBe('0');
    });

    it('should transform readonly to readOnly', () => {
      const result = transformer.transform('readonly', '');
      expect(result.name).toBe('readOnly');
      // readonly with empty string should preserve the empty value as it's a direct attribute
      expect(result.value).toBe('');
    });

    it('should transform maxlength to maxLength', () => {
      const result = transformer.transform('maxlength', '100');
      expect(result.name).toBe('maxLength');
      expect(result.value).toBe('100');
    });

    it('should transform cellpadding to cellPadding', () => {
      const result = transformer.transform('cellpadding', '5');
      expect(result.name).toBe('cellPadding');
      expect(result.value).toBe('5');
    });

    it('should transform cellspacing to cellSpacing', () => {
      const result = transformer.transform('cellspacing', '0');
      expect(result.name).toBe('cellSpacing');
      expect(result.value).toBe('0');
    });

    it('should transform colspan to colSpan', () => {
      const result = transformer.transform('colspan', '2');
      expect(result.name).toBe('colSpan');
      expect(result.value).toBe('2');
    });

    it('should transform rowspan to rowSpan', () => {
      const result = transformer.transform('rowspan', '3');
      expect(result.name).toBe('rowSpan');
      expect(result.value).toBe('3');
    });

    it('should transform frameborder to frameBorder', () => {
      const result = transformer.transform('frameborder', '0');
      expect(result.name).toBe('frameBorder');
      expect(result.value).toBe('0');
    });

    it('should transform marginwidth to marginWidth', () => {
      const result = transformer.transform('marginwidth', '10');
      expect(result.name).toBe('marginWidth');
      expect(result.value).toBe('10');
    });

    it('should transform marginheight to marginHeight', () => {
      const result = transformer.transform('marginheight', '10');
      expect(result.name).toBe('marginHeight');
      expect(result.value).toBe('10');
    });

    it('should transform noresize to noResize', () => {
      const result = transformer.transform('noresize', '');
      expect(result.name).toBe('noResize');
      // noresize with empty string should preserve the empty value as it's a direct attribute
      expect(result.value).toBe('');
    });

    it('should transform enctype to encType', () => {
      const result = transformer.transform('enctype', 'multipart/form-data');
      expect(result.name).toBe('encType');
      expect(result.value).toBe('multipart/form-data');
    });

    it('should transform autocomplete to autoComplete', () => {
      const result = transformer.transform('autocomplete', 'off');
      expect(result.name).toBe('autoComplete');
      expect(result.value).toBe('off');
    });

    it('should transform autofocus to autoFocus', () => {
      const result = transformer.transform('autofocus', '');
      expect(result.name).toBe('autoFocus');
      expect(result.value).toBe(true);
    });
  });

  describe('event handler transformations', () => {
    it('should transform onclick to onClick', () => {
      const result = transformer.transform('onclick', 'handleClick()');
      expect(result.name).toBe('onClick');
      expect(result.value).toBe('handleClick()');
      expect(result.type).toBe('event');
    });

    it('should transform ondblclick to onDoubleClick', () => {
      const result = transformer.transform('ondblclick', 'handleDoubleClick()');
      expect(result.name).toBe('onDoubleClick');
      expect(result.value).toBe('handleDoubleClick()');
    });

    it('should transform onchange to onChange', () => {
      const result = transformer.transform('onchange', 'handleChange()');
      expect(result.name).toBe('onChange');
    });

    it('should transform onsubmit to onSubmit', () => {
      const result = transformer.transform('onsubmit', 'handleSubmit()');
      expect(result.name).toBe('onSubmit');
    });

    it('should transform onload to onLoad', () => {
      const result = transformer.transform('onload', 'handleLoad()');
      expect(result.name).toBe('onLoad');
    });

    it('should transform onerror to onError', () => {
      const result = transformer.transform('onerror', 'handleError()');
      expect(result.name).toBe('onError');
    });

    it('should transform onkeydown to onKeyDown', () => {
      const result = transformer.transform('onkeydown', 'handleKeyDown()');
      expect(result.name).toBe('onKeyDown');
    });

    it('should transform onkeyup to onKeyUp', () => {
      const result = transformer.transform('onkeyup', 'handleKeyUp()');
      expect(result.name).toBe('onKeyUp');
    });

    it('should transform onkeypress to onKeyPress', () => {
      const result = transformer.transform('onkeypress', 'handleKeyPress()');
      expect(result.name).toBe('onKeyPress');
    });

    it('should transform onmouseover to onMouseOver', () => {
      const result = transformer.transform('onmouseover', 'handleMouseOver()');
      expect(result.name).toBe('onMouseOver');
    });

    it('should transform onmouseout to onMouseOut', () => {
      const result = transformer.transform('onmouseout', 'handleMouseOut()');
      expect(result.name).toBe('onMouseOut');
    });

    it('should transform onmousemove to onMouseMove', () => {
      const result = transformer.transform('onmousemove', 'handleMouseMove()');
      expect(result.name).toBe('onMouseMove');
    });

    it('should transform onmousedown to onMouseDown', () => {
      const result = transformer.transform('onmousedown', 'handleMouseDown()');
      expect(result.name).toBe('onMouseDown');
    });

    it('should transform onmouseup to onMouseUp', () => {
      const result = transformer.transform('onmouseup', 'handleMouseUp()');
      expect(result.name).toBe('onMouseUp');
    });

    it('should transform onfocus to onFocus', () => {
      const result = transformer.transform('onfocus', 'handleFocus()');
      expect(result.name).toBe('onFocus');
    });

    it('should transform onblur to onBlur', () => {
      const result = transformer.transform('onblur', 'handleBlur()');
      expect(result.name).toBe('onBlur');
    });

    it('should transform onscroll to onScroll', () => {
      const result = transformer.transform('onscroll', 'handleScroll()');
      expect(result.name).toBe('onScroll');
    });

    it('should transform oninput to onInput', () => {
      const result = transformer.transform('oninput', 'handleInput()');
      expect(result.name).toBe('onInput');
    });

    it('should transform ontouchstart to onTouchStart', () => {
      const result = transformer.transform('ontouchstart', 'handleTouchStart()');
      expect(result.name).toBe('onTouchStart');
    });

    it('should transform ontouchend to onTouchEnd', () => {
      const result = transformer.transform('ontouchend', 'handleTouchEnd()');
      expect(result.name).toBe('onTouchEnd');
    });

    it('should transform ontouchmove to onTouchMove', () => {
      const result = transformer.transform('ontouchmove', 'handleTouchMove()');
      expect(result.name).toBe('onTouchMove');
    });
  });

  describe('boolean attribute transformations', () => {
    it('should transform disabled boolean attribute', () => {
      const result = transformer.transform('disabled', '');
      expect(result.name).toBe('disabled');
      expect(result.value).toBe(true);
      expect(result.type).toBe('boolean');
    });

    it('should transform checked boolean attribute', () => {
      const result = transformer.transform('checked', '');
      expect(result.name).toBe('checked');
      expect(result.value).toBe(true);
    });

    it('should transform required boolean attribute', () => {
      const result = transformer.transform('required', '');
      expect(result.name).toBe('required');
      expect(result.value).toBe(true);
    });

    it('should transform multiple boolean attribute', () => {
      const result = transformer.transform('multiple', '');
      expect(result.name).toBe('multiple');
      expect(result.value).toBe(true);
    });

    it('should transform muted boolean attribute', () => {
      const result = transformer.transform('muted', '');
      expect(result.name).toBe('muted');
      expect(result.value).toBe(true);
    });

    it('should transform loop boolean attribute', () => {
      const result = transformer.transform('loop', '');
      expect(result.name).toBe('loop');
      expect(result.value).toBe(true);
    });

    it('should transform controls boolean attribute', () => {
      const result = transformer.transform('controls', '');
      expect(result.name).toBe('controls');
      expect(result.value).toBe(true);
    });

    it('should transform autoplay boolean attribute', () => {
      const result = transformer.transform('autoplay', '');
      expect(result.name).toBe('autoPlay');
      expect(result.value).toBe(true);
    });

    it('should transform default boolean attribute', () => {
      const result = transformer.transform('default', '');
      expect(result.name).toBe('default');
      expect(result.value).toBe(true);
    });

    it('should transform hidden boolean attribute', () => {
      const result = transformer.transform('hidden', '');
      expect(result.name).toBe('hidden');
      expect(result.value).toBe(true);
    });

    it('should handle boolean attribute with value', () => {
      const result = transformer.transform('disabled', 'disabled');
      expect(result.name).toBe('disabled');
      expect(result.value).toBe(true);
    });
  });

  describe('aria attribute handling', () => {
    it('should preserve aria-label', () => {
      const result = transformer.transform('aria-label', 'Close dialog');
      expect(result.name).toBe('aria-label');
      expect(result.value).toBe('Close dialog');
    });

    it('should preserve aria-describedby', () => {
      const result = transformer.transform('aria-describedby', 'help-text');
      expect(result.name).toBe('aria-describedby');
      expect(result.value).toBe('help-text');
    });

    it('should preserve aria-hidden', () => {
      const result = transformer.transform('aria-hidden', 'true');
      expect(result.name).toBe('aria-hidden');
      expect(result.value).toBe('true');
    });

    it('should preserve aria-expanded', () => {
      const result = transformer.transform('aria-expanded', 'false');
      expect(result.name).toBe('aria-expanded');
      expect(result.value).toBe('false');
    });

    it('should preserve aria-live', () => {
      const result = transformer.transform('aria-live', 'polite');
      expect(result.name).toBe('aria-live');
      expect(result.value).toBe('polite');
    });

    it('should preserve aria-atomic', () => {
      const result = transformer.transform('aria-atomic', 'true');
      expect(result.name).toBe('aria-atomic');
      expect(result.value).toBe('true');
    });

    it('should preserve aria-busy', () => {
      const result = transformer.transform('aria-busy', 'false');
      expect(result.name).toBe('aria-busy');
      expect(result.value).toBe('false');
    });

    it('should preserve aria-controls', () => {
      const result = transformer.transform('aria-controls', 'menu-id');
      expect(result.name).toBe('aria-controls');
      expect(result.value).toBe('menu-id');
    });

    it('should preserve aria-current', () => {
      const result = transformer.transform('aria-current', 'page');
      expect(result.name).toBe('aria-current');
      expect(result.value).toBe('page');
    });

    it('should preserve aria-haspopup', () => {
      const result = transformer.transform('aria-haspopup', 'true');
      expect(result.name).toBe('aria-haspopup');
      expect(result.value).toBe('true');
    });
  });

  describe('data attribute handling', () => {
    it('should preserve data-id', () => {
      const result = transformer.transform('data-id', '123');
      expect(result.name).toBe('data-id');
      expect(result.value).toBe('123');
    });

    it('should preserve data-testid', () => {
      const result = transformer.transform('data-testid', 'test-button');
      expect(result.name).toBe('data-testid');
      expect(result.value).toBe('test-button');
    });

    it('should preserve data-value', () => {
      const result = transformer.transform('data-value', 'some-value');
      expect(result.name).toBe('data-value');
      expect(result.value).toBe('some-value');
    });

    it('should preserve data-custom-attribute', () => {
      const result = transformer.transform('data-custom-attribute', 'value');
      expect(result.name).toBe('data-custom-attribute');
      expect(result.value).toBe('value');
    });

    it('should preserve multiple data attributes', () => {
      const attrs = ['data-id', 'data-name', 'data-value'];
      attrs.forEach((attr) => {
        const result = transformer.transform(attr, 'test');
        expect(result.name).toBe(attr);
        expect(result.value).toBe('test');
      });
    });
  });

  describe('style attribute transformation', () => {
    it('should transform style attribute to object notation', () => {
      const result = transformer.transform('style', 'color: red; background: blue;');
      expect(result.name).toBe('style');
      expect(result.type).toBe('style');
      expect(typeof result.value).toBe('object');
    });

    it('should convert CSS property names to camelCase', () => {
      const result = transformer.transform(
        'style',
        'background-color: blue; margin-top: 10px; padding-bottom: 5px;'
      );
      expect(result.value).toHaveProperty('backgroundColor', 'blue');
      expect(result.value).toHaveProperty('marginTop', '10px');
      expect(result.value).toHaveProperty('paddingBottom', '5px');
    });

    it('should handle multiple style properties', () => {
      const result = transformer.transform(
        'style',
        'color: red; font-size: 14px; font-weight: bold;'
      );
      expect(result.value).toHaveProperty('color', 'red');
      expect(result.value).toHaveProperty('fontSize', '14px');
      expect(result.value).toHaveProperty('fontWeight', 'bold');
    });

    it('should handle px values', () => {
      const result = transformer.transform('style', 'width: 100px; height: 200px;');
      expect(result.value).toHaveProperty('width', '100px');
      expect(result.value).toHaveProperty('height', '200px');
    });

    it('should handle unitless values', () => {
      const result = transformer.transform('style', 'opacity: 0.5; z-index: 10;');
      expect(result.value).toHaveProperty('opacity', '0.5');
      expect(result.value).toHaveProperty('zIndex', '10');
    });

    it('should handle shorthand properties', () => {
      const result = transformer.transform('style', 'margin: 10px 20px;');
      expect(result.value).toHaveProperty('margin', '10px 20px');
    });
  });

  describe('attributes to remove', () => {
    it('should remove data-reactid attribute', () => {
      const result = transformer.transform('data-reactid', '123');
      expect(result.type).toBe('remove');
    });

    it('should remove data-reactroot attribute', () => {
      const result = transformer.transform('data-reactroot', 'true');
      expect(result.type).toBe('remove');
    });

    it('should remove reactid attribute', () => {
      const result = transformer.transform('reactid', '123');
      expect(result.type).toBe('remove');
    });
  });

  describe('custom transformations', () => {
    it('should add custom transformation rule', () => {
      transformer.addCustomRule('x-custom', 'xCustomer', (value) => value.toUpperCase());
      const result = transformer.transform('x-custom', 'test');
      expect(result.name).toBe('xCustomer');
      expect(result.value).toBe('TEST');
    });

    it('should allow overriding default transformations', () => {
      transformer.addCustomRule('class', 'customClassName', (v) => `prefix-${v}`);
      const result = transformer.transform('class', 'my-class');
      expect(result.name).toBe('customClassName');
      expect(result.value).toBe('prefix-my-class');
    });

    it('should remove custom transformation rule', () => {
      transformer.addCustomRule('x-test', 'xTest', (v) => v);
      transformer.removeCustomRule('x-test');
      const result = transformer.transform('x-test', 'value');
      // Should fall back to default behavior
      expect(result.name).toBe('x-test');
    });
  });

  describe('edge cases', () => {
    it('should handle empty attribute value', () => {
      const result = transformer.transform('data-empty', '');
      expect(result.name).toBe('data-empty');
      expect(result.value).toBe('');
    });

    it('should handle attribute with special characters', () => {
      const result = transformer.transform('data-json', '{"key": "value"}');
      expect(result.name).toBe('data-json');
      expect(result.value).toBe('{"key": "value"}');
    });

    it('should handle numeric attribute values', () => {
      const result = transformer.transform('tabindex', '5');
      expect(result.value).toBe('5');
    });

    it('should handle mixed case attribute names', () => {
      const result = transformer.transform('dataCaseMixed', 'value');
      expect(result.name).toBe('dataCaseMixed');
    });

    it('should handle unknown attributes', () => {
      const result = transformer.transform('unknown-attr', 'value');
      expect(result.name).toBe('unknown-attr');
      expect(result.value).toBe('value');
    });

    it('should handle style with trailing semicolon', () => {
      const result = transformer.transform('style', 'color: red;');
      expect(result.value).toHaveProperty('color', 'red');
    });

    it('should handle style without semicolons', () => {
      const result = transformer.transform('style', 'color:red;font-size:14px');
      expect(result.value).toHaveProperty('color', 'red');
      expect(result.value).toHaveProperty('fontSize', '14px');
    });

    it('should handle empty style attribute', () => {
      const result = transformer.transform('style', '');
      expect(result.value).toEqual({});
    });
  });

  describe('batch transformation', () => {
    it('should transform multiple attributes at once', () => {
      const attributes = {
        class: 'container',
        onclick: 'handleClick()',
        disabled: '',
        'aria-label': 'Button',
        style: 'color: red;',
      };
      const results = transformer.transformBatch(attributes);
      expect(results).toHaveLength(5);
      expect(results).toContainEqual({ name: 'className', value: 'container', type: 'direct' });
      expect(results).toContainEqual({ name: 'onClick', value: 'handleClick()', type: 'event' });
      expect(results).toContainEqual({ name: 'disabled', value: true, type: 'boolean' });
      expect(results).toContainEqual({ name: 'aria-label', value: 'Button', type: 'direct' });
    });

    it('should filter out removed attributes in batch', () => {
      const attributes = {
        class: 'container',
        'data-reactid': '123',
      };
      const results = transformer.transformBatch(attributes);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('className');
    });
  });
});
