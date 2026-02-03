/**
 * Pattern Detector Unit Tests
 * Tests for detecting repeating patterns in HTML
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PatternDetector, PatternDetectionResult } from '../../../src/lib/converter/patternDetector';

describe('PatternDetector', () => {
  let detector: PatternDetector;

  beforeEach(() => {
    detector = new PatternDetector();
  });

  describe('Initialization', () => {
    it('should create detector with default options', () => {
      expect(detector).toBeInstanceOf(PatternDetector);
    });

    it('should create detector with custom options', () => {
      const customDetector = new PatternDetector({
        minPatternOccurrences: 3,
        similarityThreshold: 0.85
      });
      expect(customDetector).toBeInstanceOf(PatternDetector);
    });
  });

  describe('Card Pattern Detection', () => {
    it('should detect identical card structures', () => {
      const html = `
        <div class="card">
          <div class="card-header">Title 1</div>
          <div class="card-body">Content 1</div>
        </div>
        <div class="card">
          <div class="card-header">Title 2</div>
          <div class="card-body">Content 2</div>
        </div>
      `;

      const patterns = detector.detectPatterns(html);

      const cardPattern = patterns.find(p => p.pattern === 'card');
      expect(cardPattern).toBeDefined();
      expect(cardPattern?.count).toBeGreaterThanOrEqual(2);
    });

    it('should detect cards with similar but not identical structure', () => {
      const html = `
        <div class="product-card">
          <img src="img1.jpg" />
          <h3>Product 1</h3>
          <p>$10.00</p>
        </div>
        <div class="product-card">
          <img src="img2.jpg" />
          <h3>Product 2</h3>
          <p>$20.00</p>
        </div>
        <div class="product-card">
          <img src="img3.jpg" />
          <h3>Product 3</h3>
          <p>$30.00</p>
        </div>
      `;

      const patterns = detector.detectPatterns(html);

      const productCardPattern = patterns.find(p => p.pattern.includes('product-card'));
      expect(productCardPattern).toBeDefined();
      expect(productCardPattern?.count).toBe(3);
    });

    it('should assign high confidence to identical patterns', () => {
      const html = `
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
        <div class="item">Item 3</div>
      `;

      const patterns = detector.detectPatterns(html);

      const itemPattern = patterns.find(p => p.pattern === 'item');
      expect(itemPattern?.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Navigation Pattern Detection', () => {
    it('should detect nav items', () => {
      const html = `
        <nav class="main-nav">
          <a href="/" class="nav-link">Home</a>
          <a href="/about" class="nav-link">About</a>
          <a href="/contact" class="nav-link">Contact</a>
        </nav>
      `;

      const patterns = detector.detectPatterns(html);

      const navLinkPattern = patterns.find(p =>
        p.pattern.includes('nav-link') || p.pattern.includes('nav')
      );
      expect(navLinkPattern).toBeDefined();
      expect(navLinkPattern?.count).toBe(3);
    });

    it('should detect nested menu items', () => {
      const html = `
        <ul class="menu">
          <li class="menu-item">
            <a href="#">Item 1</a>
          </li>
          <li class="menu-item">
            <a href="#">Item 2</a>
          </li>
          <li class="menu-item">
            <a href="#">Item 3</a>
          </li>
        </ul>
      `;

      const patterns = detector.detectPatterns(html);

      const menuItemPattern = patterns.find(p => p.pattern.includes('menu-item'));
      expect(menuItemPattern).toBeDefined();
    });

    it('should detect breadcrumb items', () => {
      const html = `
        <nav class="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/products">Products</a>
          <span>/</span>
          <span>Category</span>
        </nav>
      `;

      const patterns = detector.detectPatterns(html);

      const breadcrumbPattern = patterns.find(p => p.pattern.includes('breadcrumb'));
      expect(breadcrumbPattern).toBeDefined();
    });
  });

  describe('List Pattern Detection', () => {
    it('should detect definition list items', () => {
      const html = `
        <dl>
          <dt>Term 1</dt>
          <dd>Definition 1</dd>
          <dt>Term 2</dt>
          <dd>Definition 2</dd>
          <dt>Term 3</dt>
          <dd>Definition 3</dd>
        </dl>
      `;

      const patterns = detector.detectPatterns(html);

      // Should detect the dt/dd pair pattern
      const hasDefinitionPattern = patterns.some(p =>
        p.elements.some(e => e.includes('dt') || e.includes('dd'))
      );
      expect(hasDefinitionPattern).toBe(true);
    });

    it('should detect table rows as repeating pattern', () => {
      const html = `
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th></tr>
          </thead>
          <tbody>
            <tr><td>John</td><td>john@example.com</td></tr>
            <tr><td>Jane</td><td>jane@example.com</td></tr>
            <tr><td>Bob</td><td>bob@example.com</td></tr>
          </tbody>
        </table>
      `;

      const patterns = detector.detectPatterns(html);

      const rowPattern = patterns.find(p => p.elements.some(e => e.includes('tr')));
      expect(rowPattern).toBeDefined();
    });
  });

  describe('Section Pattern Detection', () => {
    it('should detect similar section structures', () => {
      const html = `
        <section class="feature-section">
          <h2>Feature 1</h2>
          <p>Description of feature 1</p>
        </section>
        <section class="feature-section">
          <h2>Feature 2</h2>
          <p>Description of feature 2</p>
        </section>
        <section class="feature-section">
          <h2>Feature 3</h2>
          <p>Description of feature 3</p>
        </section>
      `;

      const patterns = detector.detectPatterns(html);

      const featurePattern = patterns.find(p => p.pattern.includes('feature'));
      expect(featurePattern).toBeDefined();
    });

    it('should detect hero sections', () => {
      const html = `
        <section class="hero">
          <h1>Welcome</h1>
          <p>Subtitle</p>
          <button>CTA</button>
        </section>
      `;

      const patterns = detector.detectPatterns(html);

      const heroPattern = patterns.find(p => p.pattern.includes('hero'));
      expect(heroPattern).toBeDefined();
    });
  });

  describe('Pattern Similarity Analysis', () => {
    it('should calculate similarity between DOM structures', () => {
      const structure1 = '<div class="card"><h3>Title</h3><p>Body</p></div>';
      const structure2 = '<div class="card"><h3>Title</h3><p>Body</p></div>';
      const structure3 = '<div class="card"><h3>Title</h3><ul><li>Item</li></ul></div>';

      const similarity12 = detector.calculateSimilarity(structure1, structure2);
      const similarity13 = detector.calculateSimilarity(structure1, structure3);

      expect(similarity12).toBeGreaterThan(similarity13);
      expect(similarity12).toBeCloseTo(1.0, 1);
    });

    it('should detect patterns despite content differences', () => {
      const html = `
        <div class="card">
          <h3>Different Title A</h3>
          <p>Different content X</p>
        </div>
        <div class="card">
          <h3>Different Title B</h3>
          <p>Different content Y</p>
        </div>
      `;

      const patterns = detector.detectPatterns(html);

      const cardPattern = patterns.find(p => p.pattern === 'card');
      expect(cardPattern).toBeDefined();
      expect(cardPattern?.confidence).toBeGreaterThan(0.7);
    });

    it('should handle patterns with optional elements', () => {
      const html = `
        <div class="item">
          <span class="badge">New</span>
          <h4>Item 1</h4>
        </div>
        <div class="item">
          <h4>Item 2</h4>
        </div>
        <div class="item">
          <span class="badge">Hot</span>
          <h4>Item 3</h4>
        </div>
      `;

      const patterns = detector.detectPatterns(html);

      const itemPattern = patterns.find(p => p.pattern === 'item');
      expect(itemPattern).toBeDefined();
      // Should still detect pattern despite optional badge element
    });
  });

  describe('Pattern Classification', () => {
    it('should classify card patterns', () => {
      const elements = [
        '<div class="card">...</div>',
        '<div class="card">...</div>',
        '<div class="card">...</div>'
      ];

      const pattern = detector.classifyPattern(elements);

      expect(pattern).toContain('card');
    });

    it('should classify navigation patterns', () => {
      const elements = [
        '<a class="nav-link">Link 1</a>',
        '<a class="nav-link">Link 2</a>',
        '<a class="nav-link">Link 3</a>'
      ];

      const pattern = detector.classifyPattern(elements);

      expect(pattern).toContain('nav');
    });

    it('should classify list item patterns', () => {
      const elements = [
        '<li class="list-item">Item 1</li>',
        '<li class="list-item">Item 2</li>',
        '<li class="list-item">Item 3</li>'
      ];

      const pattern = detector.classifyPattern(elements);

      expect(pattern).toContain('list');
    });
  });

  describe('Repeating Pattern Detection', () => {
    it('should identify if elements form a repeating pattern', () => {
      const elements = [
        '<div class="card">Card 1</div>',
        '<div class="card">Card 2</div>',
        '<div class="card">Card 3</div>'
      ];

      const isRepeating = detector.isRepeatingPattern(elements);

      expect(isRepeating).toBe(true);
    });

    it('should return false for non-repeating elements', () => {
      const elements = [
        '<header>Header</header>',
        '<main>Content</main>',
        '<footer>Footer</footer>'
      ];

      const isRepeating = detector.isRepeatingPattern(elements);

      expect(isRepeating).toBe(false);
    });

    it('should respect minPatternOccurrences threshold', () => {
      const detectorWithThreshold = new PatternDetector({
        minPatternOccurrences: 5
      });

      const elements = [
        '<div class="item">Item 1</div>',
        '<div class="item">Item 2</div>',
        '<div class="item">Item 3</div>'
      ];

      const isRepeating = detectorWithThreshold.isRepeatingPattern(elements);

      expect(isRepeating).toBe(false);
    });
  });

  describe('Pattern Grouping', () => {
    it('should group elements by pattern', () => {
      const html = `
        <div class="card card-1">Card 1</div>
        <div class="card card-2">Card 2</div>
        <div class="card card-3">Card 3</div>
      `;

      const patterns = detector.detectPatterns(html);

      const cardPattern = patterns.find(p => p.pattern === 'card');
      expect(cardPattern?.elements).toHaveLength(3);
    });

    it('should handle multiple different patterns', () => {
      const html = `
        <div class="card">Card 1</div>
        <div class="card">Card 2</div>
        <nav class="nav-link">Link 1</nav>
        <nav class="nav-link">Link 2</nav>
        <li class="item">Item 1</li>
        <li class="item">Item 2</li>
      `;

      const patterns = detector.detectPatterns(html);

      expect(patterns.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty HTML', () => {
      const patterns = detector.detectPatterns('');
      expect(patterns).toEqual([]);
    });

    it('should handle single element (no pattern)', () => {
      const html = '<div class="card">Only one</div>';
      const patterns = detector.detectPatterns(html);

      expect(patterns).toEqual([]);
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<div>Unclosed<div>Another</div>';
      const patterns = detector.detectPatterns(html);

      // Should not throw
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should handle deeply nested similar structures', () => {
      const html = `
        <div class="outer">
          <div class="inner">
            <div class="deep">Content 1</div>
          </div>
        </div>
        <div class="outer">
          <div class="inner">
            <div class="deep">Content 2</div>
          </div>
        </div>
      `;

      const patterns = detector.detectPatterns(html);

      // Should detect pattern at appropriate level
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Result Structure', () => {
    it('should return properly structured pattern results', () => {
      const html = `
        <div class="card">Card 1</div>
        <div class="card">Card 2</div>
      `;

      const patterns = detector.detectPatterns(html);

      if (patterns.length > 0) {
        expect(patterns[0]).toMatchObject({
          pattern: expect.any(String),
          count: expect.any(Number),
          elements: expect.any(Array),
          confidence: expect.any(Number)
        });
      }
    });

    it('should include confidence score for each pattern', () => {
      const html = `
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
        <div class="item">Item 3</div>
      `;

      const patterns = detector.detectPatterns(html);

      patterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('BEM Pattern Detection', () => {
    it('should detect BEM block patterns', () => {
      const html = `
        <div class="menu">
          <div class="menu__item">Item 1</div>
          <div class="menu__item">Item 2</div>
          <div class="menu__item">Item 3</div>
        </div>
      `;

      const patterns = detector.detectPatterns(html);

      const menuItemPattern = patterns.find(p => p.pattern.includes('menu-item'));
      expect(menuItemPattern).toBeDefined();
    });

    it('should detect BEM modifier variations', () => {
      const html = `
        <button class="btn btn--primary">Primary</button>
        <button class="btn btn--secondary">Secondary</button>
        <button class="btn btn--outline">Outline</button>
      `;

      const patterns = detector.detectPatterns(html);

      const buttonPattern = patterns.find(p => p.pattern.includes('btn'));
      expect(buttonPattern).toBeDefined();
    });
  });

  describe('Data Attribute Pattern Detection', () => {
    it('should detect patterns by data attributes', () => {
      const html = `
        <div data-component="card">Card 1</div>
        <div data-component="card">Card 2</div>
        <div data-component="card">Card 3</div>
      `;

      const patterns = detector.detectPatterns(html);

      const cardPattern = patterns.find(p => p.pattern === 'card');
      expect(cardPattern).toBeDefined();
    });
  });
});
