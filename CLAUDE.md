# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Personal website for ajustinjames.com built with Astro 5, Tailwind CSS, and TypeScript. Statically generated with a blog (Markdown) and portfolio sections.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Build to dist/
npm run preview   # Preview production build
npm run check     # Astro type check
npm run lint      # ESLint
npm test          # Run Vitest tests
```

Run a single test file:
```bash
npx vitest run test/example.spec.ts
```

## Architecture

- **`src/pages/`** — File-based routing. Blog posts live under `src/pages/posts/YYYY/`.
- **`src/components/`** — Organized by feature: `blog/`, `contact/`, `portfolio/`.
- **`src/layouts/`** — `Layout.astro` (main shell), `MarkdownPostLayout.astro` (blog posts), `Header.astro`, `Footer.astro`.
- **`src/data/`** — Shared data files: `social-links.ts` (single source of truth for social URLs), `projects.ts` (projects page data).
- **`src/styles/global.css`** — Global styles imported in the main layout.
- **`public/`** — Static assets served as-is. Blog images go in `public/images/`.
- **`test/`** — Vitest unit tests.
- **`astro.config.mjs`** — Integrations: `@astrojs/tailwind`, `astro-icon`, `@astrojs/sitemap`, `@astrojs/rss`. Site URL: `https://ajustinjames.com`.

Blog posts use Markdown frontmatter; `MarkdownPostLayout.astro` handles rendering. New posts follow the template at `src/pages/posts/_template.md`.

## Key Conventions

- **No `@apply` directive** in Tailwind — use utility classes directly in component markup. The one exception is body base styles in `src/styles/global.css`, where `@apply` is necessary since the `<body>` tag lives in a layout file.
- **Design tokens**: Use the Tailwind color tokens defined in `tailwind.config.mjs` (e.g. `text-primary`, `bg-cardLightBg`, `border-borderLight`). Always use explicit `dark:` variant pairs (e.g. `text-lightTextPrimary dark:text-darkTextPrimary`) — do not use CSS custom properties.
- **Social links**: Edit `src/data/social-links.ts` to add or change social profiles. Do not hardcode URLs in components.
- Prefer `.astro` components; use React components only when client-side interactivity is required.
- Use `client:*` directives sparingly — favor static generation. Prefer `client:visible` for below-the-fold interactive components.
- Icons use `astro-icon` with Iconify JSON icon sets (devicon, fa6-brands, fa6-solid, line-md).
- TypeScript strict mode (`astro/tsconfigs/strict`). All components must define a `Props` interface.

## AI Content Policy

- AI may freely generate and modify code, components, configuration, and tooling.
- **Blog post prose must be human-written.** AI may assist with outlining, proofreading, and fixing typos — but must not draft the body text of posts.
- AI-generated commit messages and PR descriptions are fine.
