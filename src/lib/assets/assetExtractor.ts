/**
 * Asset Extractor - Milestone 6
 *
 * Extracts assets (images, fonts, stylesheets, etc.) from HTML.
 * Handles base64 data URLs, remote URLs, and local references.
 */

import {
  AssetType,
  AssetSource,
  type ExtractedAsset,
  type AssetExtractionResult,
  type AssetExtractionOptions,
  type AssetExtractionWarning,
  type AssetExtractionProgress,
  MIME_TYPE_MAP,
  EXTENSION_TO_MIME,
  ImageFormat,
  FontFormat,
} from '@/types/assets.types';

/**
 * Asset extraction and management
 */
export class AssetExtractor {
  private baseUrl: string = '';
  private assets: Map<string, ExtractedAsset> = new Map();
  private warnings: AssetExtractionWarning[] = [];
  private options: AssetExtractionOptions = {};

  /**
   * Set the base URL for resolving relative paths
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Extract all assets from HTML content
   */
  extractFromHtml(html: string, options: AssetExtractionOptions = {}): AssetExtractionResult {
    this.assets.clear();
    this.warnings = [];
    this.options = options;

    this.reportProgress({ stage: 'discovering', processed: 0, total: 0 });

    // Parse HTML and extract assets
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract from various elements
    this.extractFromImages(doc);
    this.extractFromLinks(doc);
    this.extractFromScripts(doc);
    this.extractFromStyles(doc);
    this.extractFromSourceTags(doc);
    this.extractFromInlineStyles(doc);
    this.extractFromSvgElements(doc);

    // Calculate statistics
    const result = this.buildResult(html);

    this.reportProgress({ stage: 'complete', processed: this.assets.size, total: this.assets.size });

    return result;
  }

  /**
   * Extract assets with automatic download of remote resources
   */
  async extractWithDownload(
    html: string,
    options: AssetExtractionOptions = {}
  ): Promise<AssetExtractionResult> {
    const result = this.extractFromHtml(html, options);

    if (options.downloadRemote) {
      this.reportProgress({ stage: 'downloading', processed: 0, total: result.extractedCount });

      let downloaded = 0;
      for (const [, asset] of result.assets) {
        if (asset.source === AssetSource.REMOTE && !asset.extracted) {
          try {
            await this.downloadAsset(asset);
            downloaded++;
          } catch (error) {
            this.addWarning('error', `Failed to download ${asset.originalUrl}: ${error}`);
            asset.error = String(error);
          }
          this.reportProgress({
            stage: 'downloading',
            processed: downloaded,
            total: result.extractedCount,
            currentAsset: asset.fileName,
          });
        }
      }
    }

    return this.buildResult(html);
  }

  /**
   * Extract assets from img tags
   */
  private extractFromImages(doc: Document): void {
    const images = doc.querySelectorAll('img');
    for (const img of Array.from(images)) {
      const src = img.getAttribute('src');
      if (src) {
        this.processAssetUrl(src, 'img', 'src', img);
        // Check for missing alt text
        if (!img.getAttribute('alt') && !img.getAttribute('role')) {
          this.addWarning('info', 'Image missing alt text', src, 'img');
        }
      }
      // Also check srcset
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        this.processSrcset(srcset, img);
      }
    }
  }

  /**
   * Extract assets from link tags (stylesheets, favicons, preload)
   */
  private extractFromLinks(doc: Document): void {
    const links = doc.querySelectorAll('link');
    for (const link of Array.from(links)) {
      const href = link.getAttribute('href');
      if (!href) continue;

      const rel = link.getAttribute('rel') || '';
      const as = link.getAttribute('as');

      if (rel.includes('stylesheet')) {
        this.processAssetUrl(href, 'link', 'href', link, AssetType.STYLESHEET);
      } else if (rel.includes('icon')) {
        this.processAssetUrl(href, 'link', 'href', link, AssetType.FAVICON);
      } else if (as === 'font') {
        this.processAssetUrl(href, 'link', 'href', link, AssetType.FONT);
      } else if (as === 'image') {
        this.processAssetUrl(href, 'link', 'href', link, AssetType.IMAGE);
      } else if (as === 'script') {
        this.processAssetUrl(href, 'link', 'href', link, AssetType.SCRIPT);
      } else if (rel.includes('preload') || rel.includes('prefetch')) {
        this.processAssetUrl(href, 'link', 'href', link);
      }
    }
  }

  /**
   * Extract assets from script tags
   */
  private extractFromScripts(doc: Document): void {
    const scripts = doc.querySelectorAll('script[src]');
    for (const script of Array.from(scripts)) {
      const src = script.getAttribute('src');
      if (src) {
        this.processAssetUrl(src, 'script', 'src', script, AssetType.SCRIPT);
      }
    }
  }

  /**
   * Extract assets from style tags
   */
  private extractFromStyles(doc: Document): void {
    const styles = doc.querySelectorAll('style');
    for (const style of Array.from(styles)) {
      const cssContent = style.textContent || '';
      this.extractFromCssContent(cssContent, 'style', style);
    }
  }

  /**
   * Extract assets from source tags (video/audio)
   */
  private extractFromSourceTags(doc: Document): void {
    const sources = doc.querySelectorAll('source');
    for (const source of Array.from(sources)) {
      const src = source.getAttribute('src');
      if (src) {
        const parent = source.parentElement;
        const type = parent?.tagName.toLowerCase();
        const assetType = type === 'video' ? AssetType.VIDEO : type === 'audio' ? AssetType.AUDIO : AssetType.OTHER;
        this.processAssetUrl(src, 'source', 'src', source, assetType);
      }
    }
  }

  /**
   * Extract assets from inline style attributes
   */
  private extractFromInlineStyles(doc: Document): void {
    const elements = doc.querySelectorAll('[style]');
    for (const element of Array.from(elements)) {
      const style = element.getAttribute('style');
      if (style) {
        this.extractFromCssContent(style, element.tagName.toLowerCase(), element);
      }
    }
  }

  /**
   * Extract assets from SVG elements with image/use references
   */
  private extractFromSvgElements(doc: Document): void {
    const svgImages = doc.querySelectorAll('svg image[href], svg use[href]');
    for (const element of Array.from(svgImages)) {
      const href = element.getAttribute('href');
      if (href) {
        this.processAssetUrl(href, 'svg', element.tagName.toLowerCase(), element, AssetType.IMAGE);
      }
    }
  }

  /**
   * Extract url() references from CSS content
   */
  private extractFromCssContent(css: string, elementName: string, element?: Element): void {
    const urlRegex = /url\(['"]?([^'"()]+)['"]?\)/gi;
    let match;

    while ((match = urlRegex.exec(css)) !== null) {
      const url = match[1];
      // Skip data URLs and empty URLs
      if (!url || url.startsWith('data:')) continue;
      this.processAssetUrl(url, elementName, 'style', element, AssetType.IMAGE, AssetSource.CSS_REFERENCE);
    }
  }

  /**
   * Process srcset attribute for responsive images
   */
  private processSrcset(srcset: string, element: Element): void {
    const sources = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]);
    for (const src of sources) {
      if (src) {
        this.processAssetUrl(src, 'img', 'srcset', element);
      }
    }
  }

  /**
   * Process a single asset URL and add to extraction list
   */
  private processAssetUrl(
    url: string,
    elementType: string,
    attribute: string,
    element?: Element,
    forceType?: AssetType,
    forceSource?: AssetSource
  ): void {
    // Determine source type
    let source: AssetSource;
    if (url.startsWith('data:')) {
      source = AssetSource.BASE64;
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      source = AssetSource.REMOTE;
    } else if (url.startsWith('//')) {
      source = AssetSource.REMOTE;
    } else {
      source = AssetSource.LOCAL;
    }

    // Generate unique ID
    const id = this.generateAssetId(url, source);

    // Check if already exists
    if (this.assets.has(id)) {
      const existing = this.assets.get(id)!;
      existing.references.push({
        elementType,
        attribute,
        elementId: element?.id,
        elementClasses: element?.className && typeof element.className === 'string'
          ? element.className.split(/\s+/).filter(Boolean)
          : undefined,
      });
      return;
    }

    // Parse base64 data if applicable
    let base64Data: string | undefined;
    let mimeType = 'application/octet-stream';
    let size: number | undefined;

    if (source === AssetSource.BASE64) {
      const parsed = this.parseDataUrl(url);
      if (parsed) {
        base64Data = parsed.data;
        mimeType = parsed.mimeType;
        size = Math.ceil((base64Data.length * 3) / 4); // Approximate decoded size
      }
    } else {
      // Determine MIME type from extension
      mimeType = this.getMimeTypeFromUrl(url);
    }

    // Determine asset type
    const type = forceType || this.determineAssetType(mimeType, url);

    // Generate filename
    const fileName = this.generateFileName(url, mimeType, type);

    // Create asset entry
    const asset: ExtractedAsset = {
      id,
      type,
      format: this.getFormatFromMimeType(mimeType),
      source: forceSource || source,
      originalUrl: url,
      resolvedUrl: this.resolveUrl(url),
      base64Data,
      mimeType,
      size,
      fileName,
      outputPath: this.generateOutputPath(fileName, type),
      extracted: source === AssetSource.BASE64,
      references: [
        {
          elementType,
          attribute,
          elementId: element?.id,
          elementClasses: element?.className && typeof element.className === 'string'
            ? element.className.split(/\s+/).filter(Boolean)
            : undefined,
        },
      ],
    };

    this.assets.set(id, asset);
  }

  /**
   * Parse a data URL to extract MIME type and base64 data
   */
  private parseDataUrl(url: string): { mimeType: string; data: string; charset?: string } | null {
    const match = url.match(/^data:([^;,]+)(;charset=([^;,]+))?(;base64)?,(.+)$/);
    if (!match) return null;

    const [, mimeType, , charset, , data] = match;
    return {
      mimeType,
      charset,
      data,
    };
  }

  /**
   * Get MIME type from URL extension
   */
  private getMimeTypeFromUrl(url: string): string {
    // Remove query string and fragment
    const cleanUrl = url.split(/[?#]/)[0];
    const ext = cleanUrl.substring(cleanUrl.lastIndexOf('.')).toLowerCase();
    return EXTENSION_TO_MIME[ext] || 'application/octet-stream';
  }

  /**
   * Determine asset type from MIME type and URL
   */
  private determineAssetType(mimeType: string, url: string): AssetType {
    const mapped = MIME_TYPE_MAP[mimeType];
    if (mapped) return mapped.type;

    // Fallback to extension detection
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext) {
      const extMime = EXTENSION_TO_MIME['.' + ext];
      if (extMime) {
        const extMapped = MIME_TYPE_MAP[extMime];
        if (extMapped) return extMapped.type;
      }
    }

    return AssetType.OTHER;
  }

  /**
   * Get format enum from MIME type
   */
  private getFormatFromMimeType(mimeType: string): ImageFormat | FontFormat | string | undefined {
    const mapped = MIME_TYPE_MAP[mimeType];
    return mapped?.format;
  }

  /**
   * Generate unique ID for asset
   */
  private generateAssetId(url: string, source: AssetSource): string {
    // For base64, use hash of data
    if (source === AssetSource.BASE64) {
      const parsed = this.parseDataUrl(url);
      if (parsed) {
        return this.simpleHash(parsed.data);
      }
    }
    // For URLs, use the URL itself
    return url;
  }

  /**
   * Simple hash function for deduplication
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Resolve URL against base URL
   */
  private resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      const protocol = this.baseUrl.split('://')[0] || 'https:';
      return protocol + ':' + url;
    }
    if (url.startsWith('/')) {
      const origin = this.baseUrl.split('/').slice(0, 3).join('/');
      return origin + url;
    }
    // Check for unsupported protocols
    if (url.match(/^[a-z]+:/i)) {
      this.addWarning('warning', `Unsupported protocol in URL: ${url}`, url);
    }
    // Relative path
    const basePath = this.baseUrl.substring(0, this.baseUrl.lastIndexOf('/') + 1);
    return basePath + url;
  }

  /**
   * Generate safe filename from URL
   */
  private generateFileName(url: string, mimeType: string, _type: AssetType): string {
    // Remove query string and fragment
    let cleanUrl = url.split(/[?#]/)[0];

    // For base64, generate a name
    if (url.startsWith('data:')) {
      const ext = this.getExtensionFromMimeType(mimeType);
      return `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    }

    // Get filename from URL path
    let filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);

    // If empty, generate a name
    if (!filename) {
      const ext = this.getExtensionFromMimeType(mimeType);
      return `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    }

    // Sanitize filename
    filename = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();

    // Ensure unique filename
    let finalFilename = filename;
    let counter = 1;
    while (Array.from(this.assets.values()).some((a) => a.fileName === finalFilename)) {
      const ext = filename.substring(filename.lastIndexOf('.'));
      const base = filename.substring(0, filename.lastIndexOf('.'));
      finalFilename = `${base}_${counter}${ext}`;
      counter++;
    }

    return finalFilename;
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const typeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'image/webp': '.webp',
      'image/x-icon': '.ico',
      'font/woff': '.woff',
      'font/woff2': '.woff2',
      'font/ttf': '.ttf',
      'font/otf': '.otf',
      'text/css': '.css',
      'text/javascript': '.js',
    };
    return typeToExt[mimeType] || '.bin';
  }

  /**
   * Generate output path for asset
   */
  private generateOutputPath(fileName: string, type: AssetType): string {
    const baseDir = this.options.outputDirectory || 'src/assets';
    switch (type) {
      case AssetType.IMAGE:
      case AssetType.FAVICON:
        return `${baseDir}/images/${fileName}`;
      case AssetType.FONT:
        return `${baseDir}/fonts/${fileName}`;
      case AssetType.STYLESHEET:
        return `${baseDir}/styles/${fileName}`;
      case AssetType.SCRIPT:
        return `${baseDir}/scripts/${fileName}`;
      default:
        return `${baseDir}/${fileName}`;
    }
  }

  /**
   * Download a remote asset
   */
  private async downloadAsset(asset: ExtractedAsset): Promise<void> {
    if (!asset.resolvedUrl) return;

    const response = await fetch(asset.resolvedUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get size from content-length header
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      asset.size = parseInt(contentLength, 10);
    }

    // Get blob
    const blob = await response.blob();
    asset.size = blob.size;

    // Convert to base64
    asset.base64Data = await this.blobToBase64(blob);
    asset.extracted = true;
  }

  /**
   * Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Build extraction result
   */
  private buildResult(html: string): AssetExtractionResult {
    // Group by type
    const assetsByType = new Map<AssetType, ExtractedAsset[]>();
    for (const asset of this.assets.values()) {
      if (!assetsByType.has(asset.type)) {
        assetsByType.set(asset.type, []);
      }
      assetsByType.get(asset.type)!.push(asset);
    }

    // Calculate total size
    let totalSize = 0;
    let extractedCount = 0;
    for (const asset of this.assets.values()) {
      if (asset.size) totalSize += asset.size;
      if (asset.extracted) extractedCount++;
    }

    // Update HTML with new paths
    const updatedHtml = this.updateHtmlPaths(html);

    return {
      assets: this.assets,
      assetsByType,
      totalCount: this.assets.size,
      extractedCount,
      failedCount: this.assets.size - extractedCount,
      totalSize,
      warnings: this.warnings,
      updatedHtml,
    };
  }

  /**
   * Update HTML with new asset paths
   */
  private updateHtmlPaths(html: string): string {
    let updated = html;

    for (const asset of this.assets.values()) {
      // Replace all references to original URL with new path
      const regex = new RegExp(this.escapeRegex(asset.originalUrl), 'g');
      updated = updated.replace(regex, `./${asset.outputPath}`);
    }

    return updated;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Add a warning
   */
  private addWarning(severity: AssetExtractionWarning['severity'], message: string, assetUrl?: string, element?: string): void {
    this.warnings.push({ severity, message, assetUrl, element });
  }

  /**
   * Report progress if callback is available
   */
  private reportProgress(progress: AssetExtractionProgress): void {
    this.options.onProgress?.(progress);
  }

  /**
   * Get all extracted assets as a bundle
   */
  getAssetBundle(): Map<string, { content: Blob | string; fileName: string; type: AssetType }> {
    const bundle = new Map();

    for (const asset of this.assets.values()) {
      if (asset.extracted && asset.base64Data) {
        // Convert base64 to blob
        const byteCharacters = atob(asset.base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: asset.mimeType });

        bundle.set(asset.id, {
          content: blob,
          fileName: asset.fileName,
          type: asset.type,
        });
      }
    }

    return bundle;
  }
}
