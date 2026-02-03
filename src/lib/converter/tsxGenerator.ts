/**
 * TSX Generator - Milestone 4
 *
 * Generates React TypeScript (TSX) components from HTML AST.
 * Extends JSXGenerator with TypeScript-specific features like
 * prop interfaces, type annotations, and type safety.
 */

import { JSXGenerator } from './jsxGenerator';
import {
  OutputFormat,
  GeneratorOptions,
  GeneratorResult,
  PropDefinition,
  GeneratedComponent,
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
 * TSX-specific options (separate from parent's options)
 */
interface TSXSpecificOptions {
  includePropTypes: boolean;
  detectPropsFromAttributes: boolean;
  exportType: 'named' | 'default';
  customProps?: PropDefinition[];
}

/**
 * Default TSX options
 */
const DEFAULT_TSX_OPTIONS: TSXSpecificOptions = {
  includePropTypes: true,
  detectPropsFromAttributes: false,
  exportType: 'named',
  customProps: [],
};

/**
 * Generates React TypeScript (TSX) components from HTML AST
 */
export class TSXGenerator extends JSXGenerator {
  private tsxOptions: TSXSpecificOptions = DEFAULT_TSX_OPTIONS;
  private detectedProps: PropDefinition[] = [];

  /**
   * Create a new TSX generator
   * @param options - Generator options
   */
  constructor(options?: Partial<GeneratorOptions>) {
    // Build complete options before calling super
    const baseFormatting = {
      indentStyle: 'spaces' as const,
      indentSize: 2,
      printWidth: 80,
      singleQuote: true,
      trailingComma: 'es5' as const,
      semi: true,
      prettier: true,
    };

    const mergedFormatting = {
      ...baseFormatting,
      ...options?.formatting,
    };

    const tsxOptions: Partial<GeneratorOptions> = {
      ...options,
      format: OutputFormat.TSX,
      formatting: mergedFormatting,
      convertClassToClassName: options?.convertClassToClassName ?? true,
      includeReactImport: options?.includeReactImport ?? true,
      customImports: options?.customImports ?? [],
      extractStyles: options?.extractStyles ?? false,
    };

    super(tsxOptions);

    // Store TSX-specific options separately (without shadowing parent's options)
    this.tsxOptions = {
      includePropTypes: (options as any)?.includePropTypes ?? true,
      detectPropsFromAttributes: (options as any)?.detectPropsFromAttributes ?? false,
      exportType: (options as any)?.exportType ?? 'named',
      customProps: (options as any)?.customProps ?? [],
    };
  }

  /**
   * Generate TSX component from AST
   * @param ast - HTML AST node
   * @returns Generation result with files and metadata
   */
  async generate(ast: ASTNode): Promise<GeneratorResult> {
    this.warnings = [];
    this.detectedProps = [];
    this.stats = {
      componentsGenerated: 0,
      elementsProcessed: 0,
      attributesTransformed: 0,
      inlineStylesConverted: 0,
      linesOfCode: 0,
    };

    // Detect props from attributes if enabled
    if (this.tsxOptions.detectPropsFromAttributes) {
      this.detectProps(ast);
    }

    const content = await this.generateComponent(ast);
    const fileName = `${this.componentName}.tsx`;

    const component: GeneratedComponent = {
      fileName,
      content,
      fileType: 'component',
    };

    this.stats.componentsGenerated = 1;
    this.stats.linesOfCode = content.split('\n').length;

    return {
      files: [component],
      warnings: this.warnings,
      stats: this.stats,
      entryPoint: component,
    };
  }

  /**
   * Accessor for component name (from parent's options)
   */
  private get componentName(): string {
    return (this.options as any).componentName || 'Component';
  }

  /**
   * Generate imports including React.FC type
   * @returns Import statements block
   */
  protected generateImports(): string {
    const imports: string[] = [];

    // TypeScript React import
    if ((this.options as any).includeReactImport) {
      imports.push("import React from 'react';");
    }

    // Type imports
    if (this.tsxOptions.includePropTypes) {
      // FC type is included in React import for modern React
    }

    // Custom imports
    const customImports = (this.options as any).customImports;
    if (customImports && customImports.length > 0) {
      imports.push(...customImports);
    }

    return imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  }

  /**
   * Generate props interface
   * @returns Props interface definition
   */
  protected generatePropsInterface(): string {
    const props = this.getAllProps();

    if (props.length === 0) {
      return `interface ${this.componentName}Props {}\n\n`;
    }

    const propsDefinitions = props
      .map((prop) => {
        const optional = !prop.required ? '?' : '';
        const comment = prop.description ? `  /** ${prop.description} */\n` : '';
        const defaultDecl = prop.defaultValue !== undefined ? ` = ${JSON.stringify(prop.defaultValue)}` : '';
        return `${comment}  ${prop.name}${optional}: ${prop.type}${defaultDecl};`;
      })
      .join('\n');

    return `interface ${this.componentName}Props {\n${propsDefinitions}\n}\n\n`;
  }

  /**
   * Generate component function body with types
   * @param ast - HTML AST node
   * @returns Component function body
   */
  protected generateComponentBody(ast: ASTNode): string {
    const propsInterface = this.tsxOptions.includePropTypes ? this.generatePropsInterface() : '';
    const jsx = this.generateJSX(ast);
    const indentedJSX = this.indentJSX(jsx, 4);

    let componentDecl = '';

    if (this.tsxOptions.exportType === 'default') {
      componentDecl = `export default function ${this.componentName}`;
    } else {
      componentDecl = `export function ${this.componentName}`;
    }

    // Add props parameter if props are defined
    const propsParam = this.hasProps()
      ? `: ${this.componentName}Props`
      : '';
    const propsArg = this.hasProps() ? 'props' : '';

    return `${propsInterface}${componentDecl}${propsParam}(${propsArg}) {
  return (
    ${indentedJSX}
  );
}`;
  }

  /**
   * Detect props from AST attributes
   * @param ast - HTML AST node
   */
  private detectProps(ast: ASTNode): void {
    this.detectedProps = [];

    const visit = (node: ASTNode) => {
      if (node.attributes) {
        Object.entries(node.attributes).forEach(([, value]) => {
          // Check for prop patterns (e.g., data-title="{title}")
          const propMatch = value.match(/^\{(.+)\}$/);
          if (propMatch) {
            const propName = propMatch[1];
            const propType = this.inferPropType(propName, value);
            this.detectedProps.push({
              name: propName,
              type: propType,
              required: false,
            });
          }
        });
      }

      if (node.children) {
        node.children.forEach(visit);
      }
    };

    visit(ast);
  }

  /**
   * Infer prop type from value pattern
   * @param propName - Prop name
   * @param value - Prop value
   * @returns Inferred TypeScript type
   */
  private inferPropType(propName: string, value: string): string {
    // Common prop name patterns
    if (propName.toLowerCase().includes('count') || propName.toLowerCase().includes('num')) {
      return 'number';
    }
    if (propName.toLowerCase().includes('is') || propName.toLowerCase().includes('has')) {
      return 'boolean';
    }
    if (propName.toLowerCase().includes('callback') || propName.toLowerCase().includes('handler')) {
      return '() => void';
    }

    // Check value patterns
    const numMatch = value.match(/^\{(\d+)\}$/);
    if (numMatch) {
      return 'number';
    }

    const boolMatch = value.match(/^\{(true|false)\}$/);
    if (boolMatch) {
      return 'boolean';
    }

    // Default to string
    return 'string';
  }

  /**
   * Get all props (custom + detected)
   * @returns All prop definitions
   */
  private getAllProps(): PropDefinition[] {
    const allProps = [...this.detectedProps];

    if (this.tsxOptions.customProps) {
      this.tsxOptions.customProps.forEach((customProp) => {
        const existingIndex = allProps.findIndex((p) => p.name === customProp.name);
        if (existingIndex >= 0) {
          allProps[existingIndex] = customProp; // Override with custom
        } else {
          allProps.push(customProp);
        }
      });
    }

    return allProps;
  }

  /**
   * Check if component has any props
   * @returns True if props are defined
   */
  private hasProps(): boolean {
    return this.getAllProps().length > 0;
  }

  /**
   * Generate TypeScript interface for style object
   * @param styles - Style object
   * @returns Type-safe style object
   */
  protected generateTypedStyleObject(styles: Record<string, string>): string {
    // For TSX, we can use React.CSSProperties for better type safety
    const entries = Object.entries(styles).map(([key, value]) => {
      const isNumeric = /^\d+(\.\d+)?$/.test(value) && !value.endsWith('px');
      const valueStr = isNumeric ? value : `'${value}'`;
      return `${key}: ${valueStr}`;
    });

    return `{ ${entries.join(', ')} } as React.CSSProperties`;
  }

  /**
   * Generate self-closing element with TypeScript typing
   * @param tagName - Element tag name
   * @param attributes - Transformed attributes
   * @returns Self-closing element JSX with proper types
   */
  protected generateSelfClosingElement(
    tagName: string,
    attributes: Array<{ name: string; value: string | boolean | object; type: string }>
  ): string {
    const attrsString = this.generateAttributesString(attributes);
    return attrsString ? `<${tagName} ${attrsString} />` : `<${tagName} />`;
  }

  /**
   * Add custom prop definition
   * @param prop - Prop definition
   */
  addCustomProp(prop: PropDefinition): void {
    if (!this.tsxOptions.customProps) {
      this.tsxOptions.customProps = [];
    }
    this.tsxOptions.customProps.push(prop);
  }

  /**
   * Remove prop definition
   * @param propName - Prop name to remove
   */
  removeProp(propName: string): void {
    if (this.tsxOptions.customProps) {
      this.tsxOptions.customProps = this.tsxOptions.customProps.filter((p) => p.name !== propName);
    }
    this.detectedProps = this.detectedProps.filter((p) => p.name !== propName);
  }

  /**
   * Get detected props
   * @returns Array of detected props
   */
  getDetectedProps(): PropDefinition[] {
    return [...this.detectedProps];
  }

  /**
   * Set export type
   * @param type - Export type ('named' or 'default')
   */
  setExportType(type: 'named' | 'default'): void {
    this.tsxOptions.exportType = type;
  }
}
