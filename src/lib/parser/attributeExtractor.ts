/**
 * Attribute Extractor
 *
 * Extracts and transforms HTML attributes into React-compatible format.
 * Handles attribute aliases, event handlers, styles, and special cases.
 */

import {
  ParsedAttributes,
  AttributeExtractionResult,
  REACT_ATTRIBUTE_ALIASES,
  BOOLEAN_ATTRIBUTES,
  EVENT_HANDLER_PATTERNS,
  VOID_ELEMENTS,
} from '@/types/parser.types';

/**
 * Attribute Extractor class
 *
 * Handles the extraction and transformation of HTML attributes
 * into React-compatible format.
 */
export class AttributeExtractor {
  /**
   * Extract all attributes from an element
   *
   * @param element - DOM element to extract attributes from
   * @returns Extracted and transformed attributes
   */
  extract(element: Element): ParsedAttributes {
    const result: ParsedAttributes = {
      html: {},
      events: [],
    };

    // Process all attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      const { name, value } = attr;

      this.processAttribute(name, value, result);
    }

    // Check for dangerouslySetInnerHTML
    if (element.innerHTML && element.children.length === 0) {
      result.hasDangerHtml = true;
    }

    return result;
  }

  /**
   * Process a single attribute
   */
  private processAttribute(
    name: string,
    value: string,
    result: ParsedAttributes
  ): void {
    // Check for event handlers
    if (this.isEventHandler(name)) {
      result.events.push({
        type: name,
        handler: value,
      });
      return;
    }

    // Handle style attribute
    if (name === 'style') {
      result.style = this.parseStyle(value);
      return;
    }

    // Handle class attribute - convert to className
    if (name === 'class') {
      result.className = value;
      // Don't store class in html attributes
      return;
    }

    // Apply React attribute aliases
    const reactName = REACT_ATTRIBUTE_ALIASES[name.toLowerCase()] || name;

    // Handle boolean attributes
    if (BOOLEAN_ATTRIBUTES.has(name.toLowerCase())) {
      result.html[reactName] = value === '' ? true : value;
      return;
    }

    // Handle data attributes (preserve as-is)
    if (name.startsWith('data-')) {
      result.html[name] = value;
      return;
    }

    // Handle aria attributes (preserve as-is)
    if (name.startsWith('aria-')) {
      result.html[name] = value;
      return;
    }

    // Standard attribute
    result.html[reactName] = value;
  }

  /**
   * Check if an attribute name is an event handler
   */
  private isEventHandler(name: string): boolean {
    // Check for React-style event handlers (onClick, onChange, etc.)
    if (EVENT_HANDLER_PATTERNS.some(pattern => pattern.test(name))) {
      return true;
    }

    // Check for HTML-style event handlers (onclick, onchange, etc.)
    // HTML uses lowercase event attribute names
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith('on') && lowerName.length > 2) {
      // After "on", the next character should be a letter
      const thirdChar = lowerName.charAt(2);
      if (thirdChar >= 'a' && thirdChar <= 'z') {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse inline styles into an object
   *
   * @param styleValue - CSS style string
   * @returns Parsed style object
   */
  private parseStyle(styleValue: string): Record<string, string> {
    const styles: Record<string, string> = {};

    if (!styleValue || styleValue.trim() === '') {
      return styles;
    }

    // Split by semicolon and process each declaration
    const declarations = styleValue.split(';').filter(d => d.trim());

    for (const declaration of declarations) {
      const colonIndex = declaration.indexOf(':');

      if (colonIndex === -1) {
        continue;
      }

      const property = declaration.slice(0, colonIndex).trim();
      const value = declaration.slice(colonIndex + 1).trim();

      // Convert CSS property to camelCase for React
      const camelProperty = this.cssToCamelCase(property);
      styles[camelProperty] = value;
    }

    return styles;
  }

  /**
   * Convert CSS property name to camelCase
   *
   * @param property - CSS property name (kebab-case)
   * @returns camelCase property name
   */
  private cssToCamelCase(property: string): string {
    return property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Extract attributes with full result information
   *
   * @param element - DOM element to extract from
   * @returns Complete extraction result
   */
  extractWithResult(element: Element): AttributeExtractionResult {
    const attributes = this.extract(element);
    const isVoid = VOID_ELEMENTS.has(element.tagName.toLowerCase());
    const isFragment = false;

    // Get warnings from attributes if present
    const warnings = (attributes as any).warnings || [];

    return {
      attributes,
      isVoid,
      isFragment,
      warnings,
    };
  }

  /**
   * Check if an element has a specific attribute
   *
   * @param element - DOM element to check
   * @param attributeName - Name of the attribute
   * @returns True if attribute exists
   */
  has(element: Element, attributeName: string): boolean {
    return element.hasAttribute(attributeName);
  }

  /**
   * Get a single attribute value with React naming
   *
   * @param element - DOM element to get from
   * @param attributeName - Name of the attribute
   * @returns Attribute value or null
   */
  get(element: Element, attributeName: string): string | null {
    // Check for React alias
    const reactName = REACT_ATTRIBUTE_ALIASES[attributeName.toLowerCase()] || attributeName;

    if (reactName === 'className') {
      return element.getAttribute('class');
    }

    return element.getAttribute(attributeName);
  }

  /**
   * Get all class names from an element
   *
   * @param element - DOM element to get classes from
   * @returns Array of class names
   */
  getClasses(element: Element): string[] {
    const className = element.getAttribute('class');
    if (!className) {
      return [];
    }

    return className.split(/\s+/).filter(c => c.trim().length > 0);
  }

  /**
   * Get all data attributes from an element
   *
   * @param element - DOM element to get data attributes from
   * @returns Object containing all data attributes
   */
  getDataAttributes(element: Element): Record<string, string> {
    const dataAttrs: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const { name, value } = element.attributes[i];

      if (name.startsWith('data-')) {
        // Remove 'data-' prefix and convert to camelCase
        const camelName = name
          .slice(5)
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

        dataAttrs[camelName] = value;
      }
    }

    return dataAttrs;
  }

  /**
   * Get all ARIA attributes from an element
   *
   * @param element - DOM element to get ARIA attributes from
   * @returns Object containing all ARIA attributes
   */
  getAriaAttributes(element: Element): Record<string, string> {
    const ariaAttrs: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const { name, value } = element.attributes[i];

      if (name.startsWith('aria-')) {
        ariaAttrs[name] = value;
      }
    }

    return ariaAttrs;
  }

  /**
   * Merge multiple attribute sets
   *
   * @param attributes - Array of attribute sets to merge
   * @returns Merged attributes
   */
  merge(...attributes: ParsedAttributes[]): ParsedAttributes {
    const merged: ParsedAttributes = {
      html: {},
      events: [],
    };

    for (const attrs of attributes) {
      // Merge HTML attributes
      Object.assign(merged.html, attrs.html);

      // Merge style
      if (attrs.style) {
        merged.style = { ...merged.style, ...attrs.style };
      }

      // Merge className
      if (attrs.className) {
        const existingClasses = merged.className ? merged.className.split(' ').filter(Boolean) : [];
        const newClasses = attrs.className.split(' ').filter(Boolean);
        merged.className = [...existingClasses, ...newClasses].join(' ');
      }

      // Merge events
      merged.events.push(...attrs.events);
    }

    // Set hasDangerHtml if any source has it
    merged.hasDangerHtml = attributes.some(a => a.hasDangerHtml);

    return merged;
  }

  /**
   * Clone attributes
   *
   * @param attributes - Attributes to clone
   * @returns Cloned attributes
   */
  clone(attributes: ParsedAttributes): ParsedAttributes {
    return {
      html: { ...attributes.html },
      events: [...attributes.events],
      style: attributes.style ? { ...attributes.style } : undefined,
      className: attributes.className,
      hasDangerHtml: attributes.hasDangerHtml,
    };
  }

  /**
   * Convert attributes back to HTML string
   *
   * @param attributes - Attributes to convert
   * @returns HTML attribute string
   */
  toHTMLString(attributes: ParsedAttributes): string {
    const parts: string[] = [];

    // Handle className -> class
    if (attributes.className) {
      parts.push(`class="${this.escapeHTML(attributes.className)}"`);
    }

    // Handle HTML attributes
    for (const [name, value] of Object.entries(attributes.html)) {
      if (value === true) {
        parts.push(name);
      } else if (value !== false && value != null) {
        parts.push(`${name}="${this.escapeHTML(String(value))}"`);
      }
    }

    // Handle style
    if (attributes.style) {
      const styleString = Object.entries(attributes.style)
        .map(([prop, value]) => `${this.camelToKebabCase(prop)}: ${value}`)
        .join('; ');
      parts.push(`style="${this.escapeHTML(styleString)}"`);
    }

    // Handle events (for documentation purposes)
    for (const event of attributes.events) {
      parts.push(`${event.type}="${this.escapeHTML(event.handler)}"`);
    }

    return parts.join(' ');
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(str: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return str.replace(/[&<>"']/g, char => escapeMap[char] || char);
  }

  /**
   * Check if attributes are equal
   *
   * @param a - First attributes
   * @param b - Second attributes
   * @returns True if attributes are equal
   */
  equals(a: ParsedAttributes, b: ParsedAttributes): boolean {
    // Compare HTML attributes
    const aKeys = Object.keys(a.html).sort();
    const bKeys = Object.keys(b.html).sort();

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (a.html[key] !== b.html[key]) return false;
    }

    // Compare className
    if (a.className !== b.className) return false;

    // Compare style
    const aStyleKeys = a.style ? Object.keys(a.style).sort() : [];
    const bStyleKeys = b.style ? Object.keys(b.style).sort() : [];

    if (aStyleKeys.length !== bStyleKeys.length) return false;

    for (const key of aStyleKeys) {
      if (a.style![key] !== b.style![key]) return false;
    }

    // Compare events
    if (a.events.length !== b.events.length) return false;

    for (let i = 0; i < a.events.length; i++) {
      if (a.events[i].type !== b.events[i].type || a.events[i].handler !== b.events[i].handler) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Default attribute extractor instance
 */
export const defaultAttributeExtractor = new AttributeExtractor();

/**
 * Convenience function to extract attributes
 *
 * @param element - DOM element to extract from
 * @returns Extracted attributes
 */
export function extractAttributes(element: Element): ParsedAttributes {
  return defaultAttributeExtractor.extract(element);
}
