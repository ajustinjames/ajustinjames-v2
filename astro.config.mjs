import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import lit from '@astrojs/lit';

export default defineConfig({
  site: 'https://ajustinjames.com',
  output: 'static',
  integrations: [
    tailwind(),
    icon(),
    lit(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date()
    })
  ],
  minify: true
})