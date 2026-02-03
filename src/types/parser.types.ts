/**
 * HTML Parser Types
 *
 * Core type definitions for the HTML parsing module.
 * These types represent the parsed structure of HTML documents
 * that will be converted to React components.
 */

/**
 * Parsed HTML Node - Represents any node in the HTML tree
 */
export interface ParsedNode {
  /** Unique identifier for this node */
  id: string;
  /** Node type (element, text, comment, etc.) */
  type: NodeType;
  /** Tag name for element nodes (e.g., 'div', 'span') */
  tagName?: string;
  /** All HTML attributes including React-specific ones */
  attributes: ParsedAttributes;
  /** Child nodes */
  children: ParsedNode[];
  /** Text content for text nodes */
  textContent?: string;
  /** Semantic classification if applicable */
  semantic?: SemanticType;
  /** Position in source (for error reporting) */
  position?: SourcePosition;
  /** Parent node reference */
  parent?: ParsedNode;
  /** Depth in the tree */
  depth: number;
}

/**
 * Node type enumeration
 */
export type NodeType =
  | 'element'
  | 'text'
  | 'comment'
  | 'doctype'
  | 'cdata'
  | 'fragment';

/**
 * Semantic HTML element types
 * Used to identify sections that should become separate components
 */
export type SemanticType =
  | 'header'
  | 'nav'
  | 'main'
  | 'aside'
  | 'footer'
  | 'section'
  | 'article'
  | 'figure'
  | 'form'
  | 'table'
  | 'list'
  | 'card'
  | 'hero'
  | 'none';

/**
 * Parsed attributes with React compatibility
 */
export interface ParsedAttributes {
  /** Standard HTML attributes */
  html: Record<string, string | number | boolean>;
  /** React event handlers (onClick, onChange, etc.) */
  events: EventHandler[];
  /** Inline styles */
  style?: Record<string, string>;
  /** CSS class names */
  className?: string;
  /** Whether element has dangerous HTML (dangerouslySetInnerHTML) */
  hasDangerHtml?: boolean;
}

/**
 * React event handler
 */
export interface EventHandler {
  /** Event type (onClick, onChange, etc.) */
  type: string;
  /** Handler name or inline code */
  handler: string;
}

/**
 * Source position in original HTML
 */
export interface SourcePosition {
  /** Starting line number (1-indexed) */
  startLine: number;
  /** Starting column number (1-indexed) */
  startColumn: number;
  /** Ending line number */
  endLine: number;
  /** Ending column number */
  endColumn: number;
  /** Offset in characters */
  offset: number;
}

/**
 * Complete parsed HTML document
 */
export interface ParsedDocument {
  /** Root node of the document */
  root: ParsedNode;
  /** All nodes flattened (for quick lookup) */
  nodes: Map<string, ParsedNode>;
  /** Metadata about the document */
  metadata: DocumentMetadata;
  /** Detected semantic sections */
  sections: SemanticSection[];
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  /** Original HTML source */
  source: string;
  /** Document title if present */
  title?: string;
  /** Language attribute */
  lang?: string;
  /** Character set */
  charset?: string;
  /** Viewport meta tag */
  viewport?: string;
  /** Total number of nodes */
  nodeCount: number;
  /** Maximum depth of the tree */
  maxDepth: number;
  /** List of all unique tag names */
  uniqueTags: string[];
  /** List of all unique class names */
  uniqueClasses: string[];
  /** List of all unique IDs */
  uniqueIds: string[];
}

/**
 * Detected semantic section
 */
export interface SemanticSection {
  /** Section type */
  type: SemanticType;
  /** Root node of this section */
  node: ParsedNode;
  /** Suggested component name */
  componentName: string;
  /** All nodes in this section */
  nodes: ParsedNode[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Reasoning for classification */
  reasoning?: string;
}

/**
 * Parser options
 */
export interface ParserOptions {
  /** Whether to parse comments */
  includeComments?: boolean;
  /** Whether to preserve whitespace in text nodes */
  preserveWhitespace?: boolean;
  /** Custom semantic detection rules */
  semanticRules?: SemanticRule[];
  /** Maximum depth to parse (0 = unlimited) */
  maxDepth?: number;
  /** Callback for progress updates */
  onProgress?: (progress: ParserProgress) => void;
}

/**
 * Custom semantic detection rule
 */
export interface SemanticRule {
  /** Semantic type this rule detects */
  type: SemanticType;
  /** CSS selector for matching */
  selector: string;
  /** Minimum confidence for this rule */
  minConfidence: number;
  /** Suggested component name template */
  componentNameTemplate?: string;
}

/**
 * Parser progress update
 */
export interface ParserProgress {
  /** Current stage */
  stage: 'parsing' | 'analyzing' | 'complete';
  /** Number of nodes processed */
  processed: number;
  /** Total number of nodes (estimated) */
  total: number;
  /** Current file being processed (if multiple) */
  currentFile?: string;
}

/**
 * Attribute extraction result
 */
export interface AttributeExtractionResult {
  /** Extracted attributes */
  attributes: ParsedAttributes;
  /** Whether element is self-closing (void element) */
  isVoid: boolean;
  /** Whether element should be a React fragment */
  isFragment: boolean;
  /** Warnings encountered during extraction */
  warnings: AttributeWarning[];
}

/**
 * Attribute warning
 */
export interface AttributeWarning {
  /** Warning severity */
  severity: 'error' | 'warning' | 'info';
  /** Warning message */
  message: string;
  /** Related attribute name */
  attribute?: string;
}

/**
 * Semantic analysis result
 */
export interface SemanticAnalysisResult {
  /** Detected semantic sections */
  sections: SemanticSection[];
  /** Component name suggestions for each node */
  componentNames: Map<string, string>;
  /** Nodes that should be extracted */
  extractableNodes: ParsedNode[];
}

/**
 * Void element tags (self-closing in HTML)
 */
export const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * SVG elements that require special handling
 */
export const SVG_ELEMENTS = new Set([
  'svg',
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'g',
  'defs',
  'use',
  'symbol',
]);

/**
 * HTML attributes that are React keywords and need renaming
 */
export const REACT_ATTRIBUTE_ALIASES: Record<string, string> = {
  'class': 'className',
  'for': 'htmlFor',
  'tabindex': 'tabIndex',
  'readonly': 'readOnly',
  'maxlength': 'maxLength',
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'colspan': 'colSpan',
  'rowspan': 'rowSpan',
  'frameborder': 'frameBorder',
  'allowfullscreen': 'allowFullScreen',
  'autocomplete': 'autoComplete',
  'autofocus': 'autoFocus',
  'autoplay': 'autoPlay',
  'charset': 'charSet',
  'contenteditable': 'contentEditable',
  'crossorigin': 'crossOrigin',
  'enctype': 'encType',
  'formaction': 'formAction',
  'formenctype': 'formEncType',
  'formmethod': 'formMethod',
  'formnovalidate': 'formNoValidate',
  'formtarget': 'formTarget',
  'hreflang': 'hrefLang',
  'inputmode': 'inputMode',
  'minlength': 'minLength',
  'novalidate': 'noValidate',
  'srcdoc': 'srcDoc',
  'srcset': 'srcSet',
};

/**
 * Event handler attribute patterns
 */
export const EVENT_HANDLER_PATTERNS = [
  /^on[A-Z]/,
  /^on[A-Z][a-z]*$/,
];

/**
 * Boolean attributes (present = true, absent = false)
 */
export const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'download',
  'formnovalidate',
  'hidden',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
]);
