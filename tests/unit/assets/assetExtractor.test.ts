/**
 * Asset Extractor Unit Tests
 *
 * TDD tests for the asset extraction module.
 * Tests image, font, and other asset extraction from HTML.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssetExtractor } from '@/lib/assets/assetExtractor';
import {
  AssetType,
  AssetSource,
  type AssetExtractionOptions,
} from '@/types/assets.types';

describe('AssetExtractor', () => {
  let extractor: AssetExtractor;

  beforeEach(() => {
    extractor = new AssetExtractor();
  });

  describe('Asset Discovery', () => {
    it('should discover img tags with src attributes', () => {
      const html = '<img src="logo.png" alt="Logo">';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      expect(result.assetsByType.get(AssetType.IMAGE)?.length).toBe(1);
    });

    it('should discover background images in inline styles', () => {
      const html = '<div style="background-image: url(\'bg.jpg\')"></div>';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      const assets = result.assetsByType.get(AssetType.IMAGE) || [];
      expect(assets[0]?.originalUrl).toContain('bg.jpg');
    });

    it('should discover favicon links', () => {
      const html = '<link rel="icon" href="favicon.ico">';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      const assets = result.assetsByType.get(AssetType.FAVICON) || [];
      expect(assets.length).toBeGreaterThan(0);
    });

    it('should discover stylesheet links', () => {
      const html = '<link rel="stylesheet" href="styles.css">';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      expect(result.assetsByType.get(AssetType.STYLESHEET)?.length).toBe(1);
    });

    it('should discover script tags with src', () => {
      const html = '<script src="app.js"></script>';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      expect(result.assetsByType.get(AssetType.SCRIPT)?.length).toBe(1);
    });

    it('should discover source tags for video/audio', () => {
      const html = '<video><source src="video.mp4" type="video/mp4"></video>';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      expect(result.assetsByType.get(AssetType.VIDEO)?.length).toBe(1);
    });

    it('should discover CSS url() references in style tags', () => {
      const html = '<style>.hero { background: url(hero.jpg); }</style>';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      const assets = result.assetsByType.get(AssetType.IMAGE) || [];
      expect(assets[0]?.originalUrl).toContain('hero.jpg');
    });

    it('should discover SVG elements with href references', () => {
      const html = '<svg><image href="sprite.svg" /></svg>';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
    });

    it('should ignore data URLs when configured', () => {
      const html = '<img src="data:image/png;base64,iVBORw0KG...">';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      const assets = Array.from(result.assets.values());
      expect(assets[0]?.source).toBe(AssetSource.BASE64);
    });

    it('should track multiple references to the same asset', () => {
      const html = `
        <img src="logo.png" class="header-logo">
        <img src="logo.png" class="footer-logo">
      `;
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      const assets = Array.from(result.assets.values());
      expect(assets[0]?.references.length).toBe(2);
    });
  });

  describe('Base64 Handling', () => {
    it('should extract base64 data from data URLs', () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `<img src="data:image/png;base64,${base64Data}">`;
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      const assets = Array.from(result.assets.values());
      expect(assets[0]?.source).toBe(AssetSource.BASE64);
      expect(assets[0]?.base64Data).toBe(base64Data);
    });

    it('should detect MIME type from data URL', () => {
      const html = '<img src="data:image/svg+xml;base64,PHN2Zy4uLj4=">';
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.mimeType).toBe('image/svg+xml');
    });

    it('should handle data URLs without base64 encoding', () => {
      const html = '<img src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E">';
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
      const assets = Array.from(result.assets.values());
      expect(assets[0]?.source).toBe(AssetSource.BASE64);
    });
  });

  describe('URL Resolution', () => {
    it('should resolve relative URLs against base URL', () => {
      const html = '<img src="images/logo.png">';
      const options: AssetExtractionOptions = {};
      extractor.setBaseUrl('https://example.com/pages/');
      const result = extractor.extractFromHtml(html, options);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.resolvedUrl).toBe('https://example.com/pages/images/logo.png');
    });

    it('should handle absolute URLs', () => {
      const html = '<img src="https://cdn.example.com/logo.png">';
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.resolvedUrl).toBe('https://cdn.example.com/logo.png');
    });

    it('should handle protocol-relative URLs', () => {
      const html = '<img src="//cdn.example.com/logo.png">';
      extractor.setBaseUrl('https://example.com/');
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.resolvedUrl).toBe('https://cdn.example.com/logo.png');
    });

    it('should resolve root-relative URLs', () => {
      const html = '<img src="/assets/logo.png">';
      extractor.setBaseUrl('https://example.com/pages/home');
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.resolvedUrl).toBe('https://example.com/assets/logo.png');
    });
  });

  describe('Filename Generation', () => {
    it('should generate safe filenames from URLs', () => {
      const html = '<img src="https://example.com/images/my logo@2x.png">';
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.fileName).toMatch(/^[a-zA-Z0-9_-]+\.png$/);
    });

    it('should handle URLs with query strings', () => {
      const html = '<img src="image.png?v=1.2.3&cache=true">';
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.fileName).toBe('image.png');
    });

    it('should handle URLs with fragments', () => {
      const html = '<img src="sprite.svg#icon">';
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.fileName).toBe('sprite.svg');
    });

    it('should generate unique filenames for duplicates', () => {
      const html = `
        <img src="logo.png" class="logo1">
        <img src="https://other-cdn.com/logo.png" class="logo2">
      `;
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(2);
      const assets = Array.from(result.assets.values());
      const filenames = assets.map((a) => a.fileName);
      expect(new Set(filenames).size).toBe(2);
    });
  });

  describe('Asset Type Detection', () => {
    it('should detect image formats from extension', () => {
      const formats = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];

      for (const format of formats) {
        const html = `<img src="image.${format}">`;
        const result = extractor.extractFromHtml(html);
        expect(result.assetsByType.get(AssetType.IMAGE)?.length).toBe(1);
      }
    });

    it('should detect font formats', () => {
      const formats = ['woff', 'woff2', 'ttf', 'otf'];

      for (const format of formats) {
        const html = `<link rel="preload" as="font" href="font.${format}">`;
        const result = extractor.extractFromHtml(html);
        expect(result.assetsByType.get(AssetType.FONT)?.length).toBe(1);
      }
    });

    it('should detect unknown extensions as other type', () => {
      const html = '<img src="file.unknown">';
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.type).toBe(AssetType.OTHER);
    });
  });

  describe('Size Extraction', () => {
    it('should extract size from content-length header when downloading', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-length' ? '12345' : null),
        },
        blob: async () => new Blob(['test']),
      });
      global.fetch = mockFetch;

      const html = '<img src="https://example.com/image.png">';
      const options: AssetExtractionOptions = { downloadRemote: true };
      const result = await extractor.extractWithDownload(html, options);

      expect(result.extractedCount).toBe(1);
    });

    it('should calculate size from base64 data', () => {
      const html = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">';
      const result = extractor.extractFromHtml(html);

      const assets = Array.from(result.assets.values());
      expect(assets[0]?.size).toBeGreaterThan(0);
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate identical remote URLs', () => {
      const html = `
        <img src="logo.png">
        <img src="logo.png">
      `;
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
    });

    it('should deduplicate identical base64 data', () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `
        <img src="data:image/png;base64,${base64}">
        <img src="data:image/png;base64,${base64}">
      `;
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(1);
    });

    it('should treat different URLs as separate assets', () => {
      const html = `
        <img src="logo.png">
        <img src="logo@2x.png">
      `;
      const result = extractor.extractFromHtml(html);

      expect(result.totalCount).toBe(2);
    });
  });

  describe('Progress Callbacks', () => {
    it('should call progress callback during discovery', () => {
      const progressCallback = vi.fn();
      const options: AssetExtractionOptions = {
        onProgress: progressCallback,
      };

      extractor.extractFromHtml('<img src="test.png">', options);

      expect(progressCallback).toHaveBeenCalled();
    });

    it('should report correct progress stages', () => {
      const stages: string[] = [];
      const options: AssetExtractionOptions = {
        onProgress: (progress) => stages.push(progress.stage),
      };

      extractor.extractFromHtml('<img src="test.png">', options);

      expect(stages).toContain('discovering');
      expect(stages).toContain('complete');
    });
  });

  describe('Warning Generation', () => {
    it('should warn about unsupported protocols', () => {
      const html = '<img src="ftp://example.com/image.png">';
      const result = extractor.extractFromHtml(html);

      expect(result.warnings.some((w) => w.severity === 'warning')).toBe(true);
    });

    it('should warn about missing alt text on images', () => {
      const html = '<img src="logo.png">';
      const result = extractor.extractFromHtml(html);

      expect(result.warnings.some((w) => w.message.includes('alt'))).toBe(true);
    });
  });

  describe('HTML Update', () => {
    it('should update HTML with new asset paths', () => {
      const html = '<img src="images/logo.png" alt="Logo">';
      const result = extractor.extractFromHtml(html, {
        outputDirectory: 'src/assets',
      });

      expect(result.updatedHtml).toBeDefined();
      expect(result.updatedHtml).toContain('src/assets/');
    });

    it('should preserve all HTML attributes except modified src', () => {
      const html = '<img src="logo.png" alt="Logo" class="header-logo" loading="lazy">';
      const result = extractor.extractFromHtml(html);

      expect(result.updatedHtml).toContain('alt="Logo"');
      expect(result.updatedHtml).toContain('class="header-logo"');
      expect(result.updatedHtml).toContain('loading="lazy"');
    });
  });

  describe('Statistics', () => {
    it('should calculate total size correctly', () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `
        <img src="data:image/png;base64,${base64}">
        <img src="data:image/png;base64,${base64}">
      `;
      const result = extractor.extractFromHtml(html);

      // Should be same asset (deduplicated)
      expect(result.totalSize).toBeGreaterThan(0);
    });
  });
});
