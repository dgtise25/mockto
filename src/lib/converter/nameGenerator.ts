/**
 * Name Generator
 * Generates logical component names from HTML elements, classes, and content
 */

import type {
  NameGenerator as INameGenerator,
  NameGenerationContext,
  NamingConvention,
  BEMClassification,
} from '../../types/splitter.types';

// Reserved React and JavaScript keywords
const RESERVED_WORDS = new Set([
  'abstract', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double',
  'else', 'enum', 'export', 'extends', 'false', 'final', 'finally', 'float',
  'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof',
  'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'package',
  'private', 'protected', 'public', 'return', 'short', 'static', 'super',
  'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true',
  'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield',
  // React-specific
  'render', 'constructor', 'component', 'props', 'state', 'ref', 'key',
  'children', 'className', 'style', 'onClick', 'onChange'
]);

// Semantic tag to component name mappings
const SEMANTIC_TAG_MAPPINGS: Record<string, string> = {
  'header': 'Header',
  'nav': 'Nav',
  'main': 'Main',
  'footer': 'Footer',
  'article': 'Article',
  'section': 'Section',
  'aside': 'AsideSidebar',
  'figure': 'Figure',
  'figcaption': 'Figcaption',
  'dialog': 'Dialog',
  'details': 'Details',
  'summary': 'Summary'
};

// Role-based name mappings (available for future use)
// const ROLE_MAPPINGS: Partial<Record<ComponentRole, string>> = {
//   'semantic': 'Component',
//   'layout': 'Container',
//   'interactive': 'Interactive',
//   'content': 'Content',
//   'navigation': 'Navigation',
//   'media': 'Media',
//   'data': 'DataDisplay',
//   'unknown': 'Component'
// };

/**
 * Configuration options for NameGenerator
 */
export interface NameGeneratorOptions {
  /** Naming convention to use */
  convention?: NamingConvention;

  /** Prefix for generated names */
  prefix?: string;

  /** Suffix for generated names */
  suffix?: string;
}

/**
 * NameGenerator class
 */
export class NameGenerator implements INameGenerator {
  private convention: NamingConvention;
  private prefix: string;
  private suffix: string;
  private usedNames: Set<string>;

  constructor(options: NameGeneratorOptions = {}) {
    this.convention = options.convention || 'PascalCase';
    this.prefix = options.prefix || '';
    this.suffix = options.suffix || '';
    this.usedNames = new Set();
  }

  /**
   * Generate a component name from context
   */
  generateName(context: NameGenerationContext): string {
    const {
      element,
      type,
      parentName,
      siblings = [],
      existingNames = [],
      context: additionalContext
    } = context;

    let name: string;

    // Determine the element type from tagName if not provided
    const elementType = type || (element instanceof Element ? element.tagName.toLowerCase() : undefined);

    // Priority 1: Check data-component attribute
    if (element instanceof Element) {
      const dataComponent = element.getAttribute('data-component');
      if (dataComponent) {
        name = this.toPascalCase(dataComponent);
        return this.applyNamingConvention(name);
      }

      const dataName = element.getAttribute('data-name');
      if (dataName) {
        name = this.toPascalCase(dataName);
        return this.applyNamingConvention(name);
      }
    }

    // Priority 2: Semantic tag mapping (use elementType which can come from type or tagName)
    if (elementType && SEMANTIC_TAG_MAPPINGS[elementType]) {
      name = SEMANTIC_TAG_MAPPINGS[elementType];
      // If parentName is provided, prefix it
      if (parentName) {
        name = parentName + name;
      }
    }
    // Priority 3: Semantic elements that should use their tag name even with classes
    else if (elementType === 'a') {
      // Anchor tags are "Link" components
      name = 'Link';
      if (parentName) {
        name = parentName + name;
      }
    }
    else if (elementType === 'img' || elementType === 'image') {
      // Image tags are "Image" components
      name = 'Image';
      if (parentName) {
        name = parentName + name;
      }
    }
    // Priority 4: Button elements - check class name first
    else if (elementType === 'button') {
      if (element instanceof Element && element.className) {
        const classes = element.className.toString().split(/\s+/).filter(Boolean);
        // Check if first class is meaningful (not a generic utility class)
        const genericClasses = ['clickable', 'button', 'btn-primary', 'btn-secondary', 'btn-default', 'btn-large', 'btn-small', 'btn-', 'button-'];
        const firstClass = classes[0]?.toLowerCase() || '';
        if (firstClass && !genericClasses.some(g => firstClass.startsWith(g))) {
          // Use the class name (e.g., 'btn' -> 'Btn')
          name = this.generateFromClasses(classes, additionalContext);
        } else {
          name = 'Button';
        }
      } else {
        name = 'Button';
      }
    }
    // Priority 5: Sibling-based naming (when siblings have a pattern)
    else if (siblings.length > 0) {
      // Extract parent prefix from first sibling
      const siblingPrefix = parentName || this.extractPrefixFromSibling(siblings[0]);
      if (element instanceof Element && element.className) {
        const classes = element.className.toString().split(/\s+/).filter(Boolean);
        const className = this.generateFromClasses(classes, additionalContext);
        if (siblingPrefix) {
          name = siblingPrefix + className;
        } else {
          name = className;
        }
      } else {
        name = (siblingPrefix || '') + 'Section';
      }
    }
    // Priority 6: Element class names
    else if (element instanceof Element && element.className) {
      const classes = element.className.toString().split(/\s+/).filter(Boolean);
      name = this.generateFromClasses(classes, additionalContext);
      // If parentName is provided, prefix it
      if (parentName) {
        name = parentName + name;
      }
    }
    // Priority 6: Parent-prefixed name
    else if (parentName) {
      name = this.generateWithParent(parentName, siblings, additionalContext);
    }
    // Priority 7: Type-based generic name
    else if (elementType) {
      name = this.toPascalCase(elementType);
    }
    // Fallback: Generate generic name
    else {
      name = this.generateGenericName(additionalContext);
    }

    // Check for reserved words and add suffix if needed
    if (RESERVED_WORDS.has(name.toLowerCase())) {
      name = name + 'Component';
    }

    // Apply naming convention
    name = this.applyNamingConvention(name);

    // Add prefix/suffix
    let finalName = name;
    if (this.prefix) {
      finalName = this.prefix + name;
    }
    if (this.suffix) {
      finalName = name + this.suffix;
    }

    // Ensure uniqueness
    finalName = this.generateUniqueName(finalName, [...existingNames, ...this.usedNames]);

    // Truncate very long names (keep under 50)
    if (finalName.length > 49) {
      finalName = finalName.substring(0, 46) + '...';
    }

    // Track used name
    this.usedNames.add(finalName);

    return finalName;
  }

  /**
   * Extract prefix from a sibling name
   * e.g., "CardHeader" -> "Card", or "CardBody" -> "Card"
   */
  private extractPrefixFromSibling(siblingName: string): string | null {
    if (!siblingName) return null;

    // Try to split the sibling name by common patterns
    // Remove common suffixes to find the parent prefix
    const suffixes = ['Header', 'Footer', 'Body', 'Sidebar', 'Content', 'Title', 'Description', 'Nav', 'Navigation', 'Aside', 'Main', 'Section', 'Wrapper', 'Container'];

    for (const suffix of suffixes) {
      if (siblingName.endsWith(suffix) && siblingName.length > suffix.length) {
        return siblingName.substring(0, siblingName.length - suffix.length);
      }
    }

    // If no suffix match, try to find where capitalization changes (for camelCase/PascalCase)
    for (let i = 1; i < siblingName.length - 1; i++) {
      if (siblingName[i] === siblingName[i].toUpperCase() &&
          siblingName[i+1] === siblingName[i+1].toLowerCase()) {
        // Found transition from uppercase to lowercase
        return siblingName.substring(0, i);
      }
    }

    return null;
  }

  /**
   * Generate a unique name avoiding collisions
   */
  generateUniqueName(baseName: string, existingNames: string[]): string {
    if (!existingNames.includes(baseName)) {
      return baseName;
    }

    // Extract existing suffixes
    const pattern = new RegExp(`^${baseName}(\\d+)$`);
    const existingNumbers = existingNames
      .filter(name => pattern.test(name))
      .map(name => parseInt(name.match(pattern)![1], 10))
      .filter(num => !isNaN(num));

    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = maxNumber + 1;

    return `${baseName}${nextNumber}`;
  }

  /**
   * Suggest a name based on HTML content analysis
   */
  suggestNameFromContent(html: string): string {
    // Create a temporary DOM element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Priority 1: Look for headings
    const heading = temp.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const text = heading.textContent?.trim();
      if (text) {
        return this.toPascalCase(text);
      }
    }

    // Priority 2: Look for button text
    const button = temp.querySelector('button');
    if (button) {
      const text = button.textContent?.trim();
      if (text) {
        return this.toPascalCase(text + 'Button');
      }
    }

    // Priority 3: Look for link text
    const link = temp.querySelector('a');
    if (link) {
      const text = link.textContent?.trim();
      if (text) {
        return this.toPascalCase(text + 'Link');
      }
    }

    // Priority 4: Look for paragraphs with keywords
    const paragraphs = Array.from(temp.querySelectorAll('p'));
    for (const p of paragraphs) {
      const text = p.textContent?.trim().toLowerCase();
      if (text) {
        // Look for actionable/content keywords
        const keywords = [
          'contact', 'support', 'help', 'about', 'settings', 'profile',
          'dashboard', 'login', 'register', 'search', 'filter', 'sort',
          'product', 'service', 'feature', 'pricing', 'team', 'news'
        ];

        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            return this.toPascalCase(keyword);
          }
        }
      }
    }

    // Fallback: Generate generic name
    return this.generateGenericName();
  }

  /**
   * Validate if a name is a valid identifier
   */
  validateName(name: string): boolean {
    // Check if reserved word
    if (RESERVED_WORDS.has(name.toLowerCase())) {
      return false;
    }

    // Check if valid JavaScript identifier
    const validIdentifier = /^[A-Z][a-zA-Z0-9]*$/.test(name);

    // Check for HTML tag names
    const htmlTags = new Set([
      'div', 'span', 'p', 'a', 'img', 'button', 'input', 'form',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'
    ]);

    if (htmlTags.has(name.toLowerCase())) {
      // HTML tag names should have suffix
      return name.endsWith('Component') || name.endsWith('Wrapper');
    }

    return validIdentifier;
  }

  /**
   * Generate name from CSS classes
   */
  generateFromClasses(classes: string[], context?: { hasChildren?: boolean; childTypes?: string[]; childCount?: number }): string {
    // Take the first meaningful class
    const meaningfulClass = classes.find(cls =>
      cls.length > 1 &&
      !cls.startsWith('js-') &&
      !cls.startsWith('is-') &&
      !cls.startsWith('has-') &&
      !cls.match(/^\d+$/) &&
      !cls.includes('--') // Skip modifiers
    );

    if (!meaningfulClass) {
      return this.generateGenericName(context);
    }

    // Check for generic class names that should be enhanced with context
    const genericNames = ['container', 'wrapper', 'content', 'section', 'area', 'box'];
    if (genericNames.includes(meaningfulClass.toLowerCase()) && context?.childTypes?.length) {
      // Use the child type to create a more descriptive name
      return this.generateGenericName(context);
    }

    // Parse BEM class
    const bem = this.parseBEM(meaningfulClass);
    if (bem.element && bem.block) {
      // BEM element: Block__Element -> BlockElement
      return this.toPascalCase(`${bem.block} ${bem.element}`);
    }

    // For camelCase classes, toPascalCase should handle them correctly now
    return this.toPascalCase(meaningfulClass);
  }

  /**
   * Generate name with parent prefix
   */
  private generateWithParent(
    parentName: string,
    siblings: string[] = [],
    context?: { hasChildren?: boolean; childTypes?: string[] }
  ): string {
    // If we have siblings, try to maintain naming pattern
    if (siblings.length > 0) {
      const siblingBase = siblings[0].replace(parentName, '').trim();
      if (siblingBase) {
        // Sibling has a pattern, follow it
        const siblingNum = siblings.length + 1;
        return `${parentName}${this.toPascalCase(siblingBase)}${siblingNum}`;
      }
    }

    // Default: Parent + generic suffix
    if (context?.hasChildren || context?.childTypes?.length) {
      return `${parentName}Container`;
    }

    return `${parentName}Section`;
  }

  /**
   * Generate a generic component name
   */
  private generateGenericName(context?: { hasChildren?: boolean; childTypes?: string[]; childCount?: number }): string {
    const counter = this.usedNames.size + 1;

    if (context?.childTypes && context.childTypes.length > 0) {
      // Generate a name based on the child types
      const firstChildType = context.childTypes[0];
      const childTypeName = this.toPascalCase(firstChildType);
      // If all children are the same type, use plural form
      if (context.childTypes.length > 1 && context.childTypes.every(t => t === firstChildType)) {
        return `${childTypeName}Container${counter}`;
      }
      return `${childTypeName}Container${counter}`;
    }

    if (context?.hasChildren || context?.childCount) {
      return `Container${counter}`;
    }

    return `Component${counter}`;
  }

  /**
   * Parse BEM class name
   */
  private parseBEM(className: string): BEMClassification {
    // BEM element: block__element
    const elementMatch = className.match(/^(.+)__([^_]+)$/);
    if (elementMatch) {
      return {
        block: elementMatch[1],
        element: elementMatch[2],
        fullClass: className
      };
    }

    // BEM modifier: block--modifier or block__element--modifier
    const modifierMatch = className.match(/^(.+?)(?:__[^_]+)?--(.+)$/);
    if (modifierMatch) {
      return {
        block: modifierMatch[1],
        modifier: modifierMatch[2],
        fullClass: className
      };
    }

    // Regular block
    return {
      block: className,
      fullClass: className
    };
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .toString()
      // Split by word boundaries (hyphen, underscore, space, capital letters, and digit boundaries)
      .split(/[-_\s]+|(?=[A-Z])|(?<=\d)(?=[A-Za-z])|(?<=[A-Za-z])(?=\d)/)  // Split before capital letters, and between digits and letters
      // Filter empty strings
      .filter(Boolean)
      // Capitalize first letter of each word
      .map(word => {
        // Remove special characters (keep only alphanumeric)
        let cleaned = word.replace(/[^a-zA-Z0-9]/g, '');
        if (cleaned.length === 0) return '';
        // Skip words that are all digits
        if (/^\d+$/.test(cleaned)) return '';
        // Skip words that start with digits - strip them
        cleaned = cleaned.replace(/^\d+/, '');
        if (cleaned.length === 0) return '';
        // Capitalize first letter, lowercase the rest
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      })
      // Remove empty words
      .filter(Boolean)
      // Join together
      .join('');
  }

  /**
   * Apply naming convention to a name
   */
  private applyNamingConvention(name: string): string {
    switch (this.convention) {
      case 'PascalCase':
        // Ensure first letter is uppercase, rest as is (already PascalCase from toPascalCase)
        return name.charAt(0).toUpperCase() + name.slice(1);

      case 'kebab-case':
        // Convert PascalCase to kebab-case (SearchBox -> search-box)
        return name
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()
          .replace(/^-/, '');

      case 'camelCase':
        // Convert PascalCase to camelCase (SearchBox -> searchBox)
        const camel = name.charAt(0).toLowerCase() + name.slice(1);
        return camel;

      case 'UPPER_CASE':
        // Convert PascalCase to UPPER_CASE (SearchBox -> SEARCH_BOX)
        return name
          .replace(/([A-Z])/g, '_$1')
          .toUpperCase()
          .replace(/^_/, '');

      default:
        return name;
    }
  }

  /**
   * Reset tracked used names
   */
  reset(): void {
    this.usedNames.clear();
  }

  /**
   * Get all used names
   */
  getUsedNames(): string[] {
    return Array.from(this.usedNames);
  }
}

/**
 * Create a name generator with default options
 */
export function createNameGenerator(options?: NameGeneratorOptions): NameGenerator {
  return new NameGenerator(options);
}

/**
 * Quick utility to generate a name from a class string
 */
export function nameFromClass(className: string, convention: NamingConvention = 'PascalCase'): string {
  const generator = new NameGenerator({ convention });
  const classes = className.split(/\s+/).filter(Boolean);
  return generator.generateFromClasses(classes);
}
