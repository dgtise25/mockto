/**
 * Asset Types - Milestones 6-8
 *
 * Type definitions for asset extraction and ZIP output generation.
 * Handles images, fonts, stylesheets, scripts, and other resources.
 */

/**
 * Supported asset types for extraction
 */
export enum AssetType {
  /** Image files (jpg, png, gif, svg, webp, etc.) */
  IMAGE = 'image',
  /** Font files (woff, woff2, ttf, otf, eot) */
  FONT = 'font',
  /** Stylesheet files (css, scss, less) */
  STYLESHEET = 'stylesheet',
  /** Script files (js, ts, jsx, tsx) */
  SCRIPT = 'script',
  /** Favicon files (ico, png, svg) */
  FAVICON = 'favicon',
  /** Video files (mp4, webm, ogg) */
  VIDEO = 'video',
  /** Audio files (mp3, wav, ogg) */
  AUDIO = 'audio',
  /** Document files (pdf, doc, etc.) */
  DOCUMENT = 'document',
  /** Other resource types */
  OTHER = 'other',
}

/**
 * Image format subtypes
 */
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  GIF = 'gif',
  SVG = 'svg',
  WEBP = 'webp',
  BMP = 'bmp',
  ICO = 'ico',
  AVIF = 'avif',
  TIFF = 'tiff',
  PSD = 'psd',
  RAW = 'raw',
}

/**
 * Font format subtypes
 */
export enum FontFormat {
  WOFF = 'woff',
  WOFF2 = 'woff2',
  TTF = 'ttf',
  OTF = 'otf',
  EOT = 'eot',
}

/**
 * Source location of an asset
 */
export enum AssetSource {
  /** Remote URL (http/https) */
  REMOTE = 'remote',
  /** Base64 encoded data URL */
  BASE64 = 'base64',
  /** Local file reference */
  LOCAL = 'local',
  /** CSS url() reference */
  CSS_REFERENCE = 'css_reference',
}

/**
 * Extracted asset information
 */
export interface ExtractedAsset {
  /** Unique identifier for this asset */
  id: string;
  /** Asset type category */
  type: AssetType;
  /** Specific format (for images, fonts, etc.) */
  format?: ImageFormat | FontFormat | string;
  /** Where the asset was found */
  source: AssetSource;
  /** Original URL or reference from HTML */
  originalUrl: string;
  /** Resolved absolute URL (for remote assets) */
  resolvedUrl?: string;
  /** Base64 data (if base64 source) */
  base64Data?: string;
  /** Mimetype of the asset */
  mimeType: string;
  /** Size in bytes (if available) */
  size?: number;
  /** Width in pixels (for images, if available) */
  width?: number;
  /** Height in pixels (for images, if available) */
  height?: number;
  /** Elements in HTML that reference this asset */
  references: AssetReference[];
  /** Extracted filename */
  fileName: string;
  /** Suggested output path within the project */
  outputPath: string;
  /** Whether asset was successfully extracted */
  extracted: boolean;
  /** Error message if extraction failed */
  error?: string;
  /** Checksum for deduplication */
  checksum?: string;
}

/**
 * Reference to an asset from HTML element
 */
export interface AssetReference {
  /** Type of element referencing the asset */
  elementType: string;
  /** Attribute containing the reference */
  attribute: string;
  /** Element ID (if available) */
  elementId?: string;
  /** Element class names (if available) */
  elementClasses?: string[];
  /** Line number in source HTML */
  lineNumber?: number;
  /** Column number in source HTML */
  columnNumber?: number;
}

/**
 * Result of asset extraction operation
 */
export interface AssetExtractionResult {
  /** All extracted assets */
  assets: Map<string, ExtractedAsset>;
  /** Assets grouped by type */
  assetsByType: Map<AssetType, ExtractedAsset[]>;
  /** Total number of assets found */
  totalCount: number;
  /** Number of successfully extracted assets */
  extractedCount: number;
  /** Number of failed extractions */
  failedCount: number;
  /** Total size of all assets in bytes */
  totalSize: number;
  /** Warnings during extraction */
  warnings: AssetExtractionWarning[];
  /** HTML with updated asset references */
  updatedHtml?: string;
}

/**
 * Warning during asset extraction
 */
export interface AssetExtractionWarning {
  /** Warning severity */
  severity: 'error' | 'warning' | 'info';
  /** Warning message */
  message: string;
  /** Related asset URL */
  assetUrl?: string;
  /** Related element */
  element?: string;
}

/**
 * Configuration for asset extraction
 */
export interface AssetExtractionOptions {
  /** Whether to download remote assets */
  downloadRemote?: boolean;
  /** Maximum file size in bytes (0 = unlimited) */
  maxFileSize?: number;
  /** Allowed MIME types (empty = all) */
  allowedMimeTypes?: string[];
  /** Blocked MIME types */
  blockedMimeTypes?: string[];
  /** Whether to optimize images during extraction */
  optimizeImages?: boolean;
  /** Target image quality (0-100) */
  imageQuality?: number;
  /** Whether to convert images to WebP */
  convertToWebP?: boolean;
  /** Custom filename template */
  filenameTemplate?: FilenameTemplate;
  /** Output directory for assets */
  outputDirectory?: string;
  /** Whether to preserve original directory structure */
  preserveStructure?: boolean;
  /** Progress callback */
  onProgress?: (progress: AssetExtractionProgress) => void;
}

/**
 * Filename template for extracted assets
 */
export interface FilenameTemplate {
  /** Template string with placeholders: {name}, {hash}, {ext} */
  pattern: string;
  /** Length of hash to use */
  hashLength?: number;
  /** Whether to include original filename */
  includeOriginalName?: boolean;
}

/**
 * Progress update during asset extraction
 */
export interface AssetExtractionProgress {
  /** Current stage */
  stage: 'discovering' | 'downloading' | 'processing' | 'complete';
  /** Number of assets processed */
  processed: number;
  /** Total number of assets */
  total: number;
  /** Currently processing asset */
  currentAsset?: string;
  /** Bytes downloaded so far */
  bytesDownloaded?: number;
  /** Total bytes to download */
  totalBytes?: number;
}

/**
 * ZIP output configuration
 */
export interface ZipOutputOptions {
  /** Name of the output ZIP file (without extension) */
  zipName: string;
  /** Whether to include source HTML */
  includeSourceHtml?: boolean;
  /** Whether to include README */
  includeReadme?: boolean;
  /** Whether to include package.json */
  includePackageJson?: boolean;
  /** Whether to minify CSS/JS files */
  minifyAssets?: boolean;
  /** Compression level (0-9) */
  compressionLevel?: number;
  /** Custom README content */
  readmeContent?: string;
  /** Custom package.json content */
  packageJsonContent?: Record<string, unknown>;
  /** Whether to create a src directory structure */
  useSrcDirectory?: boolean;
  /** Progress callback */
  onProgress?: (progress: ZipGenerationProgress) => void;
}

/**
 * Progress update during ZIP generation
 */
export interface ZipGenerationProgress {
  /** Current stage */
  stage: 'preparing' | 'compressing' | 'finalizing' | 'complete';
  /** Number of files processed */
  processed: number;
  /** Total number of files */
  total: number;
  /** Currently processing file */
  currentFile?: string;
  /** Current ZIP size in bytes */
  currentSize?: number;
}

/**
 * Result of ZIP generation
 */
export interface ZipGenerationResult {
  /** Generated ZIP blob */
  zipBlob: Blob;
  /** Size of ZIP in bytes */
  size: number;
  /** List of files included in ZIP */
  files: ZipFileEntry[];
  /** Checksum (SHA-256) of ZIP */
  checksum?: string;
  /** Download URL (if created) */
  downloadUrl?: string;
  /** Warnings during generation */
  warnings: string[];
}

/**
 * File entry in ZIP
 */
export interface ZipFileEntry {
  /** Path within ZIP */
  path: string;
  /** File name (for convenience, extracted from path) */
  fileName: string;
  /** File size in bytes */
  size: number;
  /** File type */
  type: 'component' | 'style' | 'asset' | 'config' | 'document';
  /** Compression ratio */
  compressionRatio?: number;
}

/**
 * File System Access API options
 */
export interface FileSystemOptions {
  /** Whether to use File System Access API if available */
  preferFileSystemAPI?: boolean;
  /** Suggested directory name */
  suggestedDirectoryName?: string;
  /** Start directory for save picker */
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  /** Handle to existing directory (for overwrite) */
  directoryHandle?: FileSystemDirectoryHandle;
  /** Whether to use src directory structure */
  useSrcDirectory?: boolean;
}

/**
 * Result of file system operation
 */
export interface FileSystemResult {
  /** Whether operation was successful */
  success: boolean;
  /** Created/updated directory handle */
  directoryHandle?: FileSystemDirectoryHandle;
  /** List of files written */
  filesWritten: string[];
  /** Error message if failed */
  error?: string;
  /** Whether user cancelled the operation */
  cancelled?: boolean;
}

/**
 * Asset bundle for ZIP output
 */
export interface AssetBundle {
  /** All components */
  components: Map<string, { content: string; fileName: string }>;
  /** All stylesheets */
  styles: Map<string, { content: string; fileName: string }>;
  /** All extracted assets */
  assets: Map<string, { content: Blob | string; fileName: string; type: AssetType }>;
  /** Configuration files */
  configs: Map<string, { content: string; fileName: string }>;
  /** Documentation files */
  docs: Map<string, { content: string; fileName: string }>;
}

/**
 * Supported MIME types mapping
 */
export const MIME_TYPE_MAP: Record<string, { type: AssetType; format?: string }> = {
  'image/jpeg': { type: AssetType.IMAGE, format: ImageFormat.JPEG },
  'image/png': { type: AssetType.IMAGE, format: ImageFormat.PNG },
  'image/gif': { type: AssetType.IMAGE, format: ImageFormat.GIF },
  'image/svg+xml': { type: AssetType.IMAGE, format: ImageFormat.SVG },
  'image/webp': { type: AssetType.IMAGE, format: ImageFormat.WEBP },
  'image/bmp': { type: AssetType.IMAGE, format: ImageFormat.BMP },
  'image/x-icon': { type: AssetType.IMAGE, format: ImageFormat.ICO },
  'image/avif': { type: AssetType.IMAGE, format: ImageFormat.AVIF },
  'image/tiff': { type: AssetType.IMAGE, format: ImageFormat.TIFF },
  'font/woff': { type: AssetType.FONT, format: FontFormat.WOFF },
  'font/woff2': { type: AssetType.FONT, format: FontFormat.WOFF2 },
  'font/ttf': { type: AssetType.FONT, format: FontFormat.TTF },
  'font/otf': { type: AssetType.FONT, format: FontFormat.OTF },
  'application/vnd.ms-fontobject': { type: AssetType.FONT, format: FontFormat.EOT },
  'text/css': { type: AssetType.STYLESHEET },
  'text/javascript': { type: AssetType.SCRIPT },
  'application/javascript': { type: AssetType.SCRIPT },
  'video/mp4': { type: AssetType.VIDEO },
  'video/webm': { type: AssetType.VIDEO },
  'audio/mpeg': { type: AssetType.AUDIO },
  'audio/wav': { type: AssetType.AUDIO },
  'application/pdf': { type: AssetType.DOCUMENT },
};

/**
 * File extension to MIME type mapping
 */
export const EXTENSION_TO_MIME: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  // Stylesheets
  '.css': 'text/css',
  '.scss': 'text/x-scss',
  '.less': 'text/x-less',
  // Scripts
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  // Documents
  '.pdf': 'application/pdf',
};
