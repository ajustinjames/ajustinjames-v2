import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import lit from '@astrojs/lit';

export default defineConfig({
  site: 'https://ajustinjames.com',
  output: 'static',
  integrations: [
    icon(),
    lit(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date()
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  minify: true
})
