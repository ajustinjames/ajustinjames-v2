# ajustinjames-v2

[![Website](https://img.shields.io/badge/website-ajustinjames.com-blue?style=flat-square&logo=internet-explorer)](https://ajustinjames.com)

A modern, performant personal website built with Astro and Tailwind CSS. This website combines static site generation with minimal JavaScript for optimal performance and SEO.

## 🚀 Tech Stack

- [Astro](https://astro.build) - Static Site Generator
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vitest](https://vitest.dev) - Testing framework

## 📁 Project Structure

```text
/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── blog/         # Blog-specific components
│   │   ├── contact/      # Contact form components
│   │   └── portfolio/    # Portfolio components
│   ├── layouts/          # Page layouts and templates
│   ├── pages/           # File-based routing
│   │   └── posts/       # Blog post pages
│   └── styles/          # Global styles
├── public/              # Static assets
└── test/               # Test files
```

## 🛠️ Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 📦 Key Features

- Static Site Generation with Astro
- Blog support with Markdown/MDX
- Portfolio section
- Contact form
- SEO optimization with @astrojs/sitemap
- Responsive design with Tailwind CSS
- Icon support via astro-icon
- Unit testing with Vitest

## 🚀 Deployment

The site is built into the `dist/` directory and can be deployed to any static hosting platform like Netlify, Vercel, or GitHub Pages.

## 📝 License

This project is MIT licensed.
