import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';
import { createHash } from 'crypto';

/**
 * Vite plugin to inject production-ready CSP meta tag
 * Only active during production builds
 */
function cspPlugin(): Plugin {
  return {
    name: 'csp-inject',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Only apply strict CSP in production
        if (process.env.NODE_ENV !== 'production') {
          return html;
        }

        // Generate SHA-256 hash for inline scripts (Vite's module loader)
        const inlineScriptHash = createHash('sha256')
          .update('import.meta.hot;') // Vite's HMR runtime marker
          .digest('base64');

        // Production CSP - strict without unsafe-inline
        // Uses SHA-256 hashes for known inline scripts
        const productionCsp = [
          "default-src 'self';",
          `script-src 'self' 'sha256-${inlineScriptHash}';`,
          "style-src 'self';", // No unsafe-inline in production
          "img-src 'self' data: https:;",
          "font-src 'self' data:;",
          "connect-src 'self';",
          "object-src 'none';",
          "base-uri 'self';",
          "form-action 'self';",
          "frame-ancestors 'none';",
          "block-all-mixed-content;",
        ].join(' ');

        // Replace existing CSP meta tag with production one
        return html.replace(
          /<meta http-equiv="Content-Security-Policy"[^>]*>/,
          `<meta http-equiv="Content-Security-Policy" content="${productionCsp}">`
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), cspPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 13579,
    strictPort: true,
    host: true
  },
  preview: {
    port: 24680,
    strictPort: true,
    host: true
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
