/**
 * Converter Module Barrel Export
 * Exports all public APIs for Component Splitter, Pattern Detector, Name Generator, and JSX/TSX Generators
 */

// Component Splitter (Milestone 3)
export {
  ComponentSplitter,
  createComponentSplitter,
  type ComponentDefinition,
  type ComponentRole,
  type ComponentTree,
  type ComponentEdge,
  type ComponentTreeNode,
  type PatternDetectionResult,
  type SplitResult,
  type SplitMetadata,
  type SplitterOptions
} from './componentSplitter';

// Pattern Detector (Milestone 3)
export {
  PatternDetector,
  type PatternDetectorOptions
} from './patternDetector';

// Name Generator (Milestone 3)
export {
  NameGenerator,
  createNameGenerator,
  nameFromClass,
  type NameGeneratorOptions
} from './nameGenerator';

// JSX/TSX Generators (Milestone 4)
export { JSXGenerator } from './jsxGenerator';
export { TSXGenerator } from './tsxGenerator';

// Utility classes (Milestone 4)
export { AttributeTransformer } from './attributeTransformer';
export { CodeFormatter } from './codeFormatter';

// Types
export type {
  // Component Splitter types
  PropDefinition as SplitterPropDefinition,
  ComponentMetadata as SplitterMetadata,
  // Generator types
  OutputFormat,
  GeneratorOptions,
  GeneratedComponent,
  GeneratorResult,
  GeneratorStats,
  AttributeTransformation,
  StyleAttribute,
  PropDefinition,
  ImportStatement,
  FormattingOptions,
  ComponentMetadata,
} from '../../types/generator.types';
