/**
 * Component Splitter Type Definitions
 * Types and interfaces for the Component Splitter module
 */

/**
 * Represents a single component definition extracted from HTML
 */
export interface ComponentDefinition {
  /** Unique identifier for the component */
  id: string;

  /** Generated component name (PascalCase) */
  name: string;

  /** HTML element type (div, section, article, etc.) */
  type: string;

  /** Raw HTML content of the component */
  html: string;

  /** Nested depth in the component tree */
  depth: number;

  /** CSS class names */
  classes?: string[];

  /** BEM block/element/modifier classification */
  bemType?: {
    block?: string;
    element?: string;
    modifier?: string;
  };

  /** Parent component ID (if nested) */
  parentId?: string;

  /** Child component IDs */
  children?: string[];

  /** Repeating pattern this component belongs to */
  patternId?: string;

  /** Component role (semantic, layout, interactive) */
  role?: ComponentRole;

  /** Props interface suggestion */
  suggestedProps?: PropDefinition[];

  /** Additional metadata */
  metadata?: ComponentMetadata;
}

/**
 * Component role classification
 */
export type ComponentRole =
  | 'semantic'      // Semantic HTML elements (header, nav, main, etc.)
  | 'layout'        // Layout containers (container, wrapper, grid)
  | 'interactive'   // Interactive elements (button, form, input)
  | 'content'       // Content display (card, article, section)
  | 'navigation'    // Navigation elements (menu, breadcrumb, pagination)
  | 'media'         // Media elements (image, video, gallery)
  | 'data'          // Data display (table, list, chart)
  | 'unknown';      // Uncategorized

/**
 * Prop definition for component interface
 */
export interface PropDefinition {
  /** Prop name */
  name: string;

  /** Prop type */
  type: PropType;

  /** Whether prop is required */
  required: boolean;

  /** Default value (if any) */
  defaultValue?: unknown;

  /** Description of prop purpose */
  description?: string;
}

/**
 * TypeScript prop types
 */
export type PropType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'ReactNode'
  | 'CSSProperties'
  | 'Array<unknown>'
  | 'Record<string, unknown>'
  | 'Function'
  | 'unknown';

/**
 * Metadata about a component
 */
export interface ComponentMetadata {
  /** Element count within component */
  elementCount?: number;

  /** Text length (for content analysis) */
  textLength?: number;

  /** Has interactive elements */
  hasInteractive?: boolean;

  /** Has forms */
  hasForms?: boolean;

  /** Has images */
  hasImages?: boolean;

  /** Child component types */
  childTypes?: string[];

  /** Detected from repeating pattern */
  isPatternItem?: boolean;
}

/**
 * Pattern detection result
 */
export interface PatternDetectionResult {
  /** Pattern identifier (e.g., 'card', 'nav-item') */
  pattern: string;

  /** Number of occurrences */
  count: number;

  /** CSS selectors for pattern elements */
  elements: string[];

  /** Confidence score (0-1) */
  confidence: number;

  /** Pattern type */
  patternType: PatternType;

  /** Sample HTML structure */
  sampleStructure?: string;

  /** Detected props from pattern variations */
  detectedProps?: PropDefinition[];
}

/**
 * Pattern classification types
 */
export type PatternType =
  | 'card'          // Card-like components
  | 'list-item'     // List/navigation items
  | 'section'       // Repeating sections
  | 'form-field'    // Form input fields
  | 'table-row'     // Table rows
  | 'media-item'    // Image/media items
  | 'button'        // Button variants
  | 'unknown';      // Uncategorized pattern

/**
 * Options for component splitter
 */
export interface SplitterOptions {
  /** Minimum element count to consider as component */
  minElementCount?: number;

  /** Maximum nesting depth for component extraction */
  maxComponentDepth?: number;

  /** Enable pattern detection */
  detectPatterns?: boolean;

  /** Enable automatic name generation */
  generateNames?: boolean;

  /** Naming convention (PascalCase, kebab-case, camelCase) */
  namingConvention?: NamingConvention;

  /** Custom CSS selectors for component extraction */
  customComponentSelectors?: string[];

  /** Minimum occurrences for pattern detection */
  minPatternOccurrences?: number;

  /** Similarity threshold for pattern matching (0-1) */
  similarityThreshold?: number;

  /** Custom pattern detector instance */
  patternDetector?: any;

  /** Custom name generator instance */
  nameGenerator?: any;
}

/**
 * Naming convention options
 */
export type NamingConvention =
  | 'PascalCase'
  | 'kebab-case'
  | 'camelCase'
  | 'UPPER_CASE';

/**
 * Main result from component splitting
 */
export interface SplitResult {
  /** All extracted components (flat list) */
  components: ComponentDefinition[];

  /** Detected repeating patterns */
  patterns: PatternDetectionResult[];

  /** Component tree structure */
  tree: ComponentTree;

  /** Result metadata */
  metadata: SplitMetadata;
}

/**
 * Hierarchical component tree
 */
export interface ComponentTree {
  /** Root component ID */
  root: string;

  /** Node definitions */
  nodes: Record<string, ComponentTreeNode>;

  /** Edges (parent-child relationships) */
  edges: ComponentEdge[];
}

/**
 * Tree node representing a component
 */
export interface ComponentTreeNode {
  /** Component ID */
  id: string;

  /** Component definition reference */
  component: ComponentDefinition;

  /** Parent node ID */
  parentId?: string;

  /** Child node IDs */
  childIds: string[];

  /** Depth in tree */
  depth: number;

  /** Siblings (ordered) */
  siblings: string[];
}

/**
 * Edge relationship between components
 */
export interface ComponentEdge {
  /** Parent component ID */
  from: string;

  /** Child component ID */
  to: string;

  /** Edge type (contains, renders, etc.) */
  type: EdgeType;
}

/**
 * Relationship type between components
 */
export type EdgeType =
  | 'contains'      // Parent contains child
  | 'renders'       // Parent renders child as prop
  | 'wraps'         // Parent wraps child
  | 'adjacent';     // Sibling components

/**
 * Metadata about split operation
 */
export interface SplitMetadata {
  /** Total number of components extracted */
  totalComponents: number;

  /** Maximum nesting depth */
  maxDepth: number;

  /** Processing time in milliseconds */
  processingTime: number;

  /** Component counts by type */
  componentCounts: {
    byType: Record<string, number>;
    byRole: Record<ComponentRole, number>;
    byDepth: Record<number, number>;
  };

  /** Pattern detection statistics */
  patternStats: {
    totalPatterns: number;
    totalPatternItems: number;
    averageConfidence: number;
  };

  /** Source HTML statistics */
  sourceStats: {
    totalElements: number;
    totalNodes: number;
    textContentRatio: number;
  };
}

/**
 * Context for name generation
 */
export interface NameGenerationContext {
  /** HTML element or tag name */
  element?: Element | string;

  /** Component type (semantic tag type) */
  type?: string;

  /** Parent component name */
  parentName?: string;

  /** Sibling component names */
  siblings?: string[];

  /** Existing component names (for uniqueness) */
  existingNames?: string[];

  /** Additional context */
  context?: {
    hasChildren?: boolean;
    childCount?: number;
    childTypes?: string[];
  };
}

/**
 * Pattern detector interface
 */
export interface PatternDetector {
  /** Detect all patterns in HTML */
  detectPatterns(html: string): PatternDetectionResult[];

  /** Check if elements form a repeating pattern */
  isRepeatingPattern(elements: string[]): boolean;

  /** Calculate similarity between two HTML structures */
  calculateSimilarity(html1: string, html2: string): number;

  /** Classify pattern type from elements */
  classifyPattern(elements: string[]): string;

  /** Group elements by detected pattern */
  groupByPattern(elements: string[]): Record<string, string[]>;
}

/**
 * Name generator interface
 */
export interface NameGenerator {
  /** Generate name from element/context */
  generateName(context: NameGenerationContext): string;

  /** Generate unique name (avoiding collisions) */
  generateUniqueName(baseName: string, existingNames: string[]): string;

  /** Suggest name from HTML content analysis */
  suggestNameFromContent(html: string): string;

  /** Validate name is valid identifier */
  validateName(name: string): boolean;
}

/**
 * Semantic HTML tag mapping
 */
export interface SemanticTagMapping {
  /** HTML5 semantic tag */
  tag: string;

  /** Default component name */
  componentName: string;

  /** Default component role */
  role: ComponentRole;

  /** Typical child components */
  typicalChildren?: string[];
}

/**
 * BEM pattern classification
 */
export interface BEMClassification {
  /** BEM block name */
  block: string;

  /** BEM element name (if applicable) */
  element?: string;

  /** BEM modifier (if applicable) */
  modifier?: string;

  /** Full BEM class string */
  fullClass: string;
}

/**
 * Component extraction rule
 */
export interface ExtractionRule {
  /** CSS selector for matching elements */
  selector: string;

  /** Required for component extraction */
  required: boolean;

  /** Minimum child elements */
  minChildren?: number;

  /** Extract as separate component */
  extractAsComponent: boolean;

  /** Suggested component name (override) */
  suggestedName?: string;

  /** Component role assignment */
  role?: ComponentRole;
}

/**
 * Splitting strategy
 */
export type SplittingStrategy =
  | 'semantic'      // Prioritize semantic HTML elements
  | 'class-based'   // Prioritize CSS class patterns
  | 'pattern-based' // Prioritize repeating patterns
  | 'hybrid';       // Combine all strategies

/**
 * Component extraction result for a single element
 */
export interface ElementExtractResult {
  /** Should this be extracted as component */
  shouldExtract: boolean;

  /** Confidence in extraction decision (0-1) */
  confidence: number;

  /** Suggested component name */
  suggestedName: string;

  /** Reason for extraction decision */
  reason: ExtractionReason;

  /** Related pattern (if any) */
  pattern?: PatternDetectionResult;
}

/**
 * Reason for component extraction
 */
export type ExtractionReason =
  | 'semantic-tag'        // Semantic HTML5 element
  | 'repeating-pattern'   // Part of repeating pattern
  | 'class-pattern'       // Matches class-based pattern
  | 'custom-selector'     // Matches custom selector
  | 'complex-structure'   // Complex nested structure
  | 'user-defined';       // Explicitly defined by user
