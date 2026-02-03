/**
 * Attribute Transformer - Milestone 4
 *
 * Transforms HTML attributes to React-compatible attributes.
 * Handles className conversion, event handlers, boolean attributes,
 * and other HTML-to-React attribute transformations.
 */


/**
 * Transformation result interface
 */
interface TransformedAttribute {
  name: string;
  value: string | boolean | object;
  type: 'direct' | 'event' | 'style' | 'boolean' | 'custom' | 'remove';
}

/**
 * Attribute mapping type union
 */
type AttributeMappingType = 'direct' | 'event' | 'boolean' | 'custom' | 'remove';

/**
 * Attribute mapping for HTML to React transformations
 */
interface AttributeMapping {
  [key: string]: {
    reactName: string;
    type: AttributeMappingType;
    transform?: (value: string) => string | boolean | object;
  };
}

/**
 * AttributeTransformer handles all HTML to React attribute conversions
 */
export class AttributeTransformer {
  private customRules: Map<string, AttributeMapping[string]> = new Map();

  /**
   * Standard HTML to React attribute mappings
   */
  private static readonly ATTRIBUTE_MAPPINGS: AttributeMapping = {
    // Standard attribute name changes
    class: { reactName: 'className', type: 'direct' },
    for: { reactName: 'htmlFor', type: 'direct' },
    tabindex: { reactName: 'tabIndex', type: 'direct' },
    readonly: { reactName: 'readOnly', type: 'direct' },
    maxlength: { reactName: 'maxLength', type: 'direct' },
    cellpadding: { reactName: 'cellPadding', type: 'direct' },
    cellspacing: { reactName: 'cellSpacing', type: 'direct' },
    colspan: { reactName: 'colSpan', type: 'direct' },
    rowspan: { reactName: 'rowSpan', type: 'direct' },
    frameborder: { reactName: 'frameBorder', type: 'direct' },
    marginwidth: { reactName: 'marginWidth', type: 'direct' },
    marginheight: { reactName: 'marginHeight', type: 'direct' },
    noresize: { reactName: 'noResize', type: 'direct' },
    enctype: { reactName: 'encType', type: 'direct' },
    autocomplete: { reactName: 'autoComplete', type: 'direct' },
    allowpaymentrequest: { reactName: 'allowPaymentRequest', type: 'direct' },
    formaction: { reactName: 'formAction', type: 'direct' },
    formenctype: { reactName: 'formEncType', type: 'direct' },
    formmethod: { reactName: 'formMethod', type: 'direct' },
    formnovalidate: { reactName: 'formNoValidate', type: 'direct' },
    formtarget: { reactName: 'formTarget', type: 'direct' },
    inputmode: { reactName: 'inputMode', type: 'direct' },
    minlength: { reactName: 'minLength', type: 'direct' },
    novalidate: { reactName: 'noValidate', type: 'direct' },
    radiogroup: { reactName: 'radioGroup', type: 'direct' },
    spellcheck: { reactName: 'spellCheck', type: 'direct' },
    srcdoc: { reactName: 'srcDoc', type: 'direct' },
    srclang: { reactName: 'srcLang', type: 'direct' },

    // Event handlers
    onclick: { reactName: 'onClick', type: 'event' },
    ondblclick: { reactName: 'onDoubleClick', type: 'event' },
    onchange: { reactName: 'onChange', type: 'event' },
    onsubmit: { reactName: 'onSubmit', type: 'event' },
    onload: { reactName: 'onLoad', type: 'event' },
    onerror: { reactName: 'onError', type: 'event' },
    onkeydown: { reactName: 'onKeyDown', type: 'event' },
    onkeyup: { reactName: 'onKeyUp', type: 'event' },
    onkeypress: { reactName: 'onKeyPress', type: 'event' },
    onmouseover: { reactName: 'onMouseOver', type: 'event' },
    onmouseout: { reactName: 'onMouseOut', type: 'event' },
    onmousemove: { reactName: 'onMouseMove', type: 'event' },
    onmousedown: { reactName: 'onMouseDown', type: 'event' },
    onmouseup: { reactName: 'onMouseUp', type: 'event' },
    onmouseenter: { reactName: 'onMouseEnter', type: 'event' },
    onmouseleave: { reactName: 'onMouseLeave', type: 'event' },
    onfocus: { reactName: 'onFocus', type: 'event' },
    onblur: { reactName: 'onBlur', type: 'event' },
    onscroll: { reactName: 'onScroll', type: 'event' },
    oninput: { reactName: 'onInput', type: 'event' },
    ontouchstart: { reactName: 'onTouchStart', type: 'event' },
    ontouchend: { reactName: 'onTouchEnd', type: 'event' },
    ontouchmove: { reactName: 'onTouchMove', type: 'event' },
    ontouchcancel: { reactName: 'onTouchCancel', type: 'event' },
    onwheel: { reactName: 'onWheel', type: 'event' },
    oncopy: { reactName: 'onCopy', type: 'event' },
    oncut: { reactName: 'onCut', type: 'event' },
    onpaste: { reactName: 'onPaste', type: 'event' },
    oncompositionstart: { reactName: 'onCompositionStart', type: 'event' },
    oncompositionend: { reactName: 'onCompositionEnd', type: 'event' },
    oncompositionupdate: { reactName: 'onCompositionUpdate', type: 'event' },
    ondrag: { reactName: 'onDrag', type: 'event' },
    ondragend: { reactName: 'onDragEnd', type: 'event' },
    ondragenter: { reactName: 'onDragEnter', type: 'event' },
    ondragexit: { reactName: 'onDragExit', type: 'event' },
    ondragleave: { reactName: 'onDragLeave', type: 'event' },
    ondragover: { reactName: 'onDragOver', type: 'event' },
    ondragstart: { reactName: 'onDragStart', type: 'event' },
    ondrop: { reactName: 'onDrop', type: 'event' },
    onreset: { reactName: 'onReset', type: 'event' },
    onselect: { reactName: 'onSelect', type: 'event' },
    ontoggle: { reactName: 'onToggle', type: 'event' },
    onbeforeinput: { reactName: 'onBeforeInput', type: 'event' },
    onpointerdown: { reactName: 'onPointerDown', type: 'event' },
    onpointermove: { reactName: 'onPointerMove', type: 'event' },
    onpointerup: { reactName: 'onPointerUp', type: 'event' },
    onpointercancel: { reactName: 'onPointerCancel', type: 'event' },
    onpointerenter: { reactName: 'onPointerEnter', type: 'event' },
    onpointerleave: { reactName: 'onPointerLeave', type: 'event' },
    onpointerover: { reactName: 'onPointerOver', type: 'event' },
    onpointerout: { reactName: 'onPointerOut', type: 'event' },
    ongotpointercapture: { reactName: 'onGotPointerCapture', type: 'event' },
    onlostpointercapture: { reactName: 'onLostPointerCapture', type: 'event' },
    oncontextmenu: { reactName: 'onContextMenu', type: 'event' },
    onanimationstart: { reactName: 'onAnimationStart', type: 'event' },
    onanimationend: { reactName: 'onAnimationEnd', type: 'event' },
    onanimationiteration: { reactName: 'onAnimationIteration', type: 'event' },
    ontransitionend: { reactName: 'onTransitionEnd', type: 'event' },
    oncanplay: { reactName: 'onCanPlay', type: 'event' },
    oncanplaythrough: { reactName: 'onCanPlayThrough', type: 'event' },
    ondurationchange: { reactName: 'onDurationChange', type: 'event' },
    onemptied: { reactName: 'onEmptied', type: 'event' },
    onencrypted: { reactName: 'onEncrypted', type: 'event' },
    onended: { reactName: 'onEnded', type: 'event' },
    onloadeddata: { reactName: 'onLoadedData', type: 'event' },
    onloadedmetadata: { reactName: 'onLoadedMetadata', type: 'event' },
    onpause: { reactName: 'onPause', type: 'event' },
    onplay: { reactName: 'onPlay', type: 'event' },
    onplaying: { reactName: 'onPlaying', type: 'event' },
    onprogress: { reactName: 'onProgress', type: 'event' },
    onratechange: { reactName: 'onRateChange', type: 'event' },
    onseeked: { reactName: 'onSeeked', type: 'event' },
    onseeking: { reactName: 'onSeeking', type: 'event' },
    onstalled: { reactName: 'onStalled', type: 'event' },
    onsuspend: { reactName: 'onSuspend', type: 'event' },
    ontimeupdate: { reactName: 'onTimeUpdate', type: 'event' },
    onvolumechange: { reactName: 'onVolumeChange', type: 'event' },
    onwaiting: { reactName: 'onWaiting', type: 'event' },
    onabort: { reactName: 'onAbort', type: 'event' },
    onmessage: { reactName: 'onMessage', type: 'event' },
    onclose: { reactName: 'onClose', type: 'event' },
    onopen: { reactName: 'onOpen', type: 'event' },

    // Boolean attributes
    disabled: { reactName: 'disabled', type: 'boolean', transform: () => true },
    checked: { reactName: 'checked', type: 'boolean', transform: () => true },
    required: { reactName: 'required', type: 'boolean', transform: () => true },
    multiple: { reactName: 'multiple', type: 'boolean', transform: () => true },
    muted: { reactName: 'muted', type: 'boolean', transform: () => true },
    loop: { reactName: 'loop', type: 'boolean', transform: () => true },
    controls: { reactName: 'controls', type: 'boolean', transform: () => true },
    autoplay: { reactName: 'autoPlay', type: 'boolean', transform: () => true },
    autofocus: { reactName: 'autoFocus', type: 'boolean', transform: () => true },
    default: { reactName: 'default', type: 'boolean', transform: () => true },
    hidden: { reactName: 'hidden', type: 'boolean', transform: () => true },
    selected: { reactName: 'selected', type: 'boolean', transform: () => true },
    nomodule: { reactName: 'noModule', type: 'boolean', transform: () => true },
    async: { reactName: 'async', type: 'boolean', transform: () => true },
    defer: { reactName: 'defer', type: 'boolean', transform: () => true },
    reversed: { reactName: 'reversed', type: 'boolean', transform: () => true },
    open: { reactName: 'open', type: 'boolean', transform: () => true },
    download: { reactName: 'download', type: 'boolean', transform: () => true },

    // Attributes to remove (React internal attributes)
    'data-reactid': { reactName: '', type: 'remove' },
    'data-reactroot': { reactName: '', type: 'remove' },
    reactid: { reactName: '', type: 'remove' },
    reactroot: { reactName: '', type: 'remove' },
  };

  /**
   * Boolean HTML attributes that should be converted to true
   */
  private static readonly BOOLEAN_ATTRIBUTES = new Set([
    'disabled',
    'checked',
    'required',
    'multiple',
    'muted',
    'loop',
    'controls',
    'autoplay',
    'default',
    'hidden',
    'selected',
    'autofocus',
    'allowfullscreen',
    'nomodule',
    'async',
    'defer',
    'reversed',
    'open',
    'download',
    'formnovalidate',
    'ismap',
    'noshade',
    'nowrap',
    'readonly',
    'seamless',
  ]);

  /**
   * Transform a single HTML attribute to React format
   * @param name - HTML attribute name
   * @param value - HTML attribute value
   * @returns Transformed attribute
   */
  transform(name: string, value: string): TransformedAttribute {
    // Check custom rules first
    if (this.customRules.has(name)) {
      const rule = this.customRules.get(name)!;
      return {
        name: rule.reactName,
        value: rule.transform ? rule.transform(value) : value,
        type: rule.type,
      };
    }

    // Check standard mappings
    if (AttributeTransformer.ATTRIBUTE_MAPPINGS[name]) {
      const mapping = AttributeTransformer.ATTRIBUTE_MAPPINGS[name];
      if (mapping.type === 'remove') {
        return { name: '', value: '', type: 'remove' };
      }

      return {
        name: mapping.reactName,
        value: mapping.transform
          ? mapping.transform(value)
          : this.transformValue(mapping.type, value),
        type: mapping.type,
      };
    }

    // Handle style attribute
    if (name === 'style') {
      return {
        name: 'style',
        value: this.transformStyle(value),
        type: 'style',
      };
    }

    // Preserve data-* attributes
    if (name.startsWith('data-')) {
      return { name, value, type: 'direct' };
    }

    // Preserve aria-* attributes
    if (name.startsWith('aria-')) {
      return { name, value, type: 'direct' };
    }

    // Check for boolean attribute
    if (AttributeTransformer.BOOLEAN_ATTRIBUTES.has(name)) {
      return {
        name,
        value: true,
        type: 'boolean',
      };
    }

    // Return as-is for unknown attributes
    return { name, value, type: 'direct' };
  }

  /**
   * Transform multiple attributes at once
   * @param attributes - Object containing HTML attributes
   * @returns Array of transformed attributes (excluding removed ones)
   */
  transformBatch(
    attributes: Record<string, string>
  ): TransformedAttribute[] {
    return Object.entries(attributes)
      .map(([name, value]) => this.transform(name, value))
      .filter((attr) => attr.type !== 'remove');
  }

  /**
   * Transform attribute value based on type
   */
  private transformValue(
    type: AttributeMappingType,
    value: string
  ): string | boolean {
    if (type === 'boolean') {
      return true;
    }
    return value;
  }

  /**
   * Transform CSS style string to React style object
   * @param styleValue - CSS style string (e.g., "color: red; background: blue;")
   * @returns Style object with camelCase properties
   */
  private transformStyle(styleValue: string): Record<string, string> {
    const styles: Record<string, string> = {};

    if (!styleValue || styleValue.trim() === '') {
      return styles;
    }

    // Split by semicolon and process each property
    const properties = styleValue.split(';').filter((p) => p.trim());

    for (const prop of properties) {
      const colonIndex = prop.indexOf(':');
      if (colonIndex === -1) continue;

      const property = prop.slice(0, colonIndex).trim();
      const value = prop.slice(colonIndex + 1).trim();

      // Convert CSS property to camelCase
      const camelCaseProperty = this.cssToCamelCase(property);
      styles[camelCaseProperty] = value;
    }

    return styles;
  }

  /**
   * Convert CSS property name to camelCase
   * @param property - CSS property name (e.g., "background-color")
   * @returns camelCase property name (e.g., "backgroundColor")
   */
  private cssToCamelCase(property: string): string {
    return property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Add a custom transformation rule
   * @param htmlAttr - HTML attribute name
   * @param reactAttr - React attribute name
   * @param transform - Optional transform function
   */
  addCustomRule(
    htmlAttr: string,
    reactAttr: string,
    transform?: (value: string) => string | boolean | object
  ): void {
    this.customRules.set(htmlAttr, {
      reactName: reactAttr,
      type: 'custom',
      transform,
    });
  }

  /**
   * Remove a custom transformation rule
   * @param htmlAttr - HTML attribute name to remove
   */
  removeCustomRule(htmlAttr: string): void {
    this.customRules.delete(htmlAttr);
  }

  /**
   * Check if an attribute should be removed
   * @param name - Attribute name to check
   * @returns True if attribute should be removed
   */
  shouldRemove(name: string): boolean {
    const mapping = AttributeTransformer.ATTRIBUTE_MAPPINGS[name];
    return mapping?.type === 'remove' || this.customRules.get(name)?.type === 'remove';
  }

  /**
   * Get all standard attribute mappings
   * @returns Copy of standard mappings
   */
  getStandardMappings(): Readonly<AttributeMapping> {
    return { ...AttributeTransformer.ATTRIBUTE_MAPPINGS };
  }

  /**
   * Check if an attribute is a boolean attribute
   * @param name - Attribute name to check
   * @returns True if attribute is boolean
   */
  isBooleanAttribute(name: string): boolean {
    return AttributeTransformer.BOOLEAN_ATTRIBUTES.has(name);
  }

  /**
   * Check if an attribute is an event handler
   * @param name - Attribute name to check
   * @returns True if attribute is an event handler
   */
  isEventAttribute(name: string): boolean {
    const mapping = AttributeTransformer.ATTRIBUTE_MAPPINGS[name];
    return mapping?.type === 'event' || name.startsWith('on');
  }
}
