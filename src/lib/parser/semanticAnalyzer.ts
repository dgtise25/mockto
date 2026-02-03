/**
 * Semantic Analyzer
 *
 * Analyzes parsed HTML to identify semantic sections and suggest
 * component boundaries. This helps determine what should become
 * separate React components.
 */

import {
  ParsedNode,
  SemanticSection,
  SemanticType,
  SemanticRule,
  SemanticAnalysisResult,
  ParsedDocument,
} from '@/types/parser.types';

/**
 * Semantic patterns for detecting component boundaries
 */
const SEMANTIC_PATTERNS = {
  // Header patterns
  header: {
    tags: ['header', 'masthead'],
    classes: ['header', 'site-header', 'page-header', 'main-header', 'top-bar'],
    minDepth: 0,
    maxDepth: 2,
  },

  // Navigation patterns
  nav: {
    tags: ['nav', 'navigation'],
    classes: ['nav', 'navbar', 'navigation', 'menu', 'main-menu', 'top-nav'],
    minDepth: 0,
    maxDepth: 3,
  },

  // Main content patterns
  main: {
    tags: ['main', 'article'],
    classes: ['main', 'content', 'main-content', 'primary-content'],
    minDepth: 0,
    maxDepth: 2,
  },

  // Sidebar patterns
  aside: {
    tags: ['aside', 'sidebar'],
    classes: ['aside', 'sidebar', 'side-bar', 'secondary-content'],
    minDepth: 0,
    maxDepth: 2,
  },

  // Footer patterns
  footer: {
    tags: ['footer'],
    classes: ['footer', 'site-footer', 'page-footer', 'bottom-bar'],
    minDepth: 0,
    maxDepth: 2,
  },

  // Section patterns
  section: {
    tags: ['section'],
    classes: ['section'],
    minDepth: 1,
    maxDepth: 5,
  },

  // Article patterns
  article: {
    tags: ['article'],
    classes: ['article', 'post', 'entry'],
    minDepth: 1,
    maxDepth: 5,
  },

  // Figure patterns
  figure: {
    tags: ['figure'],
    classes: ['figure', 'image', 'media'],
    minDepth: 0,
    maxDepth: 5,
  },

  // Form patterns
  form: {
    tags: ['form'],
    classes: ['form', 'search-form', 'login-form'],
    minDepth: 0,
    maxDepth: 5,
  },

  // Table patterns
  table: {
    tags: ['table'],
    classes: ['table', 'data-table'],
    minDepth: 0,
    maxDepth: 5,
  },

  // List patterns
  list: {
    tags: ['ul', 'ol', 'dl'],
    classes: ['list', 'items', 'listing'],
    minDepth: 0,
    maxDepth: 5,
  },

  // Card patterns (common UI pattern)
  card: {
    tags: [],
    classes: ['card', 'panel', 'box', 'tile'],
    minDepth: 1,
    maxDepth: 5,
  },

  // Hero section patterns
  hero: {
    tags: [],
    classes: ['hero', 'banner', 'jumbotron', 'showcase'],
    minDepth: 0,
    maxDepth: 3,
  },
};

/**
 * Component name generators for each semantic type
 */
const COMPONENT_NAME_TEMPLATES: Record<SemanticType, string> = {
  header: 'Header',
  nav: 'Navigation',
  main: 'MainContent',
  aside: 'Sidebar',
  footer: 'Footer',
  section: 'Section',
  article: 'Article',
  figure: 'Figure',
  form: 'Form',
  table: 'Table',
  list: 'List',
  card: 'Card',
  hero: 'Hero',
  none: 'Component',
};

/**
 * Semantic Analyzer class
 *
 * Analyzes parsed HTML nodes to identify semantic sections
 * that should become separate React components.
 */
export class SemanticAnalyzer {
  private customRules: SemanticRule[] = [];

  /**
   * Analyze a parsed document for semantic sections
   *
   * @param root - Root node to analyze
   * @param customRules - Optional custom semantic rules
   * @returns Array of detected semantic sections
   */
  analyze(root: ParsedNode, customRules?: SemanticRule[]): SemanticSection[] {
    const sections: SemanticSection[] = [];
    this.customRules = customRules || [];

    // Perform analysis
    this.analyzeNode(root, sections);

    // Post-process sections
    return this.postProcessSections(sections);
  }

  /**
   * Analyze a single node and its children
   */
  private analyzeNode(node: ParsedNode, sections: SemanticSection[]): void {
    // Try to identify semantic type
    const semanticType = this.identifySemanticType(node);

    if (semanticType !== 'none') {
      const section = this.createSection(node, semanticType);
      sections.push(section);
    }

    // Recursively analyze children
    for (const child of node.children) {
      this.analyzeNode(child, sections);
    }
  }

  /**
   * Identify the semantic type of a node
   */
  private identifySemanticType(node: ParsedNode): SemanticType {
    // Skip non-element nodes
    if (node.type !== 'element') {
      return 'none';
    }

    // Check custom rules first
    for (const rule of this.customRules) {
      if (this.matchesRule(node, rule)) {
        return rule.type;
      }
    }

    // Check class-based patterns FIRST (for things like hero, card, etc.)
    // These should take precedence over generic tag matching
    if (node.attributes.className) {
      const classes = node.attributes.className.split(/\s+/).filter(Boolean);

      // Check for card classes
      if (classes.some(c => SEMANTIC_PATTERNS.card.classes.includes(c))) {
        return 'card';
      }

      // Check for hero classes
      if (classes.some(c => SEMANTIC_PATTERNS.hero.classes.includes(c))) {
        return 'hero';
      }
    }

    // Direct tag name matches - highest confidence
    if (node.tagName) {
      if (node.tagName === 'header' || node.tagName === 'masthead') {
        return 'header';
      }
      if (node.tagName === 'nav' || node.tagName === 'navigation') {
        return 'nav';
      }
      if (node.tagName === 'main' || node.tagName === 'article') {
        return node.tagName === 'article' ? 'article' : 'main';
      }
      if (node.tagName === 'aside' || node.tagName === 'sidebar') {
        return 'aside';
      }
      if (node.tagName === 'footer') {
        return 'footer';
      }
      // Only return 'section' if not already classified as hero
      if (node.tagName === 'section') {
        return 'section';
      }
      if (node.tagName === 'figure') {
        return 'figure';
      }
      if (node.tagName === 'form') {
        return 'form';
      }
      if (node.tagName === 'table') {
        return 'table';
      }
      if (node.tagName === 'ul' || node.tagName === 'ol' || node.tagName === 'dl') {
        return 'list';
      }
    }

    return 'none';
  }

  /**
   * Check if a node matches a custom rule
   */
  private matchesRule(node: ParsedNode, rule: SemanticRule): boolean {
    // Simple selector matching (can be extended for more complex selectors)
    if (rule.selector.startsWith('.')) {
      const className = rule.selector.slice(1);
      return this.hasClass(node, className);
    }

    if (rule.selector.startsWith('#')) {
      const id = rule.selector.slice(1);
      return node.attributes.html.id === id;
    }

    if (rule.selector.startsWith('[') && rule.selector.endsWith(']')) {
      const attrMatch = rule.selector.slice(1, -1).split('=');
      if (attrMatch.length === 2) {
        const [attr, value] = attrMatch;
        return node.attributes.html[attr] === value.replace(/['"]/g, '');
      }
    }

    // Tag name selector
    if (node.tagName === rule.selector) {
      return true;
    }

    return false;
  }

  /**
   * Calculate confidence score for a semantic pattern
   */
  private calculateConfidence(
    node: ParsedNode,
    patterns: any
  ): number {
    let score = 0;

    // Check tag name
    if (node.tagName && patterns.tags.includes(node.tagName as string)) {
      score += 0.9;
    }

    // Check class names
    if (node.attributes.className) {
      const classes = node.attributes.className.split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        if (patterns.classes.includes(cls)) {
          score += 0.4;
          break;
        }
        // Partial match
        for (const pattern of patterns.classes) {
          if (cls.includes(pattern) || pattern.includes(cls)) {
            score += 0.2;
            break;
          }
        }
      }
    }

    // Normalize score to 0-1
    return Math.min(score, 1);
  }

  /**
   * Check if a node has a specific class
   */
  private hasClass(node: ParsedNode, className: string): boolean {
    const classes = node.attributes.className?.split(/\s+/).filter(Boolean) || [];
    return classes.includes(className);
  }

  /**
   * Create a semantic section from a node
   */
  private createSection(node: ParsedNode, type: SemanticType): SemanticSection {
    // For tag-based matches, we use high confidence
    // For class-based matches, we calculate from patterns
    let confidence: number;

    if (node.tagName && this.isTagMatchForType(node.tagName, type)) {
      confidence = 1.0; // Tag match gets highest confidence
    } else {
      // Get patterns for this type, or use empty patterns as fallback
      const patterns = SEMANTIC_PATTERNS[type as keyof typeof SEMANTIC_PATTERNS] || { tags: [], classes: [], minDepth: 0, maxDepth: 10 };
      confidence = this.calculateConfidence(node, patterns);
    }

    const componentName = this.generateComponentName(node, type);

    // Collect all nodes in this section
    const nodes: ParsedNode[] = [];
    this.collectNodes(node, nodes);

    // Generate reasoning
    const reasoning = this.generateReasoning(node, type);

    return {
      type,
      node,
      componentName,
      nodes,
      confidence,
      reasoning,
    };
  }

  /**
   * Check if a tag name directly matches a semantic type
   */
  private isTagMatchForType(tagName: string, type: SemanticType): boolean {
    if (!tagName) return false;

    switch (type) {
      case 'header':
        return tagName === 'header' || tagName === 'masthead';
      case 'nav':
        return tagName === 'nav' || tagName === 'navigation';
      case 'main':
        return tagName === 'main';
      case 'article':
        return tagName === 'article';
      case 'aside':
        return tagName === 'aside' || tagName === 'sidebar';
      case 'footer':
        return tagName === 'footer';
      case 'section':
        return tagName === 'section';
      case 'figure':
        return tagName === 'figure';
      case 'form':
        return tagName === 'form';
      case 'table':
        return tagName === 'table';
      case 'list':
        return tagName === 'ul' || tagName === 'ol' || tagName === 'dl';
      default:
        return false;
    }
  }

  /**
   * Generate a component name for a semantic section
   */
  private generateComponentName(node: ParsedNode, type: SemanticType): string {
    // Check custom rules first
    for (const rule of this.customRules) {
      if (this.matchesRule(node, rule) && rule.componentNameTemplate) {
        return rule.componentNameTemplate;
      }
    }

    // Use base template
    let baseName = COMPONENT_NAME_TEMPLATES[type];

    // Try to make name more specific based on classes or IDs
    const id = node.attributes.html.id;
    const className = node.attributes.className?.split(/\s+/)[0];

    if (id && typeof id === 'string') {
      // Convert ID to PascalCase
      const specificName = this.toPascalCase(id);
      return `${baseName}${specificName}`;
    }

    if (className) {
      const specificName = this.toPascalCase(className);
      return `${baseName}${specificName}`;
    }

    return baseName;
  }

  /**
   * Convert a string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Collect all descendant nodes
   */
  private collectNodes(node: ParsedNode, collection: ParsedNode[]): void {
    collection.push(node);
    for (const child of node.children) {
      this.collectNodes(child, collection);
    }
  }

  /**
   * Generate reasoning for classification
   */
  private generateReasoning(node: ParsedNode, type: SemanticType): string {
    const reasons: string[] = [];

    if (node.tagName === type) {
      reasons.push(`Tag name matches semantic type "${type}"`);
    }

    if (node.attributes.className) {
      const classes = node.attributes.className.split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        if (cls.includes(type) || cls === type) {
          reasons.push(`Class name "${cls}" suggests ${type} component`);
          break;
        }
      }
    }

    if (node.attributes.html.id) {
      reasons.push(`Has ID "${String(node.attributes.html.id)}"`);
    }

    return reasons.join('; ') || `Pattern matching detected ${type} component`;
  }

  /**
   * Post-process sections to remove duplicates and nested sections
   *
   * Strategy: Keep parent sections over child sections when there's overlap.
   * Only keep child sections if they're truly separate (not contained in a parent section).
   */
  private postProcessSections(sections: SemanticSection[]): SemanticSection[] {
    if (sections.length === 0) {
      return [];
    }

    // Sort by depth (shallowest first) so parents come before children
    const sorted = [...sections].sort((a, b) => {
      if (a.node.depth !== b.node.depth) {
        return a.node.depth - b.node.depth; // Shallowest first
      }
      return b.confidence - a.confidence; // Higher confidence first
    });

    // Filter out child sections that are contained within parent sections
    const filtered: SemanticSection[] = [];
    const keptRootIds = new Set<string>();

    for (const section of sorted) {
      const sectionRootId = section.node.id;

      // Check if this section's root is already contained in a kept section
      if (keptRootIds.has(sectionRootId)) {
        // This section is a duplicate or is nested within a kept section
        continue;
      }

      // Add this section
      filtered.push(section);

      // Mark all nodes in this section as "kept"
      for (const node of section.nodes) {
        keptRootIds.add(node.id);
      }
    }

    // Sort by document order for final output
    filtered.sort((a, b) => {
      const aId = parseInt(a.node.id.split('-')[1]);
      const bId = parseInt(b.node.id.split('-')[1]);
      return aId - bId;
    });

    return filtered;
  }

  /**
   * Get component name suggestions for all nodes
   *
   * @param document - Parsed document
   * @returns Map of node IDs to component names
   */
  getComponentNames(document: ParsedDocument): Map<string, string> {
    const names = new Map<string, string>();

    for (const section of document.sections) {
      for (const node of section.nodes) {
        names.set(node.id, section.componentName);
      }
    }

    return names;
  }

  /**
   * Get nodes that should be extracted as components
   *
   * @param document - Parsed document
   * @returns Array of extractable nodes
   */
  getExtractableNodes(document: ParsedDocument): ParsedNode[] {
    return document.sections.map(s => s.node);
  }

  /**
   * Perform complete semantic analysis
   *
   * @param document - Parsed document
   * @returns Complete analysis result
   */
  analyzeDocument(document: ParsedDocument): SemanticAnalysisResult {
    const componentNames = this.getComponentNames(document);
    const extractableNodes = this.getExtractableNodes(document);

    return {
      sections: document.sections,
      componentNames,
      extractableNodes,
    };
  }

  /**
   * Find sections by type
   *
   * @param document - Parsed document
   * @param type - Semantic type to find
   * @returns Array of matching sections
   */
  findSectionsByType(document: ParsedDocument, type: SemanticType): SemanticSection[] {
    return document.sections.filter(s => s.type === type);
  }

  /**
   * Find sections by confidence threshold
   *
   * @param document - Parsed document
   * @param minConfidence - Minimum confidence level (0-1)
   * @returns Array of matching sections
   */
  findSectionsByConfidence(document: ParsedDocument, minConfidence: number): SemanticSection[] {
    return document.sections.filter(s => s.confidence >= minConfidence);
  }

  /**
   * Get section containing a specific node
   *
   * @param document - Parsed document
   * @param nodeId - Node ID to search for
   * @returns Containing section or undefined
   */
  getSectionForNode(document: ParsedDocument, nodeId: string): SemanticSection | undefined {
    return document.sections.find(s => s.nodes.some(n => n.id === nodeId));
  }

  /**
   * Check if a node should be a separate component
   *
   * @param node - Node to check
   * @param document - Parsed document
   * @returns True if node should be extracted
   */
  shouldExtract(node: ParsedNode, document: ParsedDocument): boolean {
    return document.sections.some(s => s.node.id === node.id);
  }

  /**
   * Get recommended component hierarchy
   *
   * @param document - Parsed document
   * @returns Array of component relationships
   */
  getComponentHierarchy(document: ParsedDocument): Array<{
    section: SemanticSection;
    parent: SemanticSection | null;
    children: SemanticSection[];
  }> {
    const hierarchy: Array<{
      section: SemanticSection;
      parent: SemanticSection | null;
      children: SemanticSection[];
    }> = [];

    for (const section of document.sections) {
      const parent = this.findParentSection(section, document.sections);
      const children = this.findChildSections(section, document.sections);

      hierarchy.push({
        section,
        parent,
        children,
      });
    }

    return hierarchy;
  }

  /**
   * Find the parent section of a given section
   */
  private findParentSection(
    section: SemanticSection,
    allSections: SemanticSection[]
  ): SemanticSection | null {
    for (const other of allSections) {
      if (other === section) continue;

      // Check if section's node is in other's nodes
      if (other.nodes.some(n => n.id === section.node.id)) {
        return other;
      }
    }

    return null;
  }

  /**
   * Find child sections of a given section
   */
  private findChildSections(
    section: SemanticSection,
    allSections: SemanticSection[]
  ): SemanticSection[] {
    const children: SemanticSection[] = [];

    for (const other of allSections) {
      if (other === section) continue;

      // Check if other's node is in section's nodes
      if (section.nodes.some(n => n.id === other.node.id)) {
        children.push(other);
      }
    }

    return children;
  }
}

/**
 * Default semantic analyzer instance
 */
export const defaultSemanticAnalyzer = new SemanticAnalyzer();

/**
 * Convenience function to analyze semantics
 *
 * @param root - Root node to analyze
 * @param customRules - Optional custom rules
 * @returns Array of semantic sections
 */
export function analyzeSemantics(
  root: ParsedNode,
  customRules?: SemanticRule[]
): SemanticSection[] {
  return defaultSemanticAnalyzer.analyze(root, customRules);
}
