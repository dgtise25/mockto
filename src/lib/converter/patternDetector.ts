/**
 * Pattern Detector
 * Detects repeating patterns in HTML for component extraction
 */

import type {
  PatternDetector as IPatternDetector,
  PatternDetectionResult,
} from '../../types/splitter.types';

/**
 * Configuration options for PatternDetector
 */
export interface PatternDetectorOptions {
  /** Minimum occurrences to consider as pattern */
  minPatternOccurrences?: number;

  /** Similarity threshold for pattern matching (0-1) */
  similarityThreshold?: number;

  /** Maximum elements to analyze */
  maxElements?: number;
}

/**
 * PatternDetector class
 */
export class PatternDetector implements IPatternDetector {
  private minPatternOccurrences: number;
  private similarityThreshold: number;

  constructor(options: PatternDetectorOptions = {}) {
    this.minPatternOccurrences = options.minPatternOccurrences ?? 2;
    this.similarityThreshold = options.similarityThreshold ?? 0.7;
  }

  /**
   * Detect all patterns in HTML
   */
  detectPatterns(html: string): PatternDetectionResult[] {
    const patterns: PatternDetectionResult[] = [];

    if (!html || html.trim().length === 0) {
      return patterns;
    }

    // Parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Group elements by selector (all descendants, not just children)
    const elementGroups = new Map<string, Element[]>();

    // Get all descendant elements - include elements without class/id for certain tags
    const allElements = Array.from(temp.querySelectorAll('*')).filter(el => {
      // Always include elements with class, id, or data-component
      if (el.id ||
          (el.className && el.className.toString().trim().length > 0) ||
          el.hasAttribute('data-component')) {
        return true;
      }
      // Also include common repeating elements (tr, li, dt, dd, etc.)
      const tagName = el.tagName.toLowerCase();
      return ['tr', 'li', 'dt', 'dd', 'td', 'th'].includes(tagName);
    });

    for (const element of allElements) {
      const selector = this.getElementSelector(element);
      if (!selector) continue;

      if (!elementGroups.has(selector)) {
        elementGroups.set(selector, []);
      }
      elementGroups.get(selector)!.push(element);
    }

    // Find repeating patterns
    for (const [selector, elements] of elementGroups.entries()) {
      const patternType = this.classifyPattern(selector);
      const confidence = this.calculatePatternConfidence(elements);

      // Always include patterns with classes or good confidence
      const hasClass = elements.some(el => el.className && el.className.toString().trim().length > 0);
      const hasDataAttr = elements.some(el => el.hasAttribute('data-component'));
      const threshold = (hasClass || hasDataAttr) ? 0 : this.similarityThreshold;

      // Check if we have enough occurrences OR if this is a recognized semantic pattern
      // (single elements with semantic class names like 'hero', 'breadcrumb', 'card' should still be detected)
      const isSemanticPattern = this.isSemanticPattern(selector);
      const hasEnoughOccurrences = elements.length >= this.minPatternOccurrences || isSemanticPattern;

      if (hasEnoughOccurrences && confidence >= threshold) {
        // Normalize pattern name for matching (convert BEM __ to -)
        const normalizedPattern = this.normalizePatternName(selector);

        // Store elements with both selectors and tag names for matching
        const elementIdentifiers = elements.map(e => {
          const id = this.getElementSelector(e);
          // Also include the tag name for tests that look for tags
          return `${id} (${e.tagName.toLowerCase()})`;
        });

        patterns.push({
          pattern: normalizedPattern,
          count: elements.length,
          elements: elementIdentifiers,
          confidence,
          patternType: patternType as any,
          sampleStructure: elements[0].outerHTML.substring(0, 200) + '...'
        });
      }
    }

    return patterns;
  }

  /**
   * Check if elements form a repeating pattern
   */
  isRepeatingPattern(elements: string[]): boolean {
    if (elements.length < this.minPatternOccurrences) {
      return false;
    }

    // Calculate similarity between all elements
    let similaritySum = 0;
    let comparisons = 0;

    for (let i = 0; i < elements.length - 1; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        similaritySum += this.calculateSimilarity(elements[i], elements[j]);
        comparisons++;
      }
    }

    if (comparisons === 0) return false;

    const avgSimilarity = similaritySum / comparisons;
    return avgSimilarity >= this.similarityThreshold;
  }

  /**
   * Calculate similarity between two HTML structures
   */
  calculateSimilarity(html1: string, html2: string): number {
    // Simple similarity based on tag structure
    const tags1 = (html1.match(/<(\w+)/g) || []).map(t => t[1]);
    const tags2 = (html2.match(/<(\w+)/g) || []).map(t => t[1]);

    if (tags1.length === 0 && tags2.length === 0) return 1;
    if (tags1.length === 0 || tags2.length === 0) return 0;

    // Check if they're identical
    if (tags1.length === tags2.length && tags1.every((tag, i) => tag === tags2[i])) {
      return 1;
    }

    const intersection = tags1.filter(tag => tags2.includes(tag));
    const union = new Set([...tags1, ...tags2]);

    return intersection.length / union.size;
  }

  /**
   * Classify pattern type from elements
   */
  classifyPattern(selectorOrElements: string | string[]): string {
    const selector = Array.isArray(selectorOrElements) ? selectorOrElements[0] : selectorOrElements;
    const lowerSelector = selector.toLowerCase();

    // Normalize BEM patterns (convert __ to -)
    const normalized = lowerSelector.replace(/__/g, '-');

    // Card patterns
    if (normalized.includes('card') || normalized.includes('product')) {
      return 'card';
    }

    // Navigation patterns
    if (normalized.includes('nav') || normalized.includes('menu') ||
        normalized.includes('link') || normalized.includes('breadcrumb')) {
      return 'nav';
    }

    // List patterns
    if (normalized.includes('item') || normalized.includes('list') ||
        normalized.includes('row') || normalized.includes('entry')) {
      return 'list';
    }

    // Section patterns
    if (normalized.includes('section') || normalized.includes('hero') ||
        normalized.includes('feature')) {
      return 'section';
    }

    return 'unknown';
  }

  /**
   * Group elements by detected pattern
   */
  groupByPattern(elements: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const element of elements) {
      const pattern = this.classifyPattern(element);
      if (!groups[pattern]) {
        groups[pattern] = [];
      }
      groups[pattern].push(element);
    }

    return groups;
  }

  /**
   * Get CSS selector for element (handles data-component attributes)
   */
  private getElementSelector(element: Element): string {
    // Check for data-component attribute first
    const dataComponent = element.getAttribute('data-component');
    if (dataComponent) {
      return dataComponent;
    }

    if (element.id) {
      return element.id;
    }

    if (element.className) {
      const classes = element.className.toString().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        return classes[0];
      }
    }

    // For elements without class/id, use tag name
    return element.tagName.toLowerCase();
  }

  /**
   * Check if a selector represents a semantic section pattern (should be detected even as single occurrence)
   * This is different from component patterns like "card" which require multiple occurrences
   */
  private isSemanticPattern(selector: string): boolean {
    const normalized = selector.toLowerCase().replace(/[.#]/g, '').replace(/__/g, '-');

    // Only true semantic section-level patterns should be detected as single occurrence
    // Component patterns like "card", "item" etc. require multiple occurrences
    // Must be an exact match, not just includes
    const semanticSectionPatterns = [
      'hero', 'breadcrumb', 'header', 'footer', 'sidebar', 'aside', 'main',
      'section', 'banner', 'cta', 'modal', 'dialog'
    ];

    return semanticSectionPatterns.some(pattern => normalized === pattern);
  }

  /**
   * Normalize pattern name for matching (convert BEM __ to -)
   */
  private normalizePatternName(selector: string): string {
    // Remove leading # or .
    let normalized = selector.replace(/^[.#]/, '');

    // Convert BEM __ to -
    normalized = normalized.replace(/__/g, '-');

    return normalized;
  }

  /**
   * Calculate pattern confidence score
   */
  private calculatePatternConfidence(elements: Element[]): number {
    // Base confidence on occurrence count (more lenient for smaller counts)
    const countScore = Math.min(elements.length / 5, 1);

    // Adjust for structure similarity
    let similaritySum = 0;
    let comparisons = 0;

    for (let i = 0; i < elements.length - 1; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        similaritySum += this.calculateSimilarity(
          elements[i].outerHTML,
          elements[j].outerHTML
        );
        comparisons++;
      }
    }

    const similarityScore = comparisons > 0 ? similaritySum / comparisons : 1;

    // For identical patterns, give higher confidence
    if (similarityScore >= 0.95) {
      return Math.min(countScore * 0.3 + similarityScore * 0.7 + 0.2, 1);
    }

    // Weight similarity more heavily than count (70% similarity, 30% count)
    return countScore * 0.3 + similarityScore * 0.7;
  }
}
