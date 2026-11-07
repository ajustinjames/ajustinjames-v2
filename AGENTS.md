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

## Apps

Small single-page tools live at `/apps/<slug>/`. They're quick builds: an idea goes to a working page in one sitting, with no proposal or design docs.

- Scaffold: `npm run new-app -- <slug> "<Name>" "<One-sentence description>"`. This creates `src/apps/<slug>/` (`app.json`, `main.ts`, `style.css`) and `src/pages/apps/<slug>.astro`. Apps are found automatically: each `src/apps/<slug>/app.json` (name, description, added date, `listed`) is one app, so there's no list to update by hand.
- Markup goes in the `.astro` page, behavior in `main.ts`, and styles in the app's `style.css`. Put pure logic in `src/apps/<slug>/core/*.ts` with a `*.test.ts` beside it. Vitest picks those up.
- The site conventions above (Tailwind utilities, `dark:` pairs, no custom properties) don't apply inside an app. `AppLayout` loads no Tailwind preflight, so apps use plain CSS with the hardline tokens (`--hl-alias-*`) and plain TypeScript. Use the hardline Web Components (`<hl-btn>`, `<hl-select>`, …) for controls.
- Support dark mode by building colors on `--hl-alias-*` tokens. If an app can't support it yet, set `"lightOnly": true` in its `app.json`.
- Astro's HTML compression drops the whitespace at line breaks between inline elements. Where text has to flow across tags (a sentence with inputs, a list of inline links), add `{" "}`.
- No server code, accounts, or third-party APIs without asking first. Keep data in the page or the browser.
- Before you finish, run `npm run check`, `npm run lint`, `npm test`, and `npm run build`. Then check the page at phone width in light and dark mode.
- An app stays `"listed": false` (noindex, not in the sitemap or on `/apps`) until the owner says to publish it.

## AI Content Policy

- AI may freely generate and modify code, components, configuration, and tooling.
- **Blog post prose must be human-written.** AI may assist with outlining, proofreading, and fixing typos — but must not draft the body text of posts.
- AI-generated commit messages and PR descriptions are fine.
