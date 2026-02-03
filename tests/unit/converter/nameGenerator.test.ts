/**
 * Name Generator Unit Tests
 * Tests for generating logical component names
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NameGenerator, NameGenerationOptions } from '../../../src/lib/converter/nameGenerator';

describe('NameGenerator', () => {
  let generator: NameGenerator;

  beforeEach(() => {
    generator = new NameGenerator();
  });

  describe('Initialization', () => {
    it('should create generator with default options', () => {
      expect(generator).toBeInstanceOf(NameGenerator);
    });

    it('should create generator with custom naming convention', () => {
      const customGenerator = new NameGenerator({
        convention: 'kebab-case'
      });
      expect(customGenerator).toBeInstanceOf(NameGenerator);
    });
  });

  describe('Semantic Tag Naming', () => {
    it('should generate name from header tag', () => {
      const element = document.createElement('header');
      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toContain('header');
    });

    it('should generate name from nav tag', () => {
      const element = document.createElement('nav');
      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toContain('nav');
    });

    it('should generate name from main tag', () => {
      const element = document.createElement('main');
      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toContain('main');
    });

    it('should generate name from footer tag', () => {
      const element = document.createElement('footer');
      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toContain('footer');
    });

    it('should generate name from article tag', () => {
      const element = document.createElement('article');
      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toContain('article');
    });

    it('should generate name from section tag', () => {
      const element = document.createElement('section');
      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toContain('section');
    });

    it('should generate name from aside tag', () => {
      const element = document.createElement('aside');
      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toContain('aside');
      expect(name.toLowerCase()).toContain('sidebar');
    });
  });

  describe('CSS Class Naming', () => {
    it('should generate PascalCase from BEM classes', () => {
      const element = document.createElement('div');
      element.className = 'user-profile';

      const name = generator.generateName({ element });

      expect(name).toBe('UserProfile');
    });

    it('should handle multiple classes (prioritize first)', () => {
      const element = document.createElement('div');
      element.className = 'card featured large';

      const name = generator.generateName({ element });

      expect(name).toBe('Card');
    });

    it('should convert kebab-case to PascalCase', () => {
      const element = document.createElement('div');
      element.className = 'navigation-bar';

      const name = generator.generateName({ element });

      expect(name).toBe('NavigationBar');
    });

    it('should convert snake_case to PascalCase', () => {
      const element = document.createElement('div');
      element.className = 'search_form';

      const name = generator.generateName({ element });

      expect(name).toBe('SearchForm');
    });

    it('should handle BEM modifiers', () => {
      const element = document.createElement('button');
      element.className = 'btn btn--primary';

      const name = generator.generateName({ element });

      expect(name).toBe('Btn');
      expect(name).not.toContain('primary');
    });

    it('should handle BEM elements', () => {
      const element = document.createElement('div');
      element.className = 'menu__item';

      const name = generator.generateName({ element });

      expect(name).toBe('MenuItem');
    });

    it('should handle camelCase classes', () => {
      const element = document.createElement('div');
      element.className = 'userInfoPanel';

      const name = generator.generateName({ element });

      expect(name).toBe('UserInfoPanel');
    });
  });

  describe('Content-Based Naming', () => {
    it('should suggest name from heading content', () => {
      const html = '<div><h3>User Settings</h3><p>Configure your account</p></div>';
      const suggestion = generator.suggestNameFromContent(html);

      expect(suggestion.toLowerCase()).toContain('settings');
    });

    it('should suggest name from paragraph content', () => {
      const html = '<div><p>Contact information and support details</p></div>';
      const suggestion = generator.suggestNameFromContent(html);

      expect(suggestion.toLowerCase()).toMatch(/contact|support/);
    });

    it('should suggest name from button text', () => {
      const html = '<button>Submit Form</button>';
      const suggestion = generator.suggestNameFromContent(html);

      expect(suggestion.toLowerCase()).toContain('submit');
    });

    it('should suggest name from link text', () => {
      const html = '<a href="/about">About Us</a>';
      const suggestion = generator.suggestNameFromContent(html);

      expect(suggestion.toLowerCase()).toContain('about');
    });

    it('should extract key terms from content', () => {
      const html = '<div><h2>Product Features</h2><ul><li>Fast</li><li>Secure</li></ul></div>';
      const suggestion = generator.suggestNameFromContent(html);

      expect(suggestion.toLowerCase()).toContain('feature');
    });

    it('should prioritize headings over other content', () => {
      const html = '<div><h1>Main Title</h1><p>Less important description</p></div>';
      const suggestion = generator.suggestNameFromContent(html);

      expect(suggestion.toLowerCase()).not.toContain('description');
    });
  });

  describe('Unique Name Generation', () => {
    it('should generate unique name when name exists', () => {
      const existingNames = ['Card', 'Card2', 'Card3'];
      const uniqueName = generator.generateUniqueName('Card', existingNames);

      expect(uniqueName).toBe('Card4');
    });

    it('should return original name if not taken', () => {
      const existingNames = ['OtherComponent'];
      const uniqueName = generator.generateUniqueName('NewComponent', existingNames);

      expect(uniqueName).toBe('NewComponent');
    });

    it('should handle empty existing names list', () => {
      const uniqueName = generator.generateUniqueName('Component', []);

      expect(uniqueName).toBe('Component');
    });

    it('should increment number suffix correctly', () => {
      const existingNames = ['Button', 'Button2', 'Button3'];
      const uniqueName = generator.generateUniqueName('Button', existingNames);

      expect(uniqueName).toBe('Button4');
    });

    it('should handle non-sequential suffixes', () => {
      const existingNames = ['Panel', 'Panel5', 'Panel10'];
      const uniqueName = generator.generateUniqueName('Panel', existingNames);

      expect(uniqueName).toBe('Panel11');
    });
  });

  describe('Naming Conventions', () => {
    it('should generate PascalCase names by default', () => {
      const element = document.createElement('div');
      element.className = 'search-box';

      const name = generator.generateName({ element });

      expect(name).toBe('SearchBox');
      expect(name[0]).toMatch(/[A-Z]/);
    });

    it('should generate kebab-case names when specified', () => {
      const kebabGenerator = new NameGenerator({ convention: 'kebab-case' });
      const element = document.createElement('div');
      element.className = 'searchBox';

      const name = kebabGenerator.generateName({ element });

      expect(name).toBe('search-box');
    });

    it('should generate camelCase names when specified', () => {
      const camelGenerator = new NameGenerator({ convention: 'camelCase' });
      const element = document.createElement('div');
      element.className = 'SearchBox';

      const name = camelGenerator.generateName({ element });

      expect(name).toBe('searchBox');
    });

    it('should generate UPPER_CASE names when specified', () => {
      const upperGenerator = new NameGenerator({ convention: 'UPPER_CASE' });
      const element = document.createElement('div');
      element.className = 'constant-value';

      const name = upperGenerator.generateName({ element });

      expect(name).toBe('CONSTANT_VALUE');
    });
  });

  describe('Role-Based Naming', () => {
    it('should identify button role', () => {
      const element = document.createElement('button');
      element.className = 'clickable';

      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toContain('button');
    });

    it('should identify link role', () => {
      const element = document.createElement('a');
      element.className = 'nav-item';
      element.href = '/page';

      const name = generator.generateName({ element });

      expect(name.toLowerCase()).toMatch(/link|nav/);
    });

    it('should identify input role', () => {
      const element = document.createElement('input');
      element.type = 'text';
      element.className = 'field';

      const name = generator.generateName({ element, type: 'input' });

      expect(name.toLowerCase()).toMatch(/input|field|text/);
    });

    it('should identify image role', () => {
      const element = document.createElement('img');
      element.className = 'visual';
      element.src = 'image.jpg';

      const name = generator.generateName({ element, type: 'image' });

      expect(name.toLowerCase()).toMatch(/image|img/);
    });
  });

  describe('Descriptive Naming Enhancement', () => {
    it('should enhance generic div names with context', () => {
      const element = document.createElement('div');
      element.className = 'container';

      const name = generator.generateName({
        element,
        context: { hasChildren: true, childTypes: ['card', 'card'] }
      });

      expect(name).not.toBe('Container');
      expect(name.length).toBeGreaterThan('Container'.length);
    });

    it('should add descriptive suffix for list containers', () => {
      const element = document.createElement('ul');
      element.className = 'list';

      const name = generator.generateName({
        element,
        context: { hasChildren: true, childCount: 5 }
      });

      expect(name.toLowerCase()).toMatch(/list|container/);
    });
  });

  describe('Reserved Name Handling', () => {
    it('should avoid React reserved words', () => {
      const element = document.createElement('div');
      element.className = 'render';

      const name = generator.generateName({ element });

      expect(name.toLowerCase()).not.toBe('render');
      expect(name.endsWith('Component') || name.endsWith('Wrapper')).toBe(true);
    });

    it('should avoid HTML tag names', () => {
      const element = document.createElement('div');
      element.className = 'button';

      // Should clarify it's a component, not the HTML element
      const name = generator.generateName({ element, type: 'div' });

      expect(name).toBe('Button');
    });

    it('should avoid common JavaScript keywords', () => {
      const element = document.createElement('div');
      element.className = 'constructor';

      const name = generator.generateName({ element });

      expect(name.toLowerCase()).not.toBe('constructor');
    });
  });

  describe('Edge Cases', () => {
    it('should handle element with no class or semantic meaning', () => {
      const element = document.createElement('div');

      const name = generator.generateName({ element });

      expect(name).toBeTruthy();
      expect(name.length).toBeGreaterThan(0);
    });

    it('should handle element with only numbers in class', () => {
      const element = document.createElement('div');
      element.className = '123';

      const name = generator.generateName({ element });

      expect(name).toBeTruthy();
      expect(name).toMatch(/^[A-Z]/);
    });

    it('should handle very long class names', () => {
      const element = document.createElement('div');
      element.className = 'a'.repeat(100);

      const name = generator.generateName({ element });

      expect(name.length).toBeLessThan(50);
    });

    it('should handle special characters in class names', () => {
      const element = document.createElement('div');
      element.className = 'my-class@#$';

      const name = generator.generateName({ element });

      expect(name).not.toContain('@');
      expect(name).not.toContain('#');
      expect(name).not.toContain('$');
    });

    it('should handle empty string class', () => {
      const element = document.createElement('div');
      element.className = '';

      const name = generator.generateName({ element });

      expect(name).toBeTruthy();
    });

    it('should handle hyphen-only classes', () => {
      const element = document.createElement('div');
      element.className = '---';

      const name = generator.generateName({ element });

      expect(name).toBeTruthy();
      expect(name).not.toBe('---');
    });
  });

  describe('Data Attribute Naming', () => {
    it('should use data-component attribute if present', () => {
      const element = document.createElement('div');
      element.setAttribute('data-component', 'UserProfile');

      const name = generator.generateName({ element });

      expect(name).toBe('UserProfile');
    });

    it('should use data-name attribute if present', () => {
      const element = document.createElement('div');
      element.setAttribute('data-name', 'sidebar-menu');

      const name = generator.generateName({ element });

      expect(name).toBe('SidebarMenu');
    });

    it('should prioritize data attributes over class names', () => {
      const element = document.createElement('div');
      element.className = 'generic-class';
      element.setAttribute('data-component', 'SpecificName');

      const name = generator.generateName({ element });

      expect(name).toBe('SpecificName');
    });
  });

  describe('Context-Aware Naming', () => {
    it('should consider parent component name', () => {
      const element = document.createElement('div');
      element.className = 'header';

      const name = generator.generateName({
        element,
        parentName: 'Card'
      });

      expect(name).toBe('CardHeader');
    });

    it('should consider sibling components', () => {
      const element = document.createElement('div');
      element.className = 'body';

      const name = generator.generateName({
        element,
        siblings: ['CardHeader']
      });

      expect(name).toBe('CardBody');
    });

    it('should maintain naming consistency with siblings', () => {
      const headerElement = document.createElement('div');
      headerElement.className = 'header';

      const footerElement = document.createElement('div');
      footerElement.className = 'footer';

      const headerName = generator.generateName({
        element: headerElement,
        parentName: 'Card'
      });

      const footerName = generator.generateName({
        element: footerElement,
        parentName: 'Card'
      });

      expect(headerName).toBe('CardHeader');
      expect(footerName).toBe('CardFooter');
    });
  });

  describe('Name Validation', () => {
    it('should validate generated name is a valid identifier', () => {
      const element = document.createElement('div');
      element.className = 'test-123';

      const name = generator.generateName({ element });

      // Should be valid JavaScript identifier
      expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
    });

    it('should not start with number', () => {
      const element = document.createElement('div');
      element.className = '123test';

      const name = generator.generateName({ element });

      expect(name[0]).not.toMatch(/[0-9]/);
    });

    it('should not contain only numbers', () => {
      const element = document.createElement('div');
      element.className = '999';

      const name = generator.generateName({ element });

      expect(name).not.toMatch(/^[0-9]+$/);
    });
  });
});
