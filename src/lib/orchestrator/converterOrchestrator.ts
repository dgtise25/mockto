/**
 * Converter Orchestrator - Milestone 8-9
 *
 * Main orchestrator that coordinates all conversion modules:
 * HTML Parser → Component Splitter → JSX/TSX Generator → CSS Converter → Asset Extractor → ZIP Output
 */

import { HTMLParser } from '@/lib/parser/htmlParser';
import { ComponentSplitter } from '@/lib/converter/componentSplitter';
import { TSXGenerator } from '@/lib/converter/tsxGenerator';
import { JSXGenerator } from '@/lib/converter/jsxGenerator';
import { TailwindConverter } from '@/lib/css/tailwindConverter';
import { CssModulesConverter } from '@/lib/css/cssModulesConverter';
import { VanillaCssConverter } from '@/lib/css/vanillaCssConverter';
import { AssetExtractor } from '@/lib/assets/assetExtractor';
import { ZipGenerator } from '@/lib/output/zipGenerator';
import type {
  ConversionOptions,
  ConversionResult,
  ConversionStage,
} from '@/types/orchestrator.types';
import type { AppSettings } from '@/types/storage.types';
import { getSettingsStore } from '@/lib/storage/settingsStore';
import { OutputFormat } from '@/types/generator.types';
import { CssStrategy } from '@/types/css.types';

/**
 * Converter Orchestrator class
 *
 * Coordinates the entire conversion pipeline from HTML input to ZIP output.
 */
export class ConverterOrchestrator {
  private parser: HTMLParser;
  private splitter: ComponentSplitter;
  private settingsStore: ReturnType<typeof getSettingsStore>;
  private currentSettings: AppSettings;
  private abortController: AbortController | null = null;

  constructor() {
    this.parser = new HTMLParser();
    this.splitter = new ComponentSplitter();
    this.settingsStore = getSettingsStore();
    this.currentSettings = this.settingsStore.loadSettings();
  }

  /**
   * Refresh settings from storage
   */
  private refreshSettings(): void {
    this.currentSettings = this.settingsStore.loadSettings();
  }

  /**
   * Convert HTML to React components with all processing steps
   *
   * @param html - HTML source code to convert
   * @param options - Conversion options
   * @param signal - Optional abort signal for cancellation
   * @returns Conversion result with generated files and metadata
   */
  async convert(
    html: string,
    options: ConversionOptions = {},
    signal?: AbortSignal
  ): Promise<ConversionResult> {
    const startTime = performance.now();
    this.abortController = new AbortController();

    // Link external signal if provided
    if (signal) {
      signal.addEventListener('abort', () => this.abortController?.abort());
    }

    // Refresh settings
    this.refreshSettings();

    // Merge options with settings
    const mergedOptions = this.mergeOptions(options);

    const stages: ConversionStage[] = [];
    const warnings: string[] = [];
    let generatedFiles: Map<string, { content: string; type: string }> = new Map();

    try {
      // Stage 1: Parse HTML
      this.checkAbort();
      const parseResult = await this.parseHTML(html, mergedOptions.componentName);
      stages.push(parseResult.stage);
      warnings.push(...parseResult.warnings);

      // Stage 2: Split into components (if enabled)
      this.checkAbort();
      const splitResult = await this.splitComponents(parseResult.parsedDocument, mergedOptions);
      stages.push(splitResult.stage);
      warnings.push(...splitResult.warnings);

      // Stage 3: Generate React code
      this.checkAbort();
      const generateResult = await this.generateCode(
        splitResult.components,
        mergedOptions
      );
      stages.push(generateResult.stage);
      warnings.push(...generateResult.warnings);

      // Store generated files
      for (const file of generateResult.files) {
        generatedFiles.set(file.fileName, { content: file.content, type: file.fileType });
      }

      // Stage 4: Convert CSS
      this.checkAbort();
      const cssResult = await this.convertCSS(html, mergedOptions);
      stages.push(cssResult.stage);
      warnings.push(...cssResult.warnings);

      // Store CSS files
      for (const file of cssResult.files) {
        generatedFiles.set(file.fileName, { content: file.content, type: file.fileType });
      }

      // Stage 5: Extract assets
      this.checkAbort();
      const assetResult = await this.extractAssets(html, mergedOptions);
      stages.push(assetResult.stage);
      warnings.push(...assetResult.warnings);

      // Store asset files
      for (const asset of assetResult.assets) {
        generatedFiles.set(asset.path, { content: asset.content, type: asset.type });
      }

      // Update stats to use asset count
      const totalAssets = assetResult.assets.length;

      // Stage 6: Generate ZIP
      this.checkAbort();
      const zipResult = await this.generateZip(generatedFiles, mergedOptions);
      stages.push(zipResult.stage);
      warnings.push(...zipResult.warnings);

      const processingTime = performance.now() - startTime;

      return {
        success: true,
        zipBlob: zipResult.zipBlob,
        files: Array.from(generatedFiles.entries()).map(([name, data]) => ({
          fileName: name,
          content: data.content,
          fileType: data.type as any,
        })),
        stages,
        warnings,
        stats: {
          processingTime,
          totalFiles: generatedFiles.size,
          totalComponents: splitResult.components.length,
          totalAssets,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Conversion cancelled',
          files: [],
          stages,
          warnings,
          stats: {
            processingTime: performance.now() - startTime,
            totalFiles: generatedFiles.size,
            totalComponents: 0,
            totalAssets: 0,
          },
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        files: [],
        stages,
        warnings,
        stats: {
          processingTime: performance.now() - startTime,
          totalFiles: generatedFiles.size,
          totalComponents: 0,
          totalAssets: 0,
        },
      };
    }
  }

  /**
   * Parse HTML into structured document
   */
  private async parseHTML(
    html: string,
    _componentName: string
  ): Promise<{
    stage: ConversionStage;
    parsedDocument: ReturnType<HTMLParser['parse']>;
    warnings: string[];
  }> {
    const stageStart = performance.now();

    try {
      const parsedDocument = this.parser.parse(html);

      return {
        stage: {
          name: 'parse',
          status: 'complete',
          duration: performance.now() - stageStart,
          message: `Parsed ${parsedDocument.metadata.nodeCount} nodes`,
        },
        parsedDocument,
        warnings: [],
      };
    } catch (error) {
      return {
        stage: {
          name: 'parse',
          status: 'error',
          duration: performance.now() - stageStart,
          message: error instanceof Error ? error.message : 'Parse failed',
        },
        parsedDocument: null as any,
        warnings: [`Parse error: ${error instanceof Error ? error.message : 'Unknown'}`],
      };
    }
  }

  /**
   * Split HTML into components
   */
  private async splitComponents(
    parsedDocument: ReturnType<HTMLParser['parse']>,
    _options: ReturnType<typeof ConverterOrchestrator.prototype['mergeOptions']>
  ): Promise<{
    stage: ConversionStage;
    components: any[];
    warnings: string[];
  }> {
    const stageStart = performance.now();

    if (!this.currentSettings.advanced.enableComponentSplitting) {
      // Return single component from root
      const component = {
        id: 'component-0',
        name: _options.componentName,
        html: this.nodeToHtml(parsedDocument.root),
        depth: 0,
        type: parsedDocument.root.type === 'element' ? parsedDocument.root.tagName : 'div',
      };

      return {
        stage: {
          name: 'split',
          status: 'complete',
          duration: performance.now() - stageStart,
          message: 'Single component (splitting disabled)',
        },
        components: [component],
        warnings: [],
      };
    }

    try {
      // For splitting, we need to reconstruct HTML from parsed document
      const html = this.nodeToHtml(parsedDocument.root);
      const splitResult = this.splitter.split(html);

      return {
        stage: {
          name: 'split',
          status: 'complete',
          duration: performance.now() - stageStart,
          message: `Split into ${splitResult.components.length} components`,
        },
        components: splitResult.components,
        warnings: [],
      };
    } catch (error) {
      return {
        stage: {
          name: 'split',
          status: 'error',
          duration: performance.now() - stageStart,
          message: error instanceof Error ? error.message : 'Split failed',
        },
        components: [],
        warnings: [`Split error: ${error instanceof Error ? error.message : 'Unknown'}`],
      };
    }
  }

  /**
   * Generate React code from components
   */
  private async generateCode(
    components: any[],
    _options: ReturnType<typeof ConverterOrchestrator.prototype['mergeOptions']>
  ): Promise<{
    stage: ConversionStage;
    files: Array<{ fileName: string; content: string; fileType: string }>;
    warnings: string[];
  }> {
    const stageStart = performance.now();
    const files: Array<{ fileName: string; content: string; fileType: string }> = [];
    const warnings: string[] = [];

    try {
      // Create generator based on format
      const Generator = _options.outputFormat === OutputFormat.TSX
        ? TSXGenerator
        : JSXGenerator;

      for (const component of components) {
        // Create AST from component HTML
        const ast = this.htmlToAst(component.html);

        const generator = new Generator({
          format: _options.outputFormat,
          componentName: component.name,
          formatting: _options.formatting,
          includePropTypes: _options.includePropTypes,
          extractStyles: _options.extractStyles,
          convertClassToClassName: _options.convertClassToClassName,
          includeReactImport: _options.includeReactImport,
        });

        const result = await generator.generate(ast);
        files.push(...result.files);
        warnings.push(...result.warnings);
      }

      return {
        stage: {
          name: 'generate',
          status: 'complete',
          duration: performance.now() - stageStart,
          message: `Generated ${files.length} files`,
        },
        files,
        warnings,
      };
    } catch (error) {
      return {
        stage: {
          name: 'generate',
          status: 'error',
          duration: performance.now() - stageStart,
          message: error instanceof Error ? error.message : 'Generation failed',
        },
        files,
        warnings: [`Generation error: ${error instanceof Error ? error.message : 'Unknown'}`],
      };
    }
  }

  /**
   * Convert CSS using selected strategy
   */
  private async convertCSS(
    html: string,
    _options: ReturnType<typeof ConverterOrchestrator.prototype['mergeOptions']>
  ): Promise<{
    stage: ConversionStage;
    files: Array<{ fileName: string; content: string; fileType: string }>;
    warnings: string[];
  }> {
    const stageStart = performance.now();
    const warnings: string[] = [];

    try {
      let converter;
      switch (_options.cssStrategy) {
        case CssStrategy.TAILWIND:
          converter = new TailwindConverter();
          break;
        case CssStrategy.CSS_MODULES:
          converter = new CssModulesConverter();
          break;
        case CssStrategy.VANILLA:
        default:
          converter = new VanillaCssConverter();
          break;
      }

      const result = converter.convert(html, {
        extractToSeparateFile: _options.extractCssToSeparateFile,
        classPrefix: _options.cssClassPrefix,
        optimize: _options.optimizeCss,
        targetFilename: _options.targetFilename || 'styles',
      });

      const files: Array<{ fileName: string; content: string; fileType: string }> = [];

      // Use the CSS result directly
      if (result.css) {
        files.push({
          fileName: _options.extractCssToSeparateFile
            ? (_options.targetFilename || 'styles') + '.css'
            : 'styles.css',
          content: result.css,
          fileType: 'style',
        });
      }

      // Add any generated files from the converter
      if (result.generatedFiles) {
        for (const fileName of result.generatedFiles) {
          // CSS is already added above
          if (!fileName.endsWith('.css')) {
            files.push({
              fileName,
              content: '', // Empty content - actual content would be in a real implementation
              fileType: 'asset',
            });
          }
        }
      }

      return {
        stage: {
          name: 'css',
          status: 'complete',
          duration: performance.now() - stageStart,
          message: `CSS converted using ${_options.cssStrategy}`,
        },
        files,
        warnings,
      };
    } catch (error) {
      return {
        stage: {
          name: 'css',
          status: 'error',
          duration: performance.now() - stageStart,
          message: error instanceof Error ? error.message : 'CSS conversion failed',
        },
        files: [],
        warnings: [`CSS error: ${error instanceof Error ? error.message : 'Unknown'}`],
      };
    }
  }

  /**
   * Extract assets from HTML
   */
  private async extractAssets(
    html: string,
    _options: ReturnType<typeof ConverterOrchestrator.prototype['mergeOptions']>
  ): Promise<{
    stage: ConversionStage;
    assets: Array<{ path: string; content: string; type: string }>;
    warnings: string[];
  }> {
    const stageStart = performance.now();

    try {
      const extractor = new AssetExtractor();
      const result = extractor.extractFromHtml(html, {
        downloadRemote: false,
        outputDirectory: 'assets',
      });

      // Convert Map to array of assets
      const assets: Array<{ path: string; content: string; type: string }> = [];
      for (const asset of result.assets.values()) {
        if (asset.extracted && asset.base64Data) {
          assets.push({
            path: asset.outputPath,
            content: asset.base64Data,
            type: asset.type,
          });
        }
      }

      return {
        stage: {
          name: 'assets',
          status: 'complete',
          duration: performance.now() - stageStart,
          message: `Extracted ${result.extractedCount} assets`,
        },
        assets,
        warnings: [],
      };
    } catch (error) {
      return {
        stage: {
          name: 'assets',
          status: 'error',
          duration: performance.now() - stageStart,
          message: error instanceof Error ? error.message : 'Asset extraction failed',
        },
        assets: [],
        warnings: [`Asset error: ${error instanceof Error ? error.message : 'Unknown'}`],
      };
    }
  }

  /**
   * Generate ZIP file from all generated files
   */
  private async generateZip(
    files: Map<string, { content: string; type: string }>,
    _options: ReturnType<typeof ConverterOrchestrator.prototype['mergeOptions']>
  ): Promise<{
    stage: ConversionStage;
    zipBlob: Blob;
    warnings: string[];
  }> {
    const stageStart = performance.now();

    try {
      const zipGenerator = new ZipGenerator();
      const generatorResult: import('@/types/generator.types').GeneratorResult = {
        files: Array.from(files.entries()).map(([name, data]) => ({
          fileName: name,
          content: data.content,
          fileType: data.type as any,
        })),
        warnings: [],
        stats: {
          componentsGenerated: files.size,
          elementsProcessed: 0,
          attributesTransformed: 0,
          inlineStylesConverted: 0,
          linesOfCode: 0,
        },
        entryPoint: undefined as any,
      };

      const result = await zipGenerator.generateZip(generatorResult, {
        zipName: 'react-components',
        includePackageJson: true,
        includeReadme: true,
      });

      return {
        stage: {
          name: 'zip',
          status: 'complete',
          duration: performance.now() - stageStart,
          message: `ZIP generated (${(result.size / 1024).toFixed(1)} KB)`,
        },
        zipBlob: result.zipBlob,
        warnings: result.warnings,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Merge user options with current settings
   */
  private mergeOptions(options: ConversionOptions = {}): ConversionOptions & {
    componentName: string;
    outputFormat: OutputFormat;
    cssStrategy: CssStrategy;
    formatting: any;
    includePropTypes: boolean;
    extractStyles: boolean;
    convertClassToClassName: boolean;
    includeReactImport: boolean;
    extractCssToSeparateFile: boolean;
    cssClassPrefix: string;
    optimizeCss: boolean;
  } {
    const settings = this.currentSettings;

    return {
      componentName: options.componentName || 'Component',
      outputFormat: options.outputFormat || settings.component.outputFormat,
      cssStrategy: options.cssStrategy || settings.css.strategy,
      formatting: options.formatting || settings.formatting,
      includePropTypes: options.includePropTypes ?? settings.component.includePropTypes,
      extractStyles: options.extractStyles ?? settings.component.extractStyles,
      convertClassToClassName: options.convertClassToClassName ?? settings.component.convertClassToClassName,
      includeReactImport: options.includeReactImport ?? settings.component.includeReactImport,
      extractCssToSeparateFile: options.extractCssToSeparateFile ?? settings.css.extractToSeparateFile,
      cssClassPrefix: options.cssClassPrefix || settings.css.classPrefix,
      optimizeCss: options.optimizeCss ?? settings.css.optimize,
    };
  }

  /**
   * Convert parsed node back to HTML string
   */
  private nodeToHtml(node: any): string {
    if (!node) return '';

    switch (node.type) {
      case 'element':
        const attrs = Object.entries(node.attributes?.html || {})
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
        const children = (node.children || []).map((c: any) => this.nodeToHtml(c)).join('');
        return `<${node.tagName}${attrs ? ' ' + attrs : ''}>${children}</${node.tagName}>`;

      case 'text':
        return node.textContent || '';

      case 'fragment':
        return (node.children || []).map((c: any) => this.nodeToHtml(c)).join('');

      default:
        return '';
    }
  }

  /**
   * Simple HTML to AST conversion
   */
  private htmlToAst(html: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const root = doc.body.firstElementChild;

    if (!root) {
      return { type: 'fragment', children: [] };
    }

    return this.elementToAst(root);
  }

  /**
   * Convert DOM element to AST node
   */
  private elementToAst(element: Element): any {
    const attributes: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    const children: any[] = [];
    for (const child of Array.from(element.childNodes)) {
      if (child instanceof Element) {
        children.push(this.elementToAst(child));
      } else if (child instanceof Text) {
        if (child.textContent?.trim()) {
          children.push({
            type: 'text',
            value: child.textContent,
          });
        }
      }
    }

    return {
      type: 'element',
      tagName: element.tagName.toLowerCase(),
      attributes: { html: attributes, events: [] },
      children,
    };
  }

  /**
   * Check if operation should be aborted
   */
  private checkAbort(): void {
    if (this.abortController?.signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
  }

  /**
   * Cancel the current conversion
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Update settings and refresh internal state
   */
  updateSettings(settings: Partial<AppSettings>): void {
    this.settingsStore.updateSettings(settings);
    this.refreshSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): AppSettings {
    return { ...this.currentSettings };
  }
}

/**
 * Singleton orchestrator instance
 */
let orchestratorInstance: ConverterOrchestrator | null = null;

/**
 * Get the singleton orchestrator instance
 */
export function getConverterOrchestrator(): ConverterOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ConverterOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetConverterOrchestrator(): void {
  orchestratorInstance = null;
}
