/**
 * ZIP Generator - Milestone 8
 *
 * Generates ZIP files containing React components, assets, and configuration.
 * Uses JSZip for cross-browser ZIP creation.
 */

import JSZip from 'jszip';
import type {
  ZipOutputOptions,
  ZipGenerationResult,
  ZipGenerationProgress,
  ZipFileEntry,
  AssetBundle,
} from '@/types/assets.types';
import type { GeneratorResult, GeneratedComponent } from '@/types/generator.types';

/**
 * Default package.json template
 */
const DEFAULT_PACKAGE_JSON = {
  name: 'react-app-from-html',
  version: '0.1.0',
  private: true,
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc && vite build',
    preview: 'vite preview',
    lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
  },
  dependencies: {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  },
  devDependencies: {
    '@types/react': '^18.3.3',
    '@types/react-dom': '^18.3.0',
    '@vitejs/plugin-react': '^4.2.1',
    typescript: '^5.4.2',
    vite: '^5.1.6',
  },
};

/**
 * Default tsconfig.json template
 */
const DEFAULT_TSCONFIG = {
  compilerOptions: {
    target: 'ES2020',
    useDefineForClassFields: true,
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
  },
  include: ['src'],
  references: [{ path: './tsconfig.node.json' }],
};

/**
 * Default README.md template
 */
const DEFAULT_README = `# React App from HTML

This React application was generated from an HTML mockup.

## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

## Project Structure

- \`src/\` - React components and styles
- \`src/assets/\` - Images, fonts, and other assets
- \`public/\` - Static files

## Generated Components

This project includes the following components extracted from the original HTML:
`;

/**
 * ZIP output generator
 */
export class ZipGenerator {
  private currentDownloadUrl: string | null = null;

  /**
   * Generate a ZIP file from generator result
   */
  async generateZip(
    generatorResult: GeneratorResult,
    options: ZipOutputOptions,
    sourceHtml?: string
  ): Promise<ZipGenerationResult> {
    this.cleanup();
    const warnings: string[] = [];

    this.reportProgress(options, { stage: 'preparing', processed: 0, total: 0 });

    // Initialize ZIP
    const zip = new JSZip();

    // Add components
    this.reportProgress(options, { stage: 'compressing', processed: 0, total: generatorResult.files.length });

    let fileCount = 0;
    for (const file of generatorResult.files) {
      await this.addFileToZip(zip, file, options, fileCount, generatorResult.files.length);
      fileCount++;
    }

    // Add configuration files
    if (options.includePackageJson) {
      this.addPackageJson(zip, generatorResult, options, warnings);
    }

    // Add tsconfig for TypeScript projects
    const hasTsFiles = generatorResult.files.some((f) => f.fileName.endsWith('.tsx') || f.fileName.endsWith('.ts'));
    if (hasTsFiles) {
      this.addTsconfig(zip);
    }

    // Add README
    if (options.includeReadme) {
      this.addReadme(zip, generatorResult, options);
    }

    // Add source HTML if requested
    if (options.includeSourceHtml && sourceHtml) {
      zip.file('original.html', sourceHtml);
      fileCount++;
    }

    // Generate ZIP blob
    this.reportProgress(options, { stage: 'finalizing', processed: fileCount, total: fileCount });
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: options.compressionLevel || 6 },
      },
      (metadata) => {
        this.reportProgress(options, {
          stage: 'compressing',
          processed: metadata.percent,
          total: 100,
          currentFile: metadata.currentFile || undefined,
        });
      }
    );

    // Build file list
    const files = this.buildFileList(generatorResult.files, options);

    this.reportProgress(options, { stage: 'complete', processed: fileCount, total: fileCount });

    // Add source HTML to file list if included
    if (options.includeSourceHtml && sourceHtml) {
      files.push({
        path: 'original.html',
        fileName: 'original.html',
        size: sourceHtml.length,
        type: 'document',
      });
    }

    return {
      zipBlob,
      size: zipBlob.size,
      files,
      warnings,
    };
  }

  /**
   * Generate ZIP with additional assets
   */
  async generateZipWithAssets(
    generatorResult: GeneratorResult,
    assetBundle: AssetBundle,
    options: ZipOutputOptions,
    sourceHtml?: string
  ): Promise<ZipGenerationResult> {
    // First generate basic ZIP
    const result = await this.generateZip(generatorResult, options, sourceHtml);

    // Now add assets
    const zip = new JSZip();
    await this.loadZipFromBlob(zip, result.zipBlob);

    let fileCount = result.files.length;

    // Add assets
    if (assetBundle.assets.size > 0) {
      this.reportProgress(options, { stage: 'compressing', processed: fileCount, total: fileCount + assetBundle.assets.size });

      for (const [, asset] of assetBundle.assets) {
        const path = options.useSrcDirectory ? `src/assets/${asset.fileName}` : `assets/${asset.fileName}`;
        if (asset.content instanceof Blob) {
          zip.file(path, asset.content);
        } else {
          zip.file(path, asset.content);
        }
        fileCount++;
      }
    }

    // Add additional stylesheets
    if (assetBundle.styles.size > 0) {
      for (const [, style] of assetBundle.styles) {
        const path = options.useSrcDirectory ? `src/styles/${style.fileName}` : `styles/${style.fileName}`;
        zip.file(path, style.content);
        fileCount++;
      }
    }

    // Add configs
    if (assetBundle.configs.size > 0) {
      for (const [, config] of assetBundle.configs) {
        zip.file(config.fileName, config.content);
        fileCount++;
      }
    }

    // Add docs
    if (assetBundle.docs.size > 0) {
      for (const [, doc] of assetBundle.docs) {
        zip.file(doc.fileName, doc.content);
        fileCount++;
      }
    }

    // Regenerate ZIP
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: options.compressionLevel || 6 },
    });

    return {
      ...result,
      zipBlob,
      size: zipBlob.size,
      files: this.buildFileListFromZip(zip),
    };
  }

  /**
   * Add a file to the ZIP
   */
  private async addFileToZip(
    zip: JSZip,
    file: GeneratedComponent,
    options: ZipOutputOptions,
    index: number,
    total: number
  ): Promise<void> {
    if (!file.content) {
      return;
    }

    let path = file.fileName;

    // Apply directory structure
    if (options.useSrcDirectory) {
      path = `src/${file.fileName}`;
    }

    // Organize by file type
    if (file.fileType === 'style') {
      const styleDir = options.useSrcDirectory ? 'src/styles' : 'styles';
      path = `${styleDir}/${file.fileName}`;
    } else if (file.fileType === 'component') {
      const componentDir = options.useSrcDirectory ? 'src/components' : 'components';
      path = `${componentDir}/${file.fileName}`;
    }

    zip.file(path, file.content);

    this.reportProgress(options, {
      stage: 'compressing',
      processed: index + 1,
      total,
      currentFile: file.fileName,
    });
  }

  /**
   * Add package.json to ZIP
   */
  private addPackageJson(
    zip: JSZip,
    generatorResult: GeneratorResult,
    options: ZipOutputOptions,
    warnings: string[]
  ): void {
    const content = options.packageJsonContent || DEFAULT_PACKAGE_JSON;

    // Override name from options
    if (options.zipName && !options.packageJsonContent) {
      (content as any).name = options.zipName.toLowerCase().replace(/\s+/g, '-');
    }

    // Add warning if no components generated
    if (generatorResult.stats.componentsGenerated === 0) {
      warnings.push('No components were generated. The package.json may need manual adjustment.');
    }

    zip.file('package.json', JSON.stringify(content, null, 2));
  }

  /**
   * Add tsconfig.json to ZIP
   */
  private addTsconfig(zip: JSZip): void {
    zip.file('tsconfig.json', JSON.stringify(DEFAULT_TSCONFIG, null, 2));
    zip.file(
      'tsconfig.node.json',
      JSON.stringify(
        {
          compilerOptions: {
            composite: true,
            skipLibCheck: true,
            module: 'ESNext',
            moduleResolution: 'bundler',
            allowSyntheticDefaultImports: true,
          },
          include: ['vite.config.ts'],
        },
        null,
        2
      )
    );
  }

  /**
   * Add README.md to ZIP
   */
  private addReadme(zip: JSZip, generatorResult: GeneratorResult, options: ZipOutputOptions): void {
    let content = options.readmeContent || DEFAULT_README;

    // If using default README, append component list
    if (!options.readmeContent) {
      const componentList = generatorResult.files
        .filter((f) => f.fileType === 'component')
        .map((f) => `  - \`${f.fileName}\``)
        .join('\n');

      if (componentList) {
        content += '\n' + componentList;
      }
    }

    zip.file('README.md', content);
  }

  /**
   * Build file list from generator result
   */
  private buildFileList(files: GeneratedComponent[], options: ZipOutputOptions): ZipFileEntry[] {
    const result: ZipFileEntry[] = [];

    for (const file of files) {
      let path = file.fileName;
      let type = file.fileType;

      if (options.useSrcDirectory) {
        path = `src/${file.fileName}`;
      }

      if (file.fileType === 'style') {
        path = options.useSrcDirectory ? `src/styles/${file.fileName}` : `styles/${file.fileName}`;
      } else if (file.fileType === 'component') {
        path = options.useSrcDirectory ? `src/components/${file.fileName}` : `components/${file.fileName}`;
      }

      const size = new Blob([file.content]).size;

      result.push({
        path,
        fileName: file.fileName, // For convenience
        size,
        type: type as any,
      });
    }

    // Add config files
    if (options.includePackageJson) {
      result.push({ path: 'package.json', fileName: 'package.json', size: JSON.stringify(DEFAULT_PACKAGE_JSON).length, type: 'config' });
    }

    const hasTsFiles = files.some((f) => f.fileName.endsWith('.tsx'));
    if (hasTsFiles) {
      result.push({ path: 'tsconfig.json', fileName: 'tsconfig.json', size: JSON.stringify(DEFAULT_TSCONFIG).length, type: 'config' });
    }

    if (options.includeReadme) {
      result.push({ path: 'README.md', fileName: 'README.md', size: DEFAULT_README.length, type: 'document' });
    }

    return result;
  }

  /**
   * Build file list from ZIP
   */
  private buildFileListFromZip(zip: JSZip): ZipFileEntry[] {
    const result: ZipFileEntry[] = [];

    zip.forEach((relativePath, file) => {
      if (file.dir) return;

      let type: ZipFileEntry['type'] = 'document';
      if (relativePath.endsWith('.tsx') || relativePath.endsWith('.jsx')) {
        type = 'component';
      } else if (relativePath.endsWith('.css') || relativePath.endsWith('.scss')) {
        type = 'style';
      } else if (relativePath.endsWith('.json')) {
        type = 'config';
      } else if (
        relativePath.endsWith('.png') ||
        relativePath.endsWith('.jpg') ||
        relativePath.endsWith('.svg') ||
        relativePath.endsWith('.woff') ||
        relativePath.endsWith('.woff2')
      ) {
        type = 'asset';
      }

      result.push({
        path: relativePath,
        fileName: relativePath.split('/').pop() || relativePath,
        size: 0, // Would need async call to get actual size
        type,
      });
    });

    return result;
  }

  /**
   * Load ZIP from blob (for adding more files)
   */
  private async loadZipFromBlob(zip: JSZip, blob: Blob): Promise<void> {
    const buffer = await blob.arrayBuffer();
    await zip.loadAsync(buffer);
  }

  /**
   * Create download URL for the ZIP
   */
  createDownloadUrl(zipBlob: Blob): string {
    this.cleanup();
    this.currentDownloadUrl = URL.createObjectURL(zipBlob);
    return this.currentDownloadUrl;
  }

  /**
   * Trigger download of the ZIP
   */
  downloadZip(zipBlob: Blob, fileName: string): void {
    const url = this.createDownloadUrl(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate SHA-256 checksum for ZIP
   */
  async generateChecksum(zipBlob: Blob): Promise<string> {
    const buffer = await zipBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Report progress if callback is available
   */
  private reportProgress(options: ZipOutputOptions, progress: ZipGenerationProgress): void {
    options.onProgress?.(progress);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.currentDownloadUrl) {
      URL.revokeObjectURL(this.currentDownloadUrl);
      this.currentDownloadUrl = null;
    }
  }

  /**
   * Destructor - cleanup when done
   */
  destroy(): void {
    this.cleanup();
  }
}

/**
 * Singleton instance for convenience
 */
let defaultZipGenerator: ZipGenerator | null = null;

export function getZipGenerator(): ZipGenerator {
  if (!defaultZipGenerator) {
    defaultZipGenerator = new ZipGenerator();
  }
  return defaultZipGenerator;
}

export function resetZipGenerator(): void {
  if (defaultZipGenerator) {
    defaultZipGenerator.destroy();
    defaultZipGenerator = null;
  }
}
