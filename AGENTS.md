# AGENTS.md

This file provides guidance to coding agents working in this repository.

## About

Personal website for ajustinjames.com built with Astro 5, Tailwind CSS, and TypeScript. Statically generated with a blog (Markdown) and portfolio sections.

New blog posts follow the template at `src/pages/posts/_template.md`.

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
