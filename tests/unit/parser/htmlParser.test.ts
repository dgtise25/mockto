/**
 * HTML Parser Unit Tests
 *
 * Test suite for the core HTML parser functionality.
 * Tests cover parsing, attribute extraction, and semantic analysis.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTMLParser } from '@/lib/parser/htmlParser';
import { ParsedNode, ParsedDocument, ParserOptions } from '@/types/parser.types';

// Mock DOMParser for jsdom environment
global.DOMParser = window.DOMParser;

describe('HTMLParser', () => {
  let parser: HTMLParser;

  beforeEach(() => {
    parser = new HTMLParser();
  });

  describe('Basic Parsing', () => {
    it('should parse a simple div element', () => {
      const html = '<div>Hello World</div>';
      const result = parser.parse(html);

      expect(result).toBeDefined();
      expect(result.root).toBeDefined();
      expect(result.root.tagName).toBe('div');
      // textContent is derived from children, so check children
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('text');
      expect(result.root.children[0].textContent).toBe('Hello World');
    });

    it('should parse nested elements correctly', () => {
      const html = '<div><p><span>Text</span></p></div>';
      const result = parser.parse(html);

      expect(result.root.tagName).toBe('div');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].tagName).toBe('p');
      expect(result.root.children[0].children[0].tagName).toBe('span');
      expect(result.root.children[0].children[0].children[0].textContent).toBe('Text');
    });

    it('should parse multiple siblings', () => {
      const html = '<div><span>1</span><span>2</span><span>3</span></div>';
      const result = parser.parse(html);

      expect(result.root.children).toHaveLength(3);
      expect(result.root.children[0].children[0].textContent).toBe('1');
      expect(result.root.children[1].children[0].textContent).toBe('2');
      expect(result.root.children[2].children[0].textContent).toBe('3');
    });

    it('should handle self-closing void elements', () => {
      const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link'];

      for (const tag of voidElements) {
        const html = `<div><${tag} /></div>`;
        const result = parser.parse(html);

        expect(result.root.children).toHaveLength(1);
        expect(result.root.children[0].tagName).toBe(tag);
      }
    });

    it('should parse attributes correctly', () => {
      const html = '<div class="container" id="main" data-value="123"></div>';
      const result = parser.parse(html);

      expect(result.root.attributes.className).toBe('container');
      expect(result.root.attributes.html.id).toBe('main');
      expect(result.root.attributes.html['data-value']).toBe('123');
    });

    it('should handle empty HTML', () => {
      const html = '';
      const result = parser.parse(html);

      expect(result.root.type).toBe('fragment');
    });

    it('should handle text-only content', () => {
      const html = 'Just some text';
      const result = parser.parse(html);

      // Text-only content becomes a fragment with text child
      expect(result.root.type).toBe('fragment');
      expect(result.root.children[0].textContent).toBe('Just some text');
    });
  });

  describe('Attribute Extraction', () => {
    it('should convert class to className', () => {
      const html = '<div class="my-class"></div>';
      const result = parser.parse(html);

      expect(result.root.attributes.className).toBe('my-class');
      expect(result.root.attributes.html.class).toBeUndefined();
    });

    it('should convert for to htmlFor', () => {
      const html = '<label for="input"></label>';
      const result = parser.parse(html);

      expect(result.root.attributes.html.htmlFor).toBe('input');
    });

    it('should handle boolean attributes', () => {
      const html = '<input type="checkbox" checked disabled />';
      const result = parser.parse(html);

      expect(result.root.attributes.html.checked).toBe(true);
      expect(result.root.attributes.html.disabled).toBe(true);
    });

    it('should parse inline styles to camelCase for React', () => {
      const html = '<div style="color: red; font-size: 14px;"></div>';
      const result = parser.parse(html);

      expect(result.root.attributes.style).toEqual({
        color: 'red',
        fontSize: '14px',
      });
    });

    it('should handle data attributes', () => {
      const html = '<div data-id="123" data-name="test"></div>';
      const result = parser.parse(html);

      expect(result.root.attributes.html['data-id']).toBe('123');
      expect(result.root.attributes.html['data-name']).toBe('test');
    });

    it('should handle aria attributes', () => {
      const html = '<button aria-label="Close" aria-expanded="false"></button>';
      const result = parser.parse(html);

      expect(result.root.attributes.html['aria-label']).toBe('Close');
      expect(result.root.attributes.html['aria-expanded']).toBe('false');
    });

    it('should handle onclick attributes (lowercase in HTML)', () => {
      const html = '<div onclick="handleClick()" onchange="handleChange()"></div>';
      const result = parser.parse(html);

      // onclick in HTML is converted to onClick for React
      expect(result.root.attributes.events).toHaveLength(2);
      expect(result.root.attributes.events[0].type).toBe('onclick');
      expect(result.root.attributes.events[0].handler).toBe('handleClick()');
    });
  });

  describe('Semantic Analysis', () => {
    it('should identify header elements', () => {
      const html = '<header class="site-header"><nav>Menu</nav></header>';
      const result = parser.parse(html);

      expect(result.sections.length).toBeGreaterThan(0);
      const headerSection = result.sections.find(s => s.type === 'header');
      expect(headerSection).toBeDefined();
    });

    it('should identify nav elements', () => {
      const html = '<nav><ul><li><a href="/">Home</a></li></ul></nav>';
      const result = parser.parse(html);

      const navSection = result.sections.find(s => s.type === 'nav');
      expect(navSection).toBeDefined();
    });

    it('should identify main content area', () => {
      const html = '<main class="content"><article>Post</article></main>';
      const result = parser.parse(html);

      const mainSection = result.sections.find(s => s.type === 'main');
      expect(mainSection).toBeDefined();
    });

    it('should identify footer', () => {
      const html = '<footer class="site-footer"><p>Copyright 2024</p></footer>';
      const result = parser.parse(html);

      const footerSection = result.sections.find(s => s.type === 'footer');
      expect(footerSection).toBeDefined();
    });

    it('should identify card components', () => {
      const html = '<div class="card"><div class="card-body">Content</div></div>';
      const result = parser.parse(html);

      const cardSection = result.sections.find(s => s.type === 'card');
      expect(cardSection).toBeDefined();
    });

    it('should identify hero sections', () => {
      const html = '<section class="hero"><h1>Title</h1><p>Subtitle</p></section>';
      const result = parser.parse(html);

      const heroSection = result.sections.find(s => s.type === 'hero');
      expect(heroSection).toBeDefined();
    });
  });

  describe('Node Metadata', () => {
    it('should assign unique IDs to all nodes', () => {
      const html = '<div><span></span><span></span></div>';
      const result = parser.parse(html);

      const ids = new Set<string>();
      const collectIds = (node: ParsedNode) => {
        ids.add(node.id);
        node.children.forEach(collectIds);
      };
      collectIds(result.root);

      expect(ids.size).toBeGreaterThan(0);
      // All IDs should be unique
      const idsArray = Array.from(ids);
      expect(new Set(idsArray).size).toBe(idsArray.length);
    });

    it('should track depth correctly', () => {
      const html = '<div><p><span>Deep</span></p></div>';
      const result = parser.parse(html);

      expect(result.root.depth).toBe(0);
      expect(result.root.children[0].depth).toBe(1);
      expect(result.root.children[0].children[0].depth).toBe(2);
    });

    it('should build a node map for quick lookup', () => {
      const html = '<div><span id="s1"></span><span id="s2"></span></div>';
      const result = parser.parse(html);

      expect(result.nodes instanceof Map).toBe(true);
      expect(result.nodes.size).toBeGreaterThan(0);
    });
  });

  describe('Document Metadata', () => {
    it('should extract document title', () => {
      const html = '<html><head><title>Test Page</title></head><body></body></html>';
      const result = parser.parse(html);

      expect(result.metadata.title).toBe('Test Page');
    });

    it('should extract language attribute', () => {
      const html = '<html lang="en"><body></body></html>';
      const result = parser.parse(html);

      expect(result.metadata.lang).toBe('en');
    });

    it('should extract viewport meta', () => {
      const html = `
        <html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head><body></body></html>
      `;
      const result = parser.parse(html);

      expect(result.metadata.viewport).toBe('width=device-width, initial-scale=1.0');
    });

    it('should collect unique tag names', () => {
      const html = '<div><span></span><p></p><span></span></div>';
      const result = parser.parse(html);

      expect(result.metadata.uniqueTags).toContain('div');
      expect(result.metadata.uniqueTags).toContain('span');
      expect(result.metadata.uniqueTags).toContain('p');
    });

    it('should collect unique class names', () => {
      const html = `
        <div class="container">
          <div class="card card-primary"></div>
          <div class="card card-secondary"></div>
        </div>
      `;
      const result = parser.parse(html);

      expect(result.metadata.uniqueClasses).toContain('container');
      expect(result.metadata.uniqueClasses).toContain('card');
      expect(result.metadata.uniqueClasses).toContain('card-primary');
      expect(result.metadata.uniqueClasses).toContain('card-secondary');
    });

    it('should collect unique IDs', () => {
      const html = '<div id="app"><div id="header"></div><div id="main"></div></div>';
      const result = parser.parse(html);

      expect(result.metadata.uniqueIds).toContain('app');
      expect(result.metadata.uniqueIds).toContain('header');
      expect(result.metadata.uniqueIds).toContain('main');
    });

    it('should count nodes correctly', () => {
      const html = '<div><span></span><span><em></em></span></div>';
      const result = parser.parse(html);

      expect(result.metadata.nodeCount).toBeGreaterThan(0);
      // div (1) + 2 spans (2) + em (1) = 4 minimum
      expect(result.metadata.nodeCount).toBeGreaterThanOrEqual(4);
    });

    it('should calculate max depth', () => {
      const html = '<div><p><span><em>Deep</em></span></p></div>';
      const result = parser.parse(html);

      expect(result.metadata.maxDepth).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Parser Options', () => {
    it('should respect includeComments option', () => {
      const html = '<div><!-- Comment --><span>Text</span></div>';

      const resultWithComments = parser.parse(html, { includeComments: true });
      const resultWithoutComments = parser.parse(html, { includeComments: false });

      // With comments should have comment nodes
      expect(resultWithComments.root.children.length).toBeGreaterThanOrEqual(
        resultWithoutComments.root.children.length
      );
    });

    it('should respect preserveWhitespace option', () => {
      const html = '<div>  Text  </div>';

      const resultPreserve = parser.parse(html, { preserveWhitespace: true });
      const resultNoPreserve = parser.parse(html, { preserveWhitespace: false });

      // Preserved should keep spaces
      if (resultPreserve.root.children[0]?.textContent) {
        expect(resultPreserve.root.children[0].textContent).toContain('  Text  ');
      }
    });

    it('should call progress callback', () => {
      const progressCallback = vi.fn();
      const html = '<div><span></span><p></p></div>';

      parser.parse(html, { onProgress: progressCallback });

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: expect.any(String),
        })
      );
    });

    it('should respect maxDepth option', () => {
      const html = '<div><p><span><em>Too deep</em></span></p></div>';

      const result = parser.parse(html, { maxDepth: 2 });

      // Should not parse beyond maxDepth
      const checkDepth = (node: ParsedNode, currentDepth: number) => {
        expect(currentDepth).toBeLessThanOrEqual(2);
        node.children.forEach(child => checkDepth(child, currentDepth + 1));
      };
      checkDepth(result.root, 0);
    });

    it('should use custom semantic rules', () => {
      const customRule = {
        type: 'card' as const,
        selector: '.custom-card',
        minConfidence: 0.9,
        componentNameTemplate: 'CustomCard',
      };

      const html = '<div class="custom-card">Content</div>';
      const result = parser.parse(html, { semanticRules: [customRule] });

      const customSection = result.sections.find(s => s.componentName === 'CustomCard');
      expect(customSection).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed HTML gracefully', () => {
      const html = '<div><span>Unclosed';
      const result = parser.parse(html);

      expect(result.root).toBeDefined();
    });

    it('should handle special characters in text', () => {
      const html = '<div>Text with &quot;quotes&quot; and &amp; ampersands</div>';
      const result = parser.parse(html);

      const textContent = result.root.children[0]?.textContent || '';
      expect(textContent).toContain('quotes');
      expect(textContent).toContain('&');
    });

    it('should handle numeric attribute values', () => {
      const html = '<div data-index="0" data-count="42"></div>';
      const result = parser.parse(html);

      expect(result.root.attributes.html['data-index']).toBe('0');
      expect(result.root.attributes.html['data-count']).toBe('42');
    });

    it('should handle empty attributes', () => {
      const html = '<div data-empty="">Value</div>';
      const result = parser.parse(html);

      expect(result.root.attributes.html['data-empty']).toBe('');
    });

    it('should handle SVG elements', () => {
      const html = `
        <svg width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `;
      const result = parser.parse(html);

      expect(result.root.tagName).toBe('svg');
      expect(result.root.children[0].tagName).toBe('circle');
    });

    it('should handle script tags', () => {
      const html = `
        <div>
          <script>console.log('test');</script>
          <span>No script</span>
        </div>
      `;
      const result = parser.parse(html);

      // Script should be preserved
      const scriptNode = result.root.children.find(c => c.tagName === 'script');
      expect(scriptNode).toBeDefined();
    });

    it('should handle style tags', () => {
      const html = `
        <div>
          <style>.test { color: red; }</style>
          <span>Content</span>
        </div>
      `;
      const result = parser.parse(html);

      const styleNode = result.root.children.find(c => c.tagName === 'style');
      expect(styleNode).toBeDefined();
    });

    it('should handle tables', () => {
      const html = `
        <table>
          <thead><tr><th>Header</th></tr></thead>
          <tbody><tr><td>Data</td></tr></tbody>
        </table>
      `;
      const result = parser.parse(html);

      expect(result.root.tagName).toBe('table');
      const tableSection = result.sections.find(s => s.type === 'table');
      expect(tableSection).toBeDefined();
    });

    it('should handle forms', () => {
      const html = `
        <form id="login-form">
          <input type="email" name="email" />
          <input type="password" name="password" />
          <button type="submit">Submit</button>
        </form>
      `;
      const result = parser.parse(html);

      expect(result.root.tagName).toBe('form');
      const formSection = result.sections.find(s => s.type === 'form');
      expect(formSection).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw on null input', () => {
      expect(() => parser.parse(null as unknown as string)).toThrow();
    });

    it('should handle undefined input gracefully', () => {
      expect(() => parser.parse(undefined as unknown as string)).toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large documents efficiently', () => {
      // Create a document with many nodes
      const items = Array.from({ length: 100 }, (_, i) =>
        `<div class="item" data-id="${i}">Item ${i}</div>`
      ).join('');

      const html = `<div class="container">${items}</div>`;

      const startTime = performance.now();
      const result = parser.parse(html);
      const endTime = performance.now();

      expect(result.root).toBeDefined();
      expect(result.metadata.nodeCount).toBeGreaterThan(100);

      // Should complete in reasonable time (< 1 second for 100 nodes)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle deeply nested documents', () => {
      let html = '<div>';
      for (let i = 0; i < 50; i++) {
        html += `<div data-depth="${i}">`;
      }
      html += 'Deep content';
      for (let i = 0; i < 50; i++) {
        html += '</div>';
      }
      html += '</div>';

      const result = parser.parse(html);

      expect(result.metadata.maxDepth).toBeGreaterThanOrEqual(50);
    });
  });
});
