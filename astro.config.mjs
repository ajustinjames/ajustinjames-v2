import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import lit from '@astrojs/lit';
import { apps } from './src/data/apps.ts';

const unlistedAppPaths = apps
  .filter((app) => !app.listed)
  .map((app) => `/apps/${app.slug}/`);

export default defineConfig({
  site: 'https://ajustinjames.com',
  output: 'static',
  integrations: [
    icon(),
    lit(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      filter: (page) => !unlistedAppPaths.some((path) => page.endsWith(path)),
      lastmod: new Date()
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  minify: true
})
