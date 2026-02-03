# Mockto

> Transform HTML mockups into production-ready React components with intelligent component splitting and multi-format CSS conversion.

[![Tests](https://img.shields.io/badge/tests-701%20passing-brightgreen)](https://github.com/dgtise25/mockto)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## What is Mockto?

**Mockto** is a browser-based web application that converts HTML files into organized, reusable React components. Just paste your HTML or upload a file, and Mockto will:

- ✨ Split your HTML into logical React components
- 🎨 Generate clean JSX or TSX with proper TypeScript interfaces
- 🎯 Convert CSS to Tailwind, CSS Modules, or Vanilla CSS
- 📦 Download everything as a ready-to-use ZIP file

## Quick Start

1. **Upload or Paste**: Drag & drop an HTML file or paste your HTML directly
2. **Configure**: Choose JSX/TSX format and your preferred CSS framework
3. **Convert**: Click "Convert to React" and see the generated code instantly
4. **Download**: Get your components as a ZIP file with all assets included

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

## For Developers

### Installation

```bash
# Clone repository
git clone https://github.com/dgtise25/mockto.git
cd mockto

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:13579` in your browser.

### Build for Production

```bash
npm run build
# Output: dist/ folder
```

### Available Scripts

```bash
npm run dev          # Start development server (port 13579)
npm run build        # Build for production
npm run preview      # Preview production build (port 24680)
npm run test         # Run tests (692 tests)
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
npm run lint         # Lint code
npm run format       # Format code with Prettier
npm run typecheck    # Check TypeScript types
```

### Environment Manager

Use the included `startenv.sh` script to manage all services:

```bash
./startenv.sh start          # Start dev server
./startenv.sh start-all      # Start dev + test UI
./startenv.sh stop           # Stop all services
./startenv.sh status         # Show service status
./startenv.sh logs dev       # Follow dev server logs
```

## Project Structure

```
mockto/
├── src/
│   ├── components/       # UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── input/       # File upload, HTML input
│   │   ├── output/      # Code preview, download controls
│   │   ├── settings/    # Settings panel
│   │   └── layout/      # Header, footer
│   ├── lib/             # Core business logic
│   │   ├── parser/      # HTML parsing
│   │   ├── converter/   # JSX/TSX generation
│   │   ├── css/         # CSS conversion
│   │   ├── assets/      # Asset handling
│   │   └── orchestrator/ # Pipeline coordination
│   └── types/           # TypeScript definitions
├── tests/               # 692 passing tests
└── public/              # Static assets
```

## Tech Stack

- **React 18.3+** & **TypeScript 5.4+**
- **Vite 5.2+** for fast builds
- **shadcn/ui** & **Tailwind CSS** for beautiful UI
- **Vitest** for comprehensive testing
- 100% client-side—no backend required

## How It Works

```
HTML Input → Parse → Split Components → Generate Code → Convert CSS → Extract Assets → ZIP Output
```

1. **Parse**: HTML is parsed into an AST
2. **Split**: Components are identified using semantic analysis and pattern detection
3. **Generate**: JSX/TSX code is generated with proper attributes and TypeScript types
4. **Convert**: CSS is converted to your chosen framework
5. **Extract**: Images and assets are bundled with proper import statements
6. **Package**: Everything is zipped and ready to use

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Setup

```bash
# Fork and clone
git clone https://github.com/dgtise25/mockto.git
cd mockto

# Install and test
npm install
npm run test
npm run typecheck

# Create your branch
git checkout -b feature/your-feature

# Make changes and test
npm run test && npm run lint

# Submit PR
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with:
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev)

---

**Made with ❤️ by the Mockto team**

**Status**: Production Ready • 692 Tests Passing
