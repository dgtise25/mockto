/**
 * Orchestrator Types - Milestone 8-9
 *
 * Types for the conversion orchestrator that coordinates all modules.
 */

import { OutputFormat } from './generator.types';
import { CssStrategy } from './css.types';

/**
 * Represents a stage in the conversion pipeline
 */
export interface ConversionStage {
  /** Stage name */
  name: 'parse' | 'split' | 'generate' | 'css' | 'assets' | 'zip';
  /** Stage status */
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  /** Duration in milliseconds */
  duration: number;
  /** Stage message/error */
  message: string;
}

/**
 * Conversion options
 */
export interface ConversionOptions {
  /** Component name for generated files */
  componentName?: string;
  /** Output format (JSX or TSX) */
  outputFormat?: OutputFormat;
  /** CSS conversion strategy */
  cssStrategy?: CssStrategy;
  /** Code formatting options */
  formatting?: {
    indentStyle?: 'spaces' | 'tabs';
    indentSize?: number;
    printWidth?: number;
    singleQuote?: boolean;
    trailingComma?: 'none' | 'es5' | 'all';
    semi?: boolean;
    prettier?: boolean;
  };
  /** Include prop types in TSX */
  includePropTypes?: boolean;
  /** Extract inline styles */
  extractStyles?: boolean;
  /** Convert class to className */
  convertClassToClassName?: boolean;
  /** Include React import */
  includeReactImport?: boolean;
  /** Extract CSS to separate file */
  extractCssToSeparateFile?: boolean;
  /** CSS class prefix */
  cssClassPrefix?: string;
  /** Optimize CSS */
  optimizeCss?: boolean;
  /** Target filename for CSS output */
  targetFilename?: string;
}

/**
 * Conversion statistics
 */
export interface ConversionStats {
  /** Total processing time in milliseconds */
  processingTime: number;
  /** Total number of files generated */
  totalFiles: number;
  /** Total number of components generated */
  totalComponents: number;
  /** Total number of assets extracted */
  totalAssets: number;
}

/**
 * Final conversion result
 */
export interface ConversionResult {
  /** Whether conversion was successful */
  success: boolean;
  /** Generated ZIP file blob */
  zipBlob?: Blob;
  /** All generated files */
  files: Array<{
    fileName: string;
    content: string;
    fileType: string;
  }>;
  /** Pipeline stage information */
  stages: ConversionStage[];
  /** Warnings generated during conversion */
  warnings: string[];
  /** Error message if conversion failed */
  error?: string;
  /** Conversion statistics */
  stats: ConversionStats;
}

/**
 * Progress update during conversion
 */
export interface ConversionProgress {
  /** Current stage */
  stage: ConversionStage['name'];
  /** Progress percentage (0-100) */
  progress: number;
  /** Stage message */
  message: string;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: ConversionProgress) => void;
