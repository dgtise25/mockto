# Quick Start Guide

## Overview

This guide will help you get started with building the HTML Mockup to React Converter application in the fastest way possible.

---

## Prerequisites

**Required**:
- Node.js 18+ installed
- npm or pnpm package manager
- Git for version control
- Code editor (VS Code recommended)

**Check your environment**:
```bash
node --version  # Should be v18.0.0+
npm --version   # Should be v9.0.0+
git --version   # Any recent version
```

---

## Quick Setup (5 Minutes)

### Step 1: Initialize Project

```bash
# Create project with Vite
npm create vite@latest mockupconverter -- --template react-ts

# Navigate to project
cd mockupconverter

# Install dependencies
npm install
```

### Step 2: Install shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Follow prompts:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
```

### Step 3: Install Core Dependencies

```bash
# Utility libraries
npm install clsx tailwind-merge class-variance-authority lucide-react

# ZIP generation
npm install jszip

# Code formatting
npm install prettier

# TypeScript types
npm install -D @types/node
```

### Step 4: Install Testing Dependencies

```bash
# Vitest and React Testing Library
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Step 5: Add shadcn/ui Components

```bash
# Install all needed components
npx shadcn-ui@latest add button input textarea select tabs card label switch separator toast alert progress
```

---

## Project Structure Setup (5 Minutes)

### Create Folder Structure

```bash
# Create all directories at once
mkdir -p src/{components/{ui,input,output,settings,layout},lib/{parser,converter,css,assets,output,storage},types,hooks,utils}
mkdir -p tests/{unit/{parser,converter,css,assets},integration,fixtures/{html-samples,expected-outputs}}
mkdir -p docs
```

### Verify Structure
```bash
tree src -L 2
# Should show the folder structure as designed
```

---

## Configuration Files (10 Minutes)

### 1. TypeScript Configuration

Create or update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2. Vitest Configuration

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/types/**',
        '**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 3. Vite Configuration

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['jszip', 'prettier']
        }
      }
    }
  }
});
```

### 4. ESLint Configuration

Create `.eslintrc.cjs`:
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

### 5. Prettier Configuration

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 6. Test Setup File

Create `tests/setup.ts`:
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

---

## Update package.json Scripts (2 Minutes)

Add/update scripts in `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Create Initial Files (5 Minutes)

### 1. Update Tailwind Config

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
};
```

### 2. Create Global Styles

Update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 3. Create Basic App Component

Update `src/App.tsx`:
```typescript
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function App() {
  const [htmlInput, setHtmlInput] = useState('');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">HTML to React Converter</h1>
          <p className="text-muted-foreground">
            Convert HTML mockups to React components instantly
          </p>
        </header>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="html-input" className="text-sm font-medium">
                Paste HTML Code
              </label>
              <textarea
                id="html-input"
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                className="w-full h-64 p-4 mt-2 border rounded-md font-mono text-sm"
                placeholder="<div>Your HTML here...</div>"
              />
            </div>

            <Button onClick={() => console.log('Convert:', htmlInput)}>
              Convert to React
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
```

---

## Verify Installation (2 Minutes)

### Run Development Server
```bash
npm run dev
```

Open browser to `http://localhost:13579` - you should see the basic app interface.

### Run Tests
```bash
npm run test
```

Should pass with no tests (yet).

### Run Linter
```bash
npm run lint
```

Should pass with no errors.

### Check Types
```bash
npm run typecheck
```

Should pass with no errors.

---

## Initialize Git (2 Minutes)

```bash
# Initialize repository
git init

# Create .gitignore
cat > .gitignore << EOF
# Dependencies
node_modules

# Build output
dist
*.local

# Testing
coverage

# Environment
.env
.env.local

# IDE
.vscode/*
!.vscode/extensions.json
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
EOF

# Initial commit
git add .
git commit -m "Initial project setup with Vite, React, TypeScript, shadcn/ui"
```

---

## Next Steps

You're now ready to start development!

### Follow Implementation Milestones

Refer to `/docs/IMPLEMENTATION_PLAN.md` for detailed milestones:

1. **Milestone 2**: Build HTML Parser
   - Start with `src/lib/parser/htmlParser.ts`
   - Create type definitions in `src/types/parser.types.ts`
   - Write tests in `tests/unit/parser/`

2. **Milestone 3**: Build Component Splitter
   - Implement `src/lib/converter/componentSplitter.ts`
   - Create tests with various HTML patterns

3. **Milestone 4**: Build JSX Generator
   - Implement `src/lib/converter/jsxGenerator.ts`
   - Handle all HTML to JSX transformations

Continue through all milestones as documented.

---

## Development Workflow

### Daily Workflow
```bash
# Start development server
npm run dev

# In another terminal, run tests in watch mode
npm run test

# Before committing
npm run lint
npm run typecheck
npm run test -- --run
```

### Create Feature Branch
```bash
git checkout -b feature/html-parser
# Work on feature
git add .
git commit -m "feat: implement HTML parser module"
git push origin feature/html-parser
```

---

## Helpful Commands

### Install New Dependency
```bash
npm install [package-name]
npm install -D [dev-package-name]  # Dev dependency
```

### Update Dependencies
```bash
npm update
npm outdated  # Check for outdated packages
```

### Clean Install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build for Production
```bash
npm run build
npm run preview  # Preview production build
```

---

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@/...'`
**Solution**: Make sure path aliases are configured in `tsconfig.json` and `vite.config.ts`

**Issue**: shadcn/ui components not found
**Solution**: Re-run `npx shadcn-ui@latest init` and add components again

**Issue**: Tailwind classes not working
**Solution**: Check `tailwind.config.js` content paths include your files

**Issue**: Tests failing with DOM errors
**Solution**: Verify `tests/setup.ts` exists and is referenced in `vitest.config.ts`

**Issue**: TypeScript errors in tests
**Solution**: Add `/// <reference types="vitest/globals" />` to test files

---

## VS Code Extensions (Recommended)

Install these extensions for the best development experience:

1. **ESLint** - Microsoft
2. **Prettier** - Prettier
3. **Tailwind CSS IntelliSense** - Tailwind Labs
4. **TypeScript and JavaScript Language Features** - Built-in
5. **ES7+ React/Redux/React-Native snippets** - dsznajder
6. **Jest** - Orta (works with Vitest)
7. **GitLens** - GitKraken

Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "eamodio.gitlens"
  ]
}
```

---

## Documentation References

- [Implementation Plan](/docs/IMPLEMENTATION_PLAN.md)
- [Tech Stack Details](/docs/TECH_STACK.md)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Vitest Documentation](https://vitest.dev)

---

**Setup Complete! Time to start building.**

**Total Setup Time**: ~30 minutes

**Next**: Read `/docs/IMPLEMENTATION_PLAN.md` and start with Milestone 2 (HTML Parser)

---

**Document Version**: 1.0
**Last Updated**: 2026-02-03
