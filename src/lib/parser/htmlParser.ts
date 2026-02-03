/**
 * HTML Parser
 *
 * Core HTML parsing module that converts HTML strings into a structured
 * parsed representation suitable for React component generation.
 * Uses the DOMParser API for robust HTML parsing.
 */

import {
  ParsedNode,
  ParsedDocument,
  ParserOptions,
  DocumentMetadata,
  ParserProgress,
} from '@/types/parser.types';
import { AttributeExtractor } from './attributeExtractor';
import { SemanticAnalyzer } from './semanticAnalyzer';

/**
 * Unique ID generator for parsed nodes
 */
class IdGenerator {
  private counter = 0;
  private prefix = 'node';

  next(): string {
    return `${this.prefix}-${this.counter++}`;
  }

  reset(): void {
    this.counter = 0;
  }
}

/**
 * HTML Parser class
 *
 * Main entry point for parsing HTML documents into a structured format
 * that can be used for React component generation.
 */
export class HTMLParser {
  private idGenerator: IdGenerator;
  private attributeExtractor: AttributeExtractor;
  private semanticAnalyzer: SemanticAnalyzer;

  constructor() {
    this.idGenerator = new IdGenerator();
    this.attributeExtractor = new AttributeExtractor();
    this.semanticAnalyzer = new SemanticAnalyzer();
  }

  /**
   * Parse HTML string into a structured document
   *
   * @param html - HTML source code to parse
   * @param options - Parser configuration options
   * @returns Parsed document with all nodes and metadata
   */
  parse(html: string, options: ParserOptions = {}): ParsedDocument {
    // Validate input
    if (html == null) {
      throw new Error('HTML input cannot be null or undefined');
    }

    // Trim and handle empty input
    html = html.trim();
    if (html === '') {
      return this.createEmptyDocument();
    }

    // Reset state
    this.idGenerator.reset();

    // Report progress
    this.reportProgress(options, { stage: 'parsing', processed: 0, total: 0 });

    // Parse HTML using DOMParser
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(html, 'text/html');

    // Extract metadata from head
    const metadata = this.extractMetadata(doc, html);

    // Build the node tree
    const nodes = new Map<string, ParsedNode>();
    const maxDepth = { value: 0 };
    const nodeCount = { value: 0 };

    // Get the direct children of body as the root nodes
    const bodyChildren = Array.from(doc.body.childNodes);

    // If there's only one root element, use it as the root
    // Otherwise, create a fragment wrapper
    let root: ParsedNode;

    if (bodyChildren.length === 1 && bodyChildren[0] instanceof Element) {
      // Single root element - use it directly
      root = this.processElement(
        bodyChildren[0] as Element,
        null,
        0,
        nodes,
        maxDepth,
        nodeCount,
        options
      );
    } else {
      // Multiple roots or mixed content - create a fragment
      const children: ParsedNode[] = [];
      for (const child of bodyChildren) {
        const node = this.processChild(
          child,
          null,
          1,
          nodes,
          maxDepth,
          nodeCount,
          options
        );
        if (node) {
          children.push(node);
        }
      }
      root = this.createFragmentNode(children, 0);
      nodes.set(root.id, root);
      nodeCount.value++;
    }

    // Finalize metadata
    metadata.nodeCount = nodeCount.value;
    metadata.maxDepth = maxDepth.value;
    this.collectUniqueInfo(nodes, metadata);

    // Report progress
    this.reportProgress(options, {
      stage: 'analyzing',
      processed: nodeCount.value,
      total: nodeCount.value,
    });

    // Analyze semantic sections
    const sections = this.semanticAnalyzer.analyze(root, options.semanticRules);

    // Report completion
    this.reportProgress(options, {
      stage: 'complete',
      processed: nodeCount.value,
      total: nodeCount.value,
    });

    return {
      root,
      nodes,
      metadata,
      sections,
    };
  }

  /**
   * Create an empty document for empty input
   */
  private createEmptyDocument(): ParsedDocument {
    const root: ParsedNode = {
      id: 'node-0',
      type: 'fragment',
      children: [],
      attributes: { html: {}, events: [] },
      depth: 0,
    };

    return {
      root,
      nodes: new Map([[root.id, root]]),
      metadata: {
        source: '',
        nodeCount: 1,
        maxDepth: 0,
        uniqueTags: [],
        uniqueClasses: [],
        uniqueIds: [],
      },
      sections: [],
    };
  }

  /**
   * Process a child node
   */
  private processChild(
    child: ChildNode,
    parent: ParsedNode | null,
    depth: number,
    nodes: Map<string, ParsedNode>,
    maxDepth: { value: number },
    nodeCount: { value: number },
    options: ParserOptions
  ): ParsedNode | null {
    // Check max depth
    if (options.maxDepth !== undefined && depth > options.maxDepth) {
      return null;
    }

    if (child instanceof Element) {
      return this.processElement(child, parent, depth, nodes, maxDepth, nodeCount, options);
    } else if (child instanceof Text) {
      return this.processText(child, parent, depth, nodes, nodeCount, options);
    } else if (child instanceof Comment && options.includeComments) {
      return this.processComment(child, parent, depth, nodes, nodeCount);
    }

    return null;
  }

  /**
   * Process an element node
   */
  private processElement(
    element: Element,
    parent: ParsedNode | null,
    depth: number,
    nodes: Map<string, ParsedNode>,
    maxDepth: { value: number },
    nodeCount: { value: number },
    options: ParserOptions
  ): ParsedNode {
    // Update max depth
    if (depth > maxDepth.value) {
      maxDepth.value = depth;
    }

    const tagName = element.tagName.toLowerCase();
    const attributes = this.attributeExtractor.extract(element);

    // Process children
    const children: ParsedNode[] = [];
    const childNodes = Array.from(element.childNodes);

    for (const child of childNodes) {
      const childNode = this.processChild(
        child,
        null,
        depth + 1,
        nodes,
        maxDepth,
        nodeCount,
        options
      );
      if (childNode) {
        childNode.parent = undefined; // Will be set after node creation
        children.push(childNode);
      }
    }

    // Create the node
    const node: ParsedNode = {
      id: this.idGenerator.next(),
      type: 'element',
      tagName,
      attributes,
      children,
      depth,
      parent: parent ?? undefined,
    };

    // Update parent references
    for (const child of children) {
      child.parent = node;
    }

    // Store in map
    nodes.set(node.id, node);
    nodeCount.value++;

    return node;
  }

  /**
   * Process a text node
   */
  private processText(
    text: Text,
    parent: ParsedNode | null,
    depth: number,
    nodes: Map<string, ParsedNode>,
    nodeCount: { value: number },
    options: ParserOptions
  ): ParsedNode | null {
    const content = text.textContent || '';

    // Skip whitespace-only nodes unless preserving
    if (!options.preserveWhitespace && !content.trim()) {
      return null;
    }

    const node: ParsedNode = {
      id: this.idGenerator.next(),
      type: 'text',
      textContent: content,
      attributes: { html: {}, events: [] },
      children: [],
      depth,
      parent: parent ?? undefined,
    };

    nodes.set(node.id, node);
    nodeCount.value++;

    return node;
  }

  /**
   * Process a comment node
   */
  private processComment(
    comment: Comment,
    parent: ParsedNode | null,
    depth: number,
    nodes: Map<string, ParsedNode>,
    nodeCount: { value: number }
  ): ParsedNode {
    const node: ParsedNode = {
      id: this.idGenerator.next(),
      type: 'comment',
      textContent: comment.textContent || '',
      attributes: { html: {}, events: [] },
      children: [],
      depth,
      parent: parent ?? undefined,
    };

    nodes.set(node.id, node);
    nodeCount.value++;

    return node;
  }

  /**
   * Create a fragment node
   */
  private createFragmentNode(children: ParsedNode[], depth: number): ParsedNode {
    return {
      id: this.idGenerator.next(),
      type: 'fragment',
      children,
      attributes: { html: {}, events: [] },
      depth,
    };
  }

  /**
   * Extract document metadata
   */
  private extractMetadata(doc: Document, source: string): DocumentMetadata {
    const metadata: DocumentMetadata = {
      source,
      nodeCount: 0,
      maxDepth: 0,
      uniqueTags: [],
      uniqueClasses: [],
      uniqueIds: [],
    };

    // Extract title
    const titleEl = doc.querySelector('title');
    if (titleEl) {
      metadata.title = titleEl.textContent || undefined;
    }

    // Extract html lang attribute
    const htmlEl = doc.documentElement;
    if (htmlEl) {
      metadata.lang = htmlEl.getAttribute('lang') || undefined;
    }

    // Extract charset
    const charsetMeta = doc.querySelector('meta[charset]');
    if (charsetMeta) {
      metadata.charset = charsetMeta.getAttribute('charset') || undefined;
    }

    // Extract viewport
    const viewportMeta = doc.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      metadata.viewport = viewportMeta.getAttribute('content') || undefined;
    }

    return metadata;
  }

  /**
   * Collect unique tags, classes, and IDs from all nodes
   */
  private collectUniqueInfo(nodes: Map<string, ParsedNode>, metadata: DocumentMetadata): void {
    const tags = new Set<string>();
    const classes = new Set<string>();
    const ids = new Set<string>();

    for (const node of nodes.values()) {
      if (node.type === 'element' && node.tagName) {
        tags.add(node.tagName);

        // Collect classes
        const className = node.attributes.className;
        if (className && typeof className === 'string') {
          className.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
        }

        // Collect ID
        const id = node.attributes.html.id;
        if (id && typeof id === 'string') {
          ids.add(id);
        }
      }
    }

    metadata.uniqueTags = Array.from(tags);
    metadata.uniqueClasses = Array.from(classes);
    metadata.uniqueIds = Array.from(ids);
  }

  /**
   * Report parsing progress if callback is provided
   */
  private reportProgress(options: ParserOptions, progress: ParserProgress): void {
    if (options.onProgress) {
      try {
        options.onProgress(progress);
      } catch (error) {
        // Suppress errors in progress callbacks
        console.warn('Progress callback error:', error);
      }
    }
  }
}

/**
 * Default parser instance
 */
export const defaultParser = new HTMLParser();

/**
 * Convenience function to parse HTML
 *
 * @param html - HTML string to parse
 * @param options - Parser options
 * @returns Parsed document
 */
export function parseHTML(html: string, options?: ParserOptions): ParsedDocument {
  return defaultParser.parse(html, options);
}
