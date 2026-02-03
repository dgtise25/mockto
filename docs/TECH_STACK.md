# Technology Stack Overview

## Core Technologies

### Frontend Framework
**React 18.3+**
- Component-based architecture
- Hooks for state management
- Virtual DOM for performance
- Large ecosystem and community

### Language
**TypeScript 5.2+**
- Static type checking
- Enhanced IDE support
- Reduced runtime errors
- Better code documentation

### Build Tool
**Vite 5.2+**
- Lightning-fast HMR
- Optimized production builds
- Native ES modules
- Plugin ecosystem

---

## UI Framework

### shadcn/ui
**Component Library** (Tailwind-based)

**Why shadcn/ui?**
- Copy-paste components (not npm package)
- Full customization control
- Built on Radix UI primitives
- Accessible by default
- Tailwind CSS integration

**Components Used**:
- Button, Input, Textarea, Select
- Tabs, Card, Label, Switch
- Separator, Toast, Alert, Progress

---

## Styling

### Tailwind CSS 3.4+
**Utility-First CSS Framework**

**Benefits**:
- Rapid development
- Consistent design system
- Purged unused styles
- Responsive utilities
- Dark mode support

### Supporting Tools
- **PostCSS** - CSS transformation
- **Autoprefixer** - Browser compatibility
- **clsx** - Conditional class names
- **tailwind-merge** - Merge Tailwind classes

---

## Testing

### Vitest 1.4+
**Fast Unit Test Runner**

**Benefits**:
- Native Vite integration
- Blazing fast execution
- Jest-compatible API
- Watch mode
- Coverage reporting

### React Testing Library 14.2+
**Component Testing**

**Benefits**:
- User-centric testing
- Accessible queries
- Integration with Vitest
- Best practices enforced

### Additional Testing Tools
- **@testing-library/jest-dom** - Custom matchers
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment

---

## Utilities

### JSZip 3.10+
**ZIP File Generation**

**Purpose**: Create downloadable ZIP archives of converted projects

### Prettier 3.2+
**Code Formatter**

**Purpose**: Format generated JSX/TSX code for readability

---

## Development Tools

### ESLint 8.57+
**Linting Tool**

**Configuration**:
- TypeScript rules
- React rules
- Accessibility rules (jsx-a11y)
- Import rules

### Prettier 3.2+
**Code Formatting**

**Configuration**:
- Tailwind plugin
- 2-space indentation
- Single quotes
- Trailing commas

---

## Browser APIs Used

### DOMParser
**HTML Parsing**

```typescript
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');
```

**Browser Support**: All modern browsers

### File API
**File Upload Handling**

```typescript
const file = event.target.files[0];
const reader = new FileReader();
reader.readAsText(file);
```

**Browser Support**: All modern browsers

### File System Access API
**Folder Save (Optional)**

```typescript
const directoryHandle = await window.showDirectoryPicker();
```

**Browser Support**: Chrome 86+, Edge 86+ (Progressive enhancement)

### Blob API
**ZIP Download**

```typescript
const blob = new Blob([zipContent], { type: 'application/zip' });
const url = URL.createObjectURL(blob);
```

**Browser Support**: All modern browsers

### localStorage
**Settings Persistence**

```typescript
localStorage.setItem('settings', JSON.stringify(settings));
const settings = JSON.parse(localStorage.getItem('settings'));
```

**Browser Support**: All modern browsers

---

## Build Configuration

### package.json Scripts
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

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [react()],
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

---

## Browser Support Matrix

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| Chrome Mobile | 90+ | Partial (no folder save) |
| Safari iOS | 14+ | Partial (no folder save) |

**Progressive Enhancement**:
- File System Access API: Graceful fallback to ZIP download
- Advanced CSS: Fallback to simpler conversions
- Web Workers: Fallback to main thread processing

---

## Security Considerations

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';">
```

### XSS Prevention
- Sanitize HTML input
- Use textContent instead of innerHTML where possible
- Validate file uploads
- CSP headers in production

### Data Privacy
- All processing client-side (no server)
- No data transmission to external services
- localStorage encryption (optional)

---

## Performance Optimization

### Code Splitting
```typescript
const ComponentPreview = lazy(() => import('./components/output/CodePreview'));
```

### Tree Shaking
- ES modules throughout
- Named exports
- Vite automatic tree shaking

### Asset Optimization
- Image compression in build
- CSS purging (Tailwind)
- Minification (Terser)
- Gzip compression

### Caching Strategy
```typescript
// Service Worker (optional)
workbox.routing.registerRoute(
  /\.(?:js|css|html)$/,
  new workbox.strategies.CacheFirst()
);
```

---

## Development Environment

### Recommended IDE
**Visual Studio Code**

**Extensions**:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- React Developer Tools

### Node.js Version
**Node 18+ (LTS recommended)**

```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher
```

---

## Deployment

### Hosting Platforms
**Recommended**: Vercel or Netlify

**Why?**
- Zero-config deployment
- Automatic HTTPS
- CDN distribution
- Git integration
- Preview deployments

### Build Optimization
```bash
npm run build
# Output: dist/ folder
# Size target: <500KB gzipped
```

### Environment Variables
```env
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

---

## Monitoring & Analytics

### Error Tracking (Optional)
**Sentry**

```typescript
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_APP_ENV
});
```

### Analytics (Optional)
**Plausible or Google Analytics**

```typescript
plausible('pageview');
plausible('conversion', { props: { type: 'html_converted' } });
```

---

## Alternative Considerations

### Why Not These Technologies?

**Next.js**
- Overkill for client-only app
- No need for SSR/SSG
- Vite is faster for development

**Create React App**
- Deprecated by React team
- Slower build times
- Less flexible configuration

**CSS-in-JS (styled-components, emotion)**
- Tailwind is faster
- Less runtime overhead
- Better performance

**Redux**
- Overkill for simple state
- React hooks sufficient
- Context API for global state

**Webpack**
- Slower than Vite
- More complex configuration
- Less modern DX

---

## Dependencies Size Analysis

### Core Dependencies (~200KB)
- react + react-dom: ~140KB
- lucide-react: ~30KB
- clsx + tailwind-merge: ~10KB
- class-variance-authority: ~5KB

### Utility Dependencies (~100KB)
- jszip: ~80KB
- prettier: ~20KB (loaded on-demand)

### UI Dependencies (~50KB)
- shadcn/ui components: ~30KB
- Radix UI primitives: ~20KB

**Total Bundle Size (estimated)**: ~350KB gzipped

---

## Future Technology Considerations

### Potential Additions

**Web Workers**
- Offload heavy parsing to background thread
- Improve UI responsiveness

**WebAssembly**
- Ultra-fast HTML parsing
- Complex CSS transformations

**IndexedDB**
- Store conversion history
- Cache large HTML files

**Service Workers**
- Offline support
- Background processing

**Progressive Web App (PWA)**
- Install to desktop
- Offline functionality
- Native-like experience

---

**Document Version**: 1.0
**Last Updated**: 2026-02-03
