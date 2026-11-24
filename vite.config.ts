import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Deployment base path.
 * - GitHub Pages project site: "/<repository-name>/" (set automatically by the workflow)
 * - User/organisation site or custom domain: "/"
 * Override locally with:  BASE_PATH=/my-repo/ npm run build
 */
const base = normaliseBase(process.env.BASE_PATH ?? '/');

/**
 * Absolute public URL of the deployed site, used for canonical and social-sharing tags.
 * Example: SITE_URL=https://arinanand.github.io/portfolio/
 * When it is not set, canonical tags are removed and share images use relative paths.
 */
const rawSiteUrl = (process.env.SITE_URL ?? '').trim();
const siteUrl = rawSiteUrl ? rawSiteUrl.replace(/\/?$/, '/') : '';

function normaliseBase(value: string): string {
  let v = value.trim() || '/';
  if (!v.startsWith('/') && !/^https?:\/\//.test(v)) v = `/${v}`;
  if (!v.endsWith('/')) v = `${v}/`;
  return v;
}

function siteMeta(): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      let out = html;
      if (!siteUrl) {
        out = out.replace(/<!--canonical-->[\s\S]*?<!--\/canonical-->\s*/g, '');
        out = out.replace(/__SITE_URL__/g, base);
      } else {
        out = out.replace(/<!--canonical-->|<!--\/canonical-->/g, '');
        out = out.replace(/__SITE_URL__/g, siteUrl);
      }
      return out;
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), siteMeta()],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
