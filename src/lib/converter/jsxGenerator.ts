/**
 * JSX Generator - Milestone 4
 *
 * Generates React JSX components from HTML AST.
 * Handles attribute transformation, proper JSX syntax, and code formatting.
 */

import { CodeFormatter } from './codeFormatter';
import { AttributeTransformer } from './attributeTransformer';
import {
  OutputFormat,
  GeneratorOptions,
  GeneratedComponent,
  GeneratorResult,
  GeneratorStats,
} from '@/types/generator.types';

/**
 * AST Node interface
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
 * JSX Generator configuration with defaults
 */
interface JSXGeneratorConfig {
  format: OutputFormat;
  componentName: string;
  formatting: {
    indentStyle: 'spaces';
    indentSize: number;
    printWidth: number;
    singleQuote: boolean;
    trailingComma: 'none' | 'es5' | 'all';
    semi: boolean;
    prettier: boolean;
  };
  convertClassToClassName: boolean;
  includeReactImport: boolean;
  customImports: string[];
  extractStyles: boolean;
}

/**
 * Generates React JSX components from HTML AST
 */
export class JSXGenerator {
  protected options: JSXGeneratorConfig;
  protected attributeTransformer: AttributeTransformer;
  protected formatter: CodeFormatter;
  protected warnings: string[] = [];
  protected stats: GeneratorStats;

  /**
   * Default generator options
   */
  private static readonly DEFAULT_OPTIONS: Partial<GeneratorOptions> = {
    format: OutputFormat.JSX,
    componentName: 'Component',
    formatting: {
      indentStyle: 'spaces' as const,
      indentSize: 2,
      printWidth: 80,
      singleQuote: true,
      trailingComma: 'es5' as const,
      semi: true,
      prettier: true,
    },
    convertClassToClassName: true,
    includeReactImport: true,
    customImports: [],
    extractStyles: false,
  };

  /**
   * Create a new JSX generator
   * @param options - Generator options
   */
  constructor(options?: Partial<GeneratorOptions>) {
    this.options = {
      ...JSXGenerator.DEFAULT_OPTIONS,
      ...options,
      formatting: {
        ...JSXGenerator.DEFAULT_OPTIONS.formatting,
        ...options?.formatting,
        prettier: options?.formatting?.prettier ?? true, // Ensure prettier has a default
      },
    } as JSXGeneratorConfig;

    this.attributeTransformer = new AttributeTransformer();
    this.formatter = new CodeFormatter(this.options.formatting);
    this.stats = {
      componentsGenerated: 0,
      elementsProcessed: 0,
      attributesTransformed: 0,
      inlineStylesConverted: 0,
      linesOfCode: 0,
    };
  }

  /**
   * Generate JSX component from AST
   * @param ast - HTML AST node
   * @returns Generation result with files and metadata
   */
  async generate(ast: ASTNode): Promise<GeneratorResult> {
    this.warnings = [];
    this.stats = {
      componentsGenerated: 0,
      elementsProcessed: 0,
      attributesTransformed: 0,
      inlineStylesConverted: 0,
      linesOfCode: 0,
    };

    const content = await this.generateComponent(ast);
    const fileName = `${this.options.componentName}.jsx`;

    const component: GeneratedComponent = {
      fileName,
      content,
      fileType: 'component',
    };

    this.stats.componentsGenerated = 1;
    this.stats.linesOfCode = typeof content === 'string' ? content.split('\n').length : 0;

    return {
      files: [component],
      warnings: this.warnings,
      stats: this.stats,
      entryPoint: component,
    };
  }

  /**
   * Generate component code
   * @param ast - HTML AST node
   * @returns Generated component code
   */
  protected async generateComponent(ast: ASTNode): Promise<string> {
    const imports = this.generateImports();
    const componentBody = this.generateComponentBody(ast);
    const component = this.assembleComponent(imports, componentBody);

    // Format if Prettier is enabled
    if (this.options.formatting.prettier) {
      return await this.formatter.format(component, 'jsx');
    }

    return component;
  }

  /**
   * Generate import statements
   * @returns Import statements block
   */
  protected generateImports(): string {
    const imports: string[] = [];

    // React import
    if (this.options.includeReactImport) {
      imports.push("import React from 'react';");
    }

    // Custom imports
    if (this.options.customImports && this.options.customImports.length > 0) {
      imports.push(...this.options.customImports);
    }

    return imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  }

  /**
   * Generate component function body
   * @param ast - HTML AST node
   * @returns Component function body
   */
  protected generateComponentBody(ast: ASTNode): string {
    const jsx = this.generateJSX(ast);
    return `function ${this.options.componentName}() {
  return (
    ${this.indentJSX(jsx, 4)}
  );
}`;
  }

  /**
   * Generate JSX from AST node
   * @param node - AST node
   * @param depth - Current depth for indentation
   * @returns JSX string
   */
  protected generateJSX(node: ASTNode, depth: number = 0): string {
    this.stats.elementsProcessed++;

    // Text node
    if (node.type === 'text' || node.type === 'textNode') {
      return this.escapeText(node.value || '');
    }

    // Comment node
    if (node.type === 'comment') {
      return `{/* ${node.value || ''} */}`;
    }

    // Element node
    if (node.type === 'element' && node.tagName) {
      return this.generateElement(node, depth);
    }

    // Fragment or root node
    if (node.children && node.children.length > 0) {
      return node.children.map((child) => this.generateJSX(child, depth)).join('\n');
    }

    return '';
  }

  /**
   * Generate JSX element
   * @param node - AST element node
   * @param depth - Current depth
   * @returns JSX element string
   */
  protected generateElement(node: ASTNode, depth: number = 0): string {
    const { tagName, attributes = {}, selfClosing = false, children = [] } = node;

    const transformedAttrs = this.attributeTransformer.transformBatch(attributes);
    this.stats.attributesTransformed += transformedAttrs.length;

    // Handle self-closing elements
    const safeTagName = tagName ?? 'div';
    if (this.isSelfClosingTag(safeTagName) || selfClosing || children.length === 0) {
      return this.generateSelfClosingElement(safeTagName, transformedAttrs);
    }

    // Handle elements with children
    const openingTag = this.generateOpeningTag(safeTagName, transformedAttrs);
    const childrenJSX = this.generateChildren(children, depth + 1);
    const closingTag = `</${safeTagName}>`;

    return `${openingTag}\n${childrenJSX}\n${'  '.repeat(depth)}${closingTag}`;
  }

  /**
   * Generate opening tag
   * @param tagName - Element tag name
   * @param attributes - Transformed attributes
   * @returns Opening tag JSX
   */
  protected generateOpeningTag(
    tagName: string | undefined,
    attributes: Array<{ name: string; value: string | boolean | object; type: string }>
  ): string {
    const safeTagName = tagName ?? 'div';
    const attrsString = this.generateAttributesString(attributes);
    return attrsString ? `<${safeTagName} ${attrsString}>` : `<${safeTagName}>`;
  }

  /**
   * Generate self-closing element
   * @param tagName - Element tag name
   * @param attributes - Transformed attributes
   * @returns Self-closing element JSX
   */
  protected generateSelfClosingElement(
    tagName: string | undefined,
    attributes: Array<{ name: string; value: string | boolean | object; type: string }>
  ): string {
    const safeTagName = tagName ?? 'div';
    const attrsString = this.generateAttributesString(attributes);
    return attrsString ? `<${safeTagName} ${attrsString} />` : `<${safeTagName} />`;
  }

  /**
   * Generate attributes string
   * @param attributes - Transformed attributes
   * @returns Attributes string for JSX
   */
  protected generateAttributesString(
    attributes: Array<{ name: string; value: string | boolean | object; type: string }>
  ): string {
    return attributes
      .map((attr) => {
        const { name, value, type } = attr;

        // Handle style objects
        if (type === 'style' && typeof value === 'object') {
          this.stats.inlineStylesConverted++;
          const styleObj = this.generateStyleObject(value as Record<string, string>);
          return `style={${styleObj}}`;
        }

        // Handle boolean attributes
        if (type === 'boolean') {
          return value === true ? name : '';
        }

        // Handle string values
        if (typeof value === 'string') {
          // Check if value looks like a JavaScript expression
          if (value.startsWith('{') && value.endsWith('}')) {
            return `${name}={${value.slice(1, -1)}}`;
          }
          return `${name}="${this.escapeAttributeValue(value)}"`;
        }

        // Handle object values (style objects, etc.)
        if (typeof value === 'object') {
          return `${name}={${JSON.stringify(value)}}`;
        }

        return `${name}="${value}"`;
      })
      .filter(Boolean)
      .join(' ');
  }

  /**
   * Generate style object string
   * @param styles - Style object
   * @returns Style object literal string
   */
  protected generateStyleObject(styles: Record<string, string>): string {
    const entries = Object.entries(styles).map(([key, value]) => {
      // Check if value is a number (no quotes needed)
      const isNumeric = /^\d+(\.\d+)?$/.test(value) && !value.endsWith('px');
      const valueStr = isNumeric ? value : `'${value}'`;
      return `${key}: ${valueStr}`;
    });

    return `{ ${entries.join(', ')} }`;
  }

  /**
   * Generate children JSX
   * @param children - Child AST nodes
   * @param depth - Current depth
   * @returns Children JSX string
   */
  protected generateChildren(children: ASTNode[], depth: number): string {
    return children
      .map((child) => {
        const jsx = this.generateJSX(child, depth);
        return this.indentJSX(jsx, depth + 1);
      })
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Assemble full component
   * @param imports - Import statements
   * @param body - Component body
   * @returns Full component code
   */
  protected assembleComponent(imports: string, body: string): string {
    return `${imports}${body}`;
  }

  /**
   * Check if tag is self-closing in JSX
   * @param tagName - Tag name to check
   * @returns True if tag is self-closing
   */
  protected isSelfClosingTag(tagName: string): boolean {
    const selfClosingTags = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'keygen',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ]);
    return selfClosingTags.has(tagName.toLowerCase());
  }

  /**
   * Indent JSX code
   * @param jsx - JSX string
   * @param spaces - Number of spaces for indentation
   * @returns Indented JSX string
   */
  protected indentJSX(jsx: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    const lines = jsx.split('\n');

    return lines
      .map((line, index) => {
        if (index === 0) return line;
        return line.trim() ? indent + line : line;
      })
      .join('\n');
  }

  /**
   * Escape text content
   * @param text - Text to escape
   * @returns Escaped text
   */
  protected escapeText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Escape attribute value
   * @param value - Attribute value to escape
   * @returns Escaped value
   */
  protected escapeAttributeValue(value: string): string {
    return value
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Add a warning
   * @param warning - Warning message
   */
  protected addWarning(warning: string): void {
    this.warnings.push(warning);
  }

  /**
   * Get current statistics
   * @returns Current generation stats
   */
  getStats(): GeneratorStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      componentsGenerated: 0,
      elementsProcessed: 0,
      attributesTransformed: 0,
      inlineStylesConverted: 0,
      linesOfCode: 0,
    };
  }
}
