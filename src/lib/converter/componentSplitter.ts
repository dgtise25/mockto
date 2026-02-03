/**
 * Component Splitter
 * Splits HTML into logical React components
 */

import type {
  ComponentDefinition,
  ComponentRole,
  ComponentTree,
  ComponentEdge,
  ComponentTreeNode,
  PatternDetectionResult,
  SplitResult,
  SplitMetadata,
  SplitterOptions,
  ElementExtractResult,
  PropType,
} from '../../types/splitter.types';

import { PatternDetector } from './patternDetector';
import { NameGenerator } from './nameGenerator';

// Re-export types for convenience
export type {
  ComponentDefinition,
  ComponentRole,
  ComponentTree,
  ComponentEdge,
  ComponentTreeNode,
  PatternDetectionResult,
  SplitResult,
  SplitMetadata,
  SplitterOptions
};

export { PatternDetector } from './patternDetector';
export { NameGenerator } from './nameGenerator';

/**
 * Component Splitter class
 */
export class ComponentSplitter {
  private options: Required<SplitterOptions>;
  private patternDetector: PatternDetector;
  private nameGenerator: NameGenerator;
  private componentIdCounter: number;
  private extractedComponents: Map<string, ComponentDefinition>;

  // Semantic HTML tags that should be components
  private readonly SEMANTIC_TAGS = new Set([
    'header', 'nav', 'main', 'footer', 'article', 'section',
    'aside', 'figure', 'figcaption', 'dialog', 'details', 'summary'
  ]);

  // Container class patterns
  private readonly CONTAINER_PATTERNS = [
    /container/i,
    /wrapper/i,
    /layout/i,
    /grid/i,
    /flex/i,
    /row/i,
    /col/i,
    /section/i
  ];

  // Interactive elements
  private readonly INTERACTIVE_TAGS = new Set([
    'button', 'a', 'input', 'textarea', 'select', 'form',
    'details', 'dialog'
  ]);

  constructor(options: SplitterOptions = {}) {
    this.options = {
      minElementCount: options.minElementCount ?? 3,
      maxComponentDepth: options.maxComponentDepth ?? 5,
      detectPatterns: options.detectPatterns ?? true,
      generateNames: options.generateNames ?? true,
      namingConvention: options.namingConvention ?? 'PascalCase',
      customComponentSelectors: options.customComponentSelectors ?? [],
      minPatternOccurrences: options.minPatternOccurrences ?? 2,
      similarityThreshold: options.similarityThreshold ?? 0.7,
      patternDetector: options.patternDetector ?? new PatternDetector({
        minPatternOccurrences: options.minPatternOccurrences ?? 2,
        similarityThreshold: options.similarityThreshold ?? 0.7
      }),
      nameGenerator: options.nameGenerator ?? new NameGenerator({
        convention: options.namingConvention ?? 'PascalCase'
      })
    };

    this.patternDetector = this.options.patternDetector;
    this.nameGenerator = this.options.nameGenerator;
    this.componentIdCounter = 0;
    this.extractedComponents = new Map();
  }

  /**
   * Split HTML into components
   */
  split(html: string): SplitResult {
    const startTime = performance.now();

    // Reset state
    this.componentIdCounter = 0;
    this.extractedComponents.clear();

    // Parse HTML
    const root = this.parseHTML(html);
    if (!root) {
      return this.createEmptyResult();
    }

    // Detect patterns if enabled
    let patterns: PatternDetectionResult[] = [];
    if (this.options.detectPatterns) {
      patterns = this.patternDetector.detectPatterns(html);
    }

    // Extract components
    const components = this.extractComponents(root, patterns);

    // Build component tree
    const tree = this.buildComponentTree(components);

    // Calculate metadata
    const metadata = this.calculateMetadata(components, patterns, startTime);

    return {
      components,
      patterns,
      tree,
      metadata
    };
  }

  /**
   * Parse HTML string to DOM
   */
  private parseHTML(html: string): Element | null {
    const trimmed = html.trim();
    if (!trimmed) {
      return null;
    }

    const temp = document.createElement('div');
    temp.innerHTML = trimmed;

    // Get root element
    const root = temp.firstElementChild;

    // If multiple root elements, wrap in fragment
    if (!root && temp.childNodes.length > 0) {
      return temp;
    }

    return root || temp;
  }

  /**
   * Extract components from DOM tree
   */
  private extractComponents(
    root: Element,
    patterns: PatternDetectionResult[]
  ): ComponentDefinition[] {
    const components: ComponentDefinition[] = [];
    const visited = new Set<Element>();
    const existingNames = new Set<string>();

    // Process DOM tree
    this.processElement(root, components, visited, existingNames, patterns, 0);

    return components;
  }

  /**
   * Process an element and its children
   */
  private processElement(
    element: Element,
    components: ComponentDefinition[],
    visited: Set<Element>,
    existingNames: Set<string>,
    patterns: PatternDetectionResult[],
    depth: number
  ): void {
    // Check depth limit
    if (depth > this.options.maxComponentDepth) {
      return;
    }

    // Skip if already visited
    if (visited.has(element)) {
      return;
    }
    visited.add(element);

    // Determine if this should be a component
    const extractResult = this.shouldExtractAsComponent(element, patterns, depth);

    if (extractResult.shouldExtract) {
      // Create component definition
      const component = this.createComponentDefinition(
        element,
        extractResult,
        depth,
        existingNames,
        patterns
      );

      components.push(component);
      this.extractedComponents.set(component.id, component);
      existingNames.add(component.name);

      // Process children (they might be nested components)
      for (const child of Array.from(element.children)) {
        this.processElement(child, components, visited, existingNames, patterns, depth + 1);
      }
    } else {
      // Not a component, recurse to children
      for (const child of Array.from(element.children)) {
        this.processElement(child, components, visited, existingNames, patterns, depth);
      }
    }
  }

  /**
   * Determine if element should be extracted as component
   */
  private shouldExtractAsComponent(
    element: Element,
    patterns: PatternDetectionResult[],
    _depth: number
  ): ElementExtractResult {
    const tagName = element.tagName.toLowerCase();
    const classes = Array.from(element.classList);
    const hasClasses = classes.length > 0;

    // Priority 1: Semantic HTML tags
    if (this.SEMANTIC_TAGS.has(tagName)) {
      return {
        shouldExtract: true,
        confidence: 0.95,
        suggestedName: this.nameGenerator.generateName({
          element,
          type: tagName
        }),
        reason: 'semantic-tag'
      };
    }

    // Priority 2: Custom selectors
    for (const selector of this.options.customComponentSelectors) {
      try {
        if (element.matches(selector)) {
          return {
            shouldExtract: true,
            confidence: 0.9,
            suggestedName: this.nameGenerator.generateName({ element }),
            reason: 'custom-selector'
          };
        }
      } catch {
        // Invalid selector, skip
      }
    }

    // Priority 3: Repeating patterns
    const selector = this.getElementSelector(element);
    if (selector && patterns && patterns.length > 0) {
      for (const pattern of patterns) {
        if (pattern.elements && pattern.elements.some(e => e.includes(selector))) {
          return {
            shouldExtract: true,
            confidence: pattern.confidence,
            suggestedName: this.nameGenerator.generateName({
              element,
              type: pattern.pattern
            }),
            reason: 'repeating-pattern',
            pattern
          };
        }
      }
    }

    // Priority 4: Class-based patterns (BEM, containers)
    if (hasClasses) {
      // BEM blocks
      const bemBlock = classes.find(c => !c.includes('__') && !c.includes('--'));
      if (bemBlock && this.isSignificantElement(element)) {
        return {
          shouldExtract: true,
          confidence: 0.7,
          suggestedName: this.nameGenerator.generateName({ element }),
          reason: 'class-pattern'
        };
      }

      // Container patterns
      if (classes.some(c => this.CONTAINER_PATTERNS.some(p => p.test(c)))) {
        return {
          shouldExtract: true,
          confidence: 0.65,
          suggestedName: this.nameGenerator.generateName({ element }),
          reason: 'class-pattern'
        };
      }
    }

    // Priority 5: Complex structure
    if (this.isComplexStructure(element)) {
      return {
        shouldExtract: true,
        confidence: 0.6,
        suggestedName: this.nameGenerator.generateName({
          element,
          context: { hasChildren: true, childCount: element.children.length }
        }),
        reason: 'complex-structure'
      };
    }

    // Don't extract
    return {
      shouldExtract: false,
      confidence: 0,
      suggestedName: '',
      reason: 'user-defined'
    };
  }

  /**
   * Check if element is significant enough to be a component
   */
  private isSignificantElement(element: Element): boolean {
    // Check child count
    if (element.children.length < this.options.minElementCount) {
      return false;
    }

    // Check text content ratio
    const textLength = element.textContent?.length || 0;
    const totalLength = element.outerHTML.length;
    const textRatio = textLength / totalLength;

    // If mostly text (not structure), don't extract
    if (textRatio > 0.8) {
      return false;
    }

    return true;
  }

  /**
   * Check if element has complex nested structure
   */
  private isComplexStructure(element: Element): boolean {
    // Must have multiple children
    if (element.children.length < 2) {
      return false;
    }

    // Check for nested structure
    let maxDepth = 0;
    const checkDepth = (el: Element, currentDepth: number) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      for (const child of Array.from(el.children)) {
        checkDepth(child, currentDepth + 1);
      }
    };

    checkDepth(element, 0);
    return maxDepth >= 2;
  }

  /**
   * Get CSS selector for element
   */
  private getElementSelector(element: Element): string | null {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Create component definition
   */
  private createComponentDefinition(
    element: Element,
    extractResult: ElementExtractResult,
    depth: number,
    existingNames: Set<string>,
    _patterns: PatternDetectionResult[]
  ): ComponentDefinition {
    // Generate unique ID
    const id = this.generateComponentId();

    // Generate unique name
    const baseName = extractResult.suggestedName;
    const name = this.nameGenerator.generateUniqueName(baseName, Array.from(existingNames));

    // Determine component role
    const role = this.determineComponentRole(element);

    // Parse BEM type
    const bemType = this.parseBEMType(element);

    // Detect pattern membership
    let patternId: string | undefined;
    if (extractResult.pattern) {
      patternId = extractResult.pattern.pattern;
    }

    // Generate suggested props
    const suggestedProps = this.suggestProps(element, extractResult);

    // Build metadata
    const metadata = this.buildComponentMetadata(element, extractResult);

    return {
      id,
      name,
      type: element.tagName.toLowerCase(),
      html: element.outerHTML,
      depth,
      classes: Array.from(element.classList),
      bemType,
      role,
      patternId,
      suggestedProps,
      metadata
    };
  }

  /**
   * Determine component role
   */
  private determineComponentRole(element: Element): ComponentRole {
    const tagName = element.tagName.toLowerCase();

    // Semantic tags
    if (this.SEMANTIC_TAGS.has(tagName)) {
      return 'semantic';
    }

    // Interactive elements
    if (this.INTERACTIVE_TAGS.has(tagName)) {
      return 'interactive';
    }

    // Media elements
    if (['img', 'picture', 'video', 'audio', 'canvas', 'svg'].includes(tagName)) {
      return 'media';
    }

    // Data display
    if (['table', 'ul', 'ol', 'dl'].includes(tagName)) {
      return 'data';
    }

    // Navigation
    const classes = Array.from(element.classList);
    if (classes.some(c => /nav|menu|breadcrumb|pagination/i.test(c))) {
      return 'navigation';
    }

    // Layout containers
    if (classes.some(c => this.CONTAINER_PATTERNS.some(p => p.test(c)))) {
      return 'layout';
    }

    // Content display
    if (classes.some(c => /card|article|post|item|entry/i.test(c))) {
      return 'content';
    }

    return 'unknown';
  }

  /**
   * Parse BEM classification from element
   */
  private parseBEMType(element: Element): {
    block?: string;
    element?: string;
    modifier?: string;
  } | undefined {
    const classes = Array.from(element.classList);

    for (const cls of classes) {
      // BEM element: block__element
      const elementMatch = cls.match(/^(.+)__([^_]+)$/);
      if (elementMatch) {
        return {
          block: elementMatch[1],
          element: elementMatch[2]
        };
      }

      // BEM modifier: block--modifier
      const modifierMatch = cls.match(/^(.+)--(.+)$/);
      if (modifierMatch) {
        return {
          block: modifierMatch[1],
          modifier: modifierMatch[2]
        };
      }
    }

    return undefined;
  }

  /**
   * Suggest props based on element analysis
   */
  private suggestProps(
    element: Element,
    extractResult: ElementExtractResult
  ): Array<{ name: string; type: PropType; required: boolean }> {
    const props: Array<{ name: string; type: PropType; required: boolean }> = [];

    // Always add className prop
    props.push({ name: 'className', type: 'string', required: false });

    // Add children prop if element has children
    if (element.children.length > 0) {
      props.push({ name: 'children', type: 'ReactNode', required: false });
    }

    // Add onClick for interactive elements
    if (this.INTERACTIVE_TAGS.has(element.tagName.toLowerCase())) {
      props.push({ name: 'onClick', type: 'Function', required: false });
    }

    // Add src/alt for images
    if (element.tagName.toLowerCase() === 'img') {
      props.push({ name: 'src', type: 'string', required: true });
      props.push({ name: 'alt', type: 'string', required: true });
    }

    // Add href for links
    if (element.tagName.toLowerCase() === 'a') {
      props.push({ name: 'href', type: 'string', required: true });
    }

    // Add pattern-specific props
    if (extractResult.pattern) {
      props.push({
        name: 'variant',
        type: 'string',
        required: false
      });
    }

    return props;
  }

  /**
   * Build component metadata
   */
  private buildComponentMetadata(
    element: Element,
    extractResult: ElementExtractResult
  ) {
    const childTypes = Array.from(element.children).map(c => c.tagName.toLowerCase());

    return {
      elementCount: element.querySelectorAll('*').length,
      textLength: element.textContent?.length || 0,
      hasInteractive: Array.from(element.querySelectorAll(
        'button, a, input, textarea, select, form'
      )).length > 0,
      hasForms: element.querySelector('form') !== null,
      hasImages: element.querySelector('img') !== null,
      childTypes,
      isPatternItem: extractResult.reason === 'repeating-pattern'
    };
  }

  /**
   * Generate unique component ID
   */
  private generateComponentId(): string {
    return `component-${++this.componentIdCounter}`;
  }

  /**
   * Build component tree from components
   */
  private buildComponentTree(components: ComponentDefinition[]): ComponentTree {
    const nodes: Record<string, ComponentTreeNode> = {};
    const edges: ComponentEdge[] = [];

    // Handle empty components
    if (components.length === 0) {
      return {
        root: '',
        nodes: {},
        edges: []
      };
    }

    // Create nodes
    for (const component of components) {
      nodes[component.id] = {
        id: component.id,
        component,
        childIds: [],
        depth: component.depth,
        siblings: []
      };
    }

    // Find root component (shallowest depth, no parent in set)
    const rootCandidates = components.filter(c => !c.parentId);
    const root = rootCandidates.length > 0
      ? rootCandidates.reduce((a, b) => a.depth <= b.depth ? a : b)
      : components[0];

    // Build edges and relationships
    for (const component of components) {
      if (component.children && component.children.length > 0) {
        for (const childId of component.children) {
          edges.push({
            from: component.id,
            to: childId,
            type: 'contains'
          });

          if (nodes[component.id]) {
            nodes[component.id].childIds.push(childId);
          }

          if (nodes[childId]) {
            nodes[childId].parentId = component.id;
          }
        }
      }
    }

    // Calculate siblings
    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      if (node.parentId && nodes[node.parentId]) {
        const parent = nodes[node.parentId];
        node.siblings = parent.childIds.filter(id => id !== nodeId);
      }
    }

    return {
      root: root.id,
      nodes,
      edges
    };
  }

  /**
   * Calculate result metadata
   */
  private calculateMetadata(
    components: ComponentDefinition[],
    patterns: PatternDetectionResult[],
    startTime: number
  ): SplitMetadata {
    const processingTime = performance.now() - startTime;

    // Count by type
    const byType: Record<string, number> = {};
    const byRole: Record<string, number> = {};
    const byDepth: Record<number, number> = {};

    for (const component of components) {
      byType[component.type] = (byType[component.type] || 0) + 1;
      byRole[component.role || 'unknown'] = (byRole[component.role || 'unknown'] || 0) + 1;
      byDepth[component.depth] = (byDepth[component.depth] || 0) + 1;
    }

    // Pattern stats
    const totalPatternItems = (patterns && patterns.length > 0)
      ? patterns.reduce((sum, p) => sum + p.count, 0)
      : 0;
    const avgConfidence = (patterns && patterns.length > 0)
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0;

    return {
      totalComponents: components.length,
      maxDepth: components.length > 0 ? Math.max(...components.map(c => c.depth), 0) : 0,
      processingTime,
      componentCounts: {
        byType,
        byRole: byRole as Record<string, number>,
        byDepth
      },
      patternStats: {
        totalPatterns: (patterns && patterns.length) || 0,
        totalPatternItems,
        averageConfidence: avgConfidence
      },
      sourceStats: {
        totalElements: components.reduce((sum, c) => sum + (c.metadata?.elementCount || 0), 0),
        totalNodes: components.length,
        textContentRatio: components.reduce((sum, c) =>
          sum + (c.metadata?.textLength || 0), 0) / Math.max(components.reduce((sum, c) =>
          sum + c.html.length, 0), 1)
      }
    };
  }

  /**
   * Create empty result
   */
  private createEmptyResult(): SplitResult {
    return {
      components: [],
      patterns: [],
      tree: {
        root: '',
        nodes: {},
        edges: []
      },
      metadata: {
        totalComponents: 0,
        maxDepth: 0,
        processingTime: 0,
        componentCounts: {
          byType: {},
          byRole: {} as Record<string, number>,
          byDepth: {}
        },
        patternStats: {
          totalPatterns: 0,
          totalPatternItems: 0,
          averageConfidence: 0
        },
        sourceStats: {
          totalElements: 0,
          totalNodes: 0,
          textContentRatio: 0
        }
      }
    };
  }
}

/**
 * Create a component splitter with default options
 */
export function createComponentSplitter(options?: SplitterOptions): ComponentSplitter {
  return new ComponentSplitter(options);
}
