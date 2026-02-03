# Mockto

> Transform HTML mockups into production-ready React components with intelligent component splitting and multi-format CSS conversion.

## Overview

**Mockto** is a browser-based web application that converts HTML files into organized, reusable React components. Built with React, TypeScript, and Vite, following SPARC methodology for systematic development.

## Features

### 🎨 Smart Component Generation
- **Intelligent Naming**: AI-powered component name generation from HTML structure
- **Semantic Splitting**: Auto-detects sections (header, nav, main, footer) and repeating patterns
- **Flexible Output**: Generate JSX or TSX with proper TypeScript interfaces

### 🎯 Multi-Format CSS Support
- **Tailwind CSS**: One-click utility class conversion
- **CSS Modules**: Scoped, modular CSS generation
- **Vanilla CSS**: Clean, traditional CSS extraction

### ⚡ Developer Experience
- **Multiple Input Methods**: Drag-and-drop file upload or paste HTML directly
- **Live Preview**: See generated code with syntax highlighting
- **Settings Persistence**: Remember your preferences across sessions
- **Asset Extraction**: Automatically extract and bundle image assets

## Features

### Core Functionality
- **Multi-Format Input**: File upload (drag-and-drop) + textarea for pasting HTML
- **Intelligent Component Splitting**: Auto-detect semantic sections (header, nav, main, footer) and repeating patterns
- **Flexible Output Formats**: Generate JSX or TSX components
- **Multi-CSS Support**: Convert to Tailwind CSS, CSS Modules, or Vanilla CSS
- **Asset Extraction**: Extract and bundle image assets with imports
- **Multiple Output Options**: Download as ZIP or save directly to folder
- **Settings Persistence**: Remember user preferences across sessions

### Technical Highlights
- Built with React 18+ and TypeScript (strict mode)
- shadcn/ui component library (Tailwind-based)
- Comprehensive test coverage with Vitest
- Modular architecture following SOLID principles
- Browser-native HTML parsing (DOMParser API)
- Zero backend dependencies (100% client-side)

## Documentation

### Planning Documents
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Comprehensive development roadmap with SPARC-enhanced milestones
- **[MVP Roadmap](docs/MVP_ROADMAP.md)** - Minimum viable product definition and 3-4 week timeline
- **[Tech Stack](docs/TECH_STACK.md)** - Technology choices and justifications
- **[Quick Start](docs/QUICK_START.md)** - Get started in 30 minutes

### Key Sections
1. [Project Architecture](docs/IMPLEMENTATION_PLAN.md#3-project-architecture) - Folder structure and design patterns
2. [Core Modules](docs/IMPLEMENTATION_PLAN.md#4-core-modules) - Detailed module breakdown
3. [Implementation Milestones](docs/IMPLEMENTATION_PLAN.md#5-implementation-milestones) - 10 clear milestones with success criteria
4. [Testing Strategy](docs/IMPLEMENTATION_PLAN.md#7-testing-strategy) - Comprehensive testing approach
5. [Data Flow](docs/IMPLEMENTATION_PLAN.md#8-data-flow) - How data flows through the application

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern browser (Chrome, Firefox, Safari, Edge)

### Setup (5 minutes)
```bash
# Clone repository
git clone <repository-url>
cd mockto

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:13579` in your browser.

**For detailed setup instructions, see [Quick Start Guide](docs/QUICK_START.md)**

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
npm run lint         # Lint code
npm run format       # Format code with Prettier
npm run typecheck    # Check TypeScript types
```

### Project Structure
```
mockto/
├── src/
│   ├── components/       # UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── input/       # Input handling
│   │   ├── output/      # Output handling
│   │   ├── settings/    # Settings management
│   │   └── layout/      # Layout components
│   ├── lib/             # Core business logic
│   │   ├── parser/      # HTML parsing
│   │   ├── converter/   # JSX/TSX generation
│   │   ├── css/         # CSS conversion
│   │   ├── assets/      # Asset handling
│   │   ├── output/      # Output generation
│   │   └── storage/     # LocalStorage management
│   ├── types/           # TypeScript definitions
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Utility functions
├── tests/               # Test files
├── docs/                # Documentation
└── public/              # Static assets
```

## Implementation Milestones

### Milestone 1: Project Setup (Week 1)
- ✅ Initialize Vite + React + TypeScript
- ✅ Configure shadcn/ui and Tailwind CSS
- ✅ Set up Vitest testing
- ✅ Create project structure

### Milestone 2: HTML Parser (Week 1-2)
- Parse HTML into AST
- Extract attributes and styles
- Identify semantic sections
- Comprehensive test coverage

### Milestone 3: Component Splitter (Week 2)
- Detect semantic sections
- Identify repeating patterns
- Generate component names
- Build component tree

### Milestone 4: JSX/TSX Generator (Week 3)
- Convert HTML to JSX/TSX
- Transform attributes (class → className)
- Generate TypeScript interfaces
- Format code beautifully

### Milestone 5: CSS Converter (Week 3-4)
- Tailwind CSS conversion
- CSS Modules generation
- Vanilla CSS extraction
- Strategy pattern implementation

### Milestone 6: Asset Extractor (Week 4)
- Extract image references
- Optional image optimization
- Generate import statements
- Create asset manifest

### Milestone 7: UI Components (Week 4-5)
- File upload with drag-drop
- HTML textarea with syntax highlighting
- Settings panel
- Code preview
- Output controls

### Milestone 8: Integration (Week 5-6)
- End-to-end conversion pipeline
- ZIP generation
- Folder save (File System API)
- Performance optimization

### Milestone 9: Testing & QA (Week 6)
- >85% test coverage
- E2E scenarios
- Cross-browser testing
- Accessibility audit

### Milestone 10: Documentation & Deployment (Week 7)
- Complete documentation
- Deploy to production
- Demo examples
- Performance optimization

**Total Timeline**: 6-8 weeks
**MVP Timeline**: 3-4 weeks (see [MVP Roadmap](docs/MVP_ROADMAP.md))

## Tech Stack

### Core
- **React 18.3+** - UI framework
- **TypeScript 5.2+** - Type safety
- **Vite 5.2+** - Build tool

### UI
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **@testing-library/jest-dom** - DOM matchers

### Utilities
- **JSZip** - ZIP generation
- **Prettier** - Code formatting

**For detailed tech stack information, see [Tech Stack Guide](docs/TECH_STACK.md)**

## Architecture

### Design Patterns
- **Strategy Pattern**: CSS converters (Tailwind/Modules/Vanilla)
- **Factory Pattern**: Component creation
- **Builder Pattern**: JSX structure building
- **Observer Pattern**: React hooks for state
- **Adapter Pattern**: HTML to React transformation

### SOLID Principles
- **Single Responsibility**: Each module has one clear purpose
- **Open/Closed**: Extensible converter interfaces
- **Liskov Substitution**: Interchangeable converters
- **Interface Segregation**: Focused module interfaces
- **Dependency Inversion**: Abstractions over implementations

### Data Flow
```
HTML Input → Parser (AST) → Component Splitter → JSX Generator
                                ↓
                         CSS Converter
                                ↓
                        Asset Extractor
                                ↓
                         File Generator
                                ↓
                      ZIP / Folder Output
```

## Success Criteria

### Functional
- ✅ Parse 95%+ of valid HTML5 elements
- ✅ Generate valid, compilable React components
- ✅ Convert CSS with 90%+ accuracy (Tailwind)
- ✅ Create logical, reusable components
- ✅ Extract all image assets

### Quality
- **Test Coverage**: >85% overall, >90% core modules
- **Performance**: Convert <100KB HTML in <2 seconds
- **Bundle Size**: <500KB production build
- **TypeScript**: Strict mode, zero `any` types
- **Accessibility**: WCAG 2.1 AA compliance

### User Experience
- Time to first conversion: <2 minutes
- Clear, actionable error messages
- Works on Chrome, Firefox, Safari, Edge
- Mobile-friendly (tablet+)

## Contributing

We welcome contributions! To get started:

1. Read the [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
2. Check out the [Quick Start Guide](docs/QUICK_START.md)
3. Pick a milestone to work on
4. Follow the development workflow
5. Write tests for new features
6. Submit a pull request

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/milestone-X

# Make changes and test
npm run test
npm run lint
npm run typecheck

# Commit and push
git add .
git commit -m "feat: implement feature X"
git push origin feature/milestone-X

# Create pull request
```

## Testing

### Test Coverage Goals
- 70% Unit Tests (individual functions)
- 20% Integration Tests (module interactions)
- 10% E2E Tests (complete user flows)

### Run Tests
```bash
npm run test                # Run all tests
npm run test:ui             # Interactive test UI
npm run test:coverage       # Coverage report
npm run test -- --watch     # Watch mode
```

### Test Structure
```
tests/
├── unit/
│   ├── parser/           # Parser tests
│   ├── converter/        # Converter tests
│   ├── css/             # CSS converter tests
│   └── assets/          # Asset extractor tests
├── integration/
│   ├── conversion-flow.test.ts
│   └── output-generation.test.ts
└── fixtures/
    ├── html-samples/    # Test HTML files
    └── expected-outputs/ # Expected results
```

## Deployment

### Build for Production
```bash
npm run build
# Output: dist/ folder (~350KB gzipped)
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel deploy
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |

**Progressive Enhancement**:
- File System Access API with fallback to ZIP
- Advanced features degrade gracefully

## Performance

### Targets
- Parse 100KB HTML: <500ms
- Full conversion: <2 seconds
- Production bundle: <500KB
- Lighthouse score: >90

### Optimization Techniques
- Code splitting with lazy loading
- Tree shaking (ES modules)
- Asset optimization
- CSS purging (Tailwind)

## License

MIT License - see LICENSE file for details

## Roadmap

### MVP (3-4 weeks)
- File upload
- Basic HTML parsing
- Semantic section splitting
- JSX generation
- Vanilla CSS extraction
- ZIP download

### Phase 2 (Post-MVP)
- TSX output format
- Tailwind CSS conversion
- CSS Modules support
- Advanced component splitting
- Textarea input
- Asset extraction
- Settings persistence
- Code preview

### Phase 3 (Future)
- Vue and Angular output
- Svelte components
- Web Components
- Advanced CSS frameworks
- Component playground
- Browser extension
- CLI tool

## Support

- **Documentation**: See [docs/](docs/) folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## Acknowledgments

Built with:
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev)

Methodology:
- SPARC (Specification, Pseudocode, Architecture, Refinement, Completion)
- GOAP (Goal-Oriented Action Planning)

---

**Ready to build?** Start with the [Quick Start Guide](docs/QUICK_START.md) or dive into the [Implementation Plan](docs/IMPLEMENTATION_PLAN.md).

**Status**: Planning Complete, Ready for Development

**Last Updated**: 2026-02-03
