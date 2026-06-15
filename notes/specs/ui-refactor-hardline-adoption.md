# Spec: UX Refactor + Hardline Design System Adoption

**Status:** Draft — ready for an implementing agent
**Target repo:** `ajustinjames/ajustinjames-v2` (Astro 5 + Tailwind 3 + TS)
**Author:** review pass, 2026-06-14

---

## 1. Goal

Two coupled objectives:

1. **Adopt the `hardline` design system** published from the sibling repo `ajustinjames/ajj-design` as the site's UI foundation — its tokens (`@ajustinjames/hardline-tokens`) and Web Components (`@ajustinjames/hardline-components`).
2. **Fix accumulated UX / architecture issues** in the site while doing the migration, so the rebrand and the cleanup land together instead of churning the same files twice.

Adopting hardline is a **visual rebrand**, not a drop-in. Hardline is an industrial-material language (0px radii, hard-cast offset shadows, International Orange `#FF4F00`, Paper `#F0F0EC` background, Inter + JetBrains Mono). The current site is a soft, rounded, drop-shadow, amber-`#FF8C00` design. The implementer must accept the new look as the target, not try to preserve the old one.

---

## 2. What hardline gives us

Source of truth: `/Users/ajames/workspace/ajustinjames/ajj-design` (README.md + AGENTS.md).

### Packages (published to npm, currently `v0.0.5`, lockstep versioned)

| Package | Import | Purpose |
|---|---|---|
| `@ajustinjames/hardline-tokens` | `@ajustinjames/hardline-tokens/css`, `/css-dark`, `/theme` | Style-Dictionary-compiled CSS custom properties |
| `@ajustinjames/hardline-components` | `@ajustinjames/hardline-components` | Lit Web Components (`<hl-*>`), side-effect registration |

### Components available (`hl-*`, all `LitElement`, slot-based visual shells)

`hl-btn`, `hl-card`, `hl-input`, `hl-label`, `hl-link`, `hl-alert`, `hl-badge`, `hl-tag`,
`hl-avatar`, `hl-breadcrumb`, `hl-checkbox`, `hl-radio`, `hl-toggle`, `hl-select`,
`hl-divider`, `hl-progress`, `hl-spinner`, `hl-tooltip`, `hl-code`, `hl-helper-text`, `hl-error-message`.

Key APIs (verify against `ajj-design/README.md` before use):
- `<hl-btn variant="default|primary|ghost" size="sm|md">` — **wraps** a native `<button>`/`<a>`; slots `prefix`/default/`suffix`.
- `<hl-card elevation="1|2|3">` — slots `header`/default.
- `<hl-input label-for="id" state="default|error|success" density="default|compact">` — slots `label`/default(input)/`unit`.
- `<hl-tag dismissible>` — JetBrains-Mono uppercase chip; slot `dismiss`.
- `<hl-label tone="default|muted|accent" for="id">`.

Note: filenames/classes are still `ds-*` / `Ds*` internally; the **custom-element tags are `hl-*`**. Use the tags.

### Token tiers (consume **alias** vars, never globals)

`global` (raw) → `alias` (semantic, e.g. `--hl-alias-action-bg-primary`, `--hl-alias-text-main`, `--hl-alias-surface-bg`, `--hl-alias-shadow-1`) → `component` (`--hl-btn-*`).

Palette: ink `#1A1A1A`, muted `#666`, bg `#F0F0EC`, surface `#FFF`, accent `#FF4F00`, error `#CC0000`, success `#1A6B1A`. Shadows are offset-only `Npx Npx 0px #000`. Radius `0`.

---

## 3. ⚠️ Blocking integration problems — resolve these first

### 3.1 Dark-mode mechanism mismatch (hard blocker)

- **Site today:** toggles a `.dark` class on `<html>` (Tailwind `darkMode: "class"`), persisted to `localStorage` via a `MutationObserver` in `src/layouts/Layout.astro`.
- **Hardline `tokens-dark.css`:** keys off `@media (prefers-color-scheme: dark)` **and** `[data-theme="dark"]` / `:root:not([data-theme="light"])`. It does **not** know about `.dark`.

These two will desync (Tailwind colors flip but hardline tokens don't, or vice-versa). **Decision required — recommend:** switch the site's manual toggle to set `data-theme="light|dark"` on `<html>`, and reconfigure Tailwind to `darkMode: ['selector', '[data-theme="dark"]']`. Then one attribute drives both systems. Update the inline theme script + `MutationObserver` (or replace with a simple attribute setter) accordingly.

### 3.2 Lit components in Astro (rendering + FOUC)

The components are client-defined custom elements with **shadow DOM + slots**. Two options:

- **(A) Add `@astrojs/lit`** integration → enables SSR/declarative shadow DOM, avoids unstyled-slot flash. Heavier; pulls in `lit` + `@webcomponents/template-shadowroot`.
- **(B) Client-only registration** — import `@ajustinjames/hardline-components` from a `<script>` in `Layout.astro`; elements upgrade on load. Simpler, but slotted content can flash unstyled pre-hydration.

**Decided: (A) `@astrojs/lit` in SSG mode** (see §7.1) — declarative shadow DOM rendered at *build* time keeps output static for Cloudflare Pages and removes FOUC. Keep `output: 'static'`; no SSR adapter.

### 3.3 Fonts not loaded

Site declares no font family (falls back to system). Hardline requires **Inter** (UI) + **JetBrains Mono** (technical). Add both (self-host via `@fontsource` preferred over Google CDN for privacy/perf, matching the site's adblocking-guide ethos). Wire into Tailwind `fontFamily` + ensure the `--hl-alias-font-*` vars resolve.

### 3.4 Accent color change

Current `primary: #FF8C00` everywhere → hardline accent `#FF4F00`. Don't keep both. Point Tailwind `primary` at the hardline accent var (see 4.1) so legacy utility classes inherit the new accent during migration.

### 3.5 Two token systems

Tailwind config (`tailwind.config.mjs`) defines its own palette; hardline ships CSS vars. **Don't run two parallel palettes.** Refactor Tailwind `theme.extend.colors` to *reference the hardline CSS vars* (e.g. `primary: 'var(--hl-alias-action-bg-primary)'`, `surface: 'var(--hl-alias-surface-bg)'`), so utility classes and `hl-*` components stay in sync from one source.

---

## 4. Migration plan (phased)

### Phase 0 — Wiring (no visual change yet)
1. `npm i @ajustinjames/hardline-tokens @ajustinjames/hardline-components` (+ `lit`, `@astrojs/lit` if option A).
2. Import `@ajustinjames/hardline-tokens/css` and `/css-dark` in `src/styles/global.css` (above Tailwind layers, or in `Layout.astro`).
3. Add Inter + JetBrains Mono (§3.3).
4. Resolve dark-mode mechanism (§3.1).
5. Register components / add Lit integration (§3.2).
6. Verify build (`npm run build`, `npm run check`).

### Phase 1 — Tokens & Tailwind reconciliation (§3.4, §3.5)
- Rewrite `tailwind.config.mjs` colors to reference hardline alias vars.
- Replace the bespoke `.scale-hover` / `.underline-hover` effects in `global.css` with hardline-consistent interactions (offset-shadow hover lift, not scale). Respect `prefers-reduced-motion` (§5.13).

### Phase 2 — Component swaps (per file)
Map current markup → hardline. Each swap also fixes the duplication noted in §5.

| Current | Replace with |
|---|---|
| `<button class="bg-primary…">` (Contact submit/reset, 404 CTA) | `<hl-btn variant="primary"><button>…</button></hl-btn>` / `variant="default"` |
| Contact `<input>`/`<textarea>` + hand-rolled label | `<hl-input label-for>` + `<hl-label>` |
| Contact `#form-feedback` div | `<hl-alert>` (success/error states) |
| Tag pills (projects.astro, BlogPostCard, MarkdownPostLayout — **3 copies**) | `<hl-tag>` via one shared `TagList.astro` wrapper |
| Project / blog / experience card `<div class="border rounded-lg shadow…">` | `<hl-card elevation>` |
| Skill card | `<hl-card>` (compact) |
| Header/Footer nav links, "Read more", project links | `<hl-link>` |
| Breadcrumb on blog posts (new) | `<hl-breadcrumb>` |

Rounded corners, blurred shadows, and pill tags all disappear — that is intended.

### Phase 3 — Polish & verify
- Visual QA light + dark on every route.
- Lighthouse / axe a11y pass.
- Confirm no `.dark`-only leftovers, no `#FF8C00` leftovers, no double padding.

---

## 5. UX / architecture findings to fix during the migration

Ordered roughly by impact.

1. **Blog doesn't scale.** `src/pages/blog.astro` hard-slices `recentPosts` to 4 and uses `import.meta.glob(... as any)`. There is no full post archive, no pagination, no tag pages. → Move to **Astro Content Collections** (`src/content/`) with a typed Zod schema; render `/blog` as full list (or paginate), add `/blog/tags/[tag]` later. Removes all the `(post: any)` casts.

2. **`MarkdownPostLayout.astro` crashes on missing image.** It does `frontmatter.image.url` and renders `<img src={frontmatter.image.url}>` unconditionally. A post without `image` frontmatter throws. → Make image optional, guard the render. Add to the collection schema as optional.

3. **Untyped frontmatter everywhere** (`post: any`, `post.frontmatter` access). → Solved by Content Collections schema (#1).

4. **Manual `sitemap.astro` is redundant & stale.** It hand-lists 3 links and omits all blog posts/projects, while `@astrojs/sitemap` already generates `sitemap-index.xml`. → Either delete the page or generate its links from the collection so it can't drift.

5. **Double / inconsistent page padding.** `Layout.astro` already wraps `<main>` in `max-w-7xl px-4… py-8`. Then `blog.astro`, `projects.astro`, `sitemap.astro` each add their *own* `max-w-4xl/2xl mx-auto px-4 py-12`. Nested max-widths + stacked padding. → Standardize a page-container pattern (one wrapper, one max-width per page-type).

6. **Tag-pill markup duplicated 3×** (projects, BlogPostCard, MarkdownPostLayout). → One shared component (becomes `<hl-tag>` wrapper in Phase 2, #Phase-2).

7. **Card markup duplicated** across projects / blog / experience / skills with slightly different classes. → Consolidate to `<hl-card>`.

8. **Experience data has placeholder names** ("Healthcare Company", "Software Company B/A"). Reads as unfinished. Also the data is hardcoded inside `Experience.astro`. → Move to `src/data/experience.ts` (typed) and fill real/intended labels. Confirm with site owner what's shareable.

9. **`duration()` date math is fragile.** Parses `"Sept 2024"` / `"Mar 2023"` with `new Date(string)` (locale-dependent; `"Sept"` is non-standard and may `NaN`). → Use explicit `{year, month}` fields or a date lib; render computed durations safely.

10. **Hero is dated / fixed-height.** `min-h-[85vh]`, a logo that scales on hover, a "Scroll down to learn more!" chevron + sentence. → Modernize: drop the literal scroll prompt or replace with a subtle affordance; ensure the section works on short viewports. Use hardline type scale.

11. **Random hover effect via `Math.random()` on the home logo** (`Header.astro` `<script>`). Gimmicky, non-deterministic, runs every load. → Remove or replace with a single consistent hover.

12. **Contact form lacks submit affordance/state.** No disabled/loading state on submit, no double-submit guard; feedback via `className` string swap. Turnstile widget renders even if key unset. → Disable button + show `<hl-spinner>` during fetch; use `<hl-alert>`; guard missing `TURNSTILE_SITE_KEY`.

13. **No `prefers-reduced-motion` handling.** Many `transition`/`scale`/`translate` hovers (Hero, cards, skill cards, scroll button). → Wrap motion in `@media (prefers-reduced-motion: no-preference)`.

14. **No Astro View Transitions.** Multi-page nav is a hard reload. → Add `<ClientRouter />` (Astro 5) for smoother nav; verify it cohabits with custom-element registration.

15. **SEO gaps.** `og:image` / `twitter:image` default to `ajlogo.svg` — many scrapers don't render SVG OG images. No JSON-LD. → Provide a PNG/JPG OG fallback (≥1200×630); add `Person` JSON-LD on home and `BlogPosting` JSON-LD on posts.

16. **A11y nits.** Theme toggle button has `aria-label` but no `aria-pressed` reflecting state. Confirm focus-visible styles survive the hardline restyle (hardline buttons key hover/active off `:has(*:focus-visible)` — good, keep slotted natives focusable). Verify color contrast of `#FF4F00` text on Paper bg meets WCAG AA (it's borderline; prefer accent for fills/borders, not body-size text).

17. **Mobile nav.** Header is fine at 2 links but has no responsive collapse; if nav grows, add a menu. Low priority now — note for later.

---

## 6. Acceptance criteria

- `npm run build`, `npm run check`, `npm run lint`, `npm test` all pass.
- Every route renders correctly in **both** light and dark, driven by a **single** theme mechanism (§3.1); no token desync.
- No remaining `#FF8C00`, no `rounded-*` on migrated surfaces, no blurred `shadow-*` on migrated surfaces.
- Blog is backed by a typed Content Collection; a post without an `image` builds and renders without error.
- Tag and card markup exist in exactly one place each.
- Inter + JetBrains Mono load; `hl-*` components render without unstyled-slot flash.
- Lighthouse a11y ≥ 95; no axe critical violations.

## 7. Decisions (resolved 2026-06-14)

1. **Lit integration → `@astrojs/lit` in SSG (static) mode.** Hosting is **Cloudflare Pages**; output must stay fully static (free tier, no Workers/SSR runtime). `@astrojs/lit` renders **declarative shadow DOM at build time**, so component styles ship inside the static HTML — no FOUC, no runtime cost, no desync vs. a Worker. Components are pure visual shells, so this is the correct fit over client-only registration. Implementer: keep `output: 'static'`; do **not** introduce an SSR adapter. (Lit client runtime still ships for element upgrade — acceptable; DSD covers the pre-JS paint.)
2. **Theme attribute → `data-theme="light|dark"` on `<html>`** drives both hardline tokens and Tailwind (`darkMode: ['selector','[data-theme="dark"]']`). No `.dark` shim unless a later third-party needs it.
3. **Look → full commitment** to the hardline industrial language (0px radii, hard offset shadows, mono fonts). No softened hybrid.
4. **Experience company names → keep generic** ("Healthcare Company", etc.). Still move the data to `src/data/experience.ts` and fix the `duration()` date parsing (§5.8–5.9); only the labels stay generic.
5. **Hardline packages → pin exact `0.0.5`** (no `^`). Pre-1.0 lockstep; bump deliberately.

## 8. New features (do after the refactor lands)

These build on the Content Collections + hardline foundation from §4. Scope them as follow-up work, not part of the core migration.

### 8.1 Blog archive + tag pages + search

The single biggest content gap (§5.1). Once posts are a typed Content Collection:
- `/blog` → full post list (paginate at ~10 with Astro `paginate()` once count warrants).
- `/blog/tags/[tag]` → dynamic route per tag; link from every `<hl-tag>`.
- **Search:** add [`pagefind`](https://pagefind.app) — builds a static index at `astro build`, zero backend. Drop a search box (`<hl-input>`) on `/blog`.
- **Effort:** M. **Files:** `src/content/`, `src/pages/blog.astro`, new `src/pages/blog/tags/[tag].astro`, `astro.config.mjs` (pagefind), Tailwind/global for results UI. **Hardline:** `hl-input`, `hl-tag`, `hl-card`, `hl-link`.

### 8.2 Per-post reading experience

Turn posts from bare markdown into a real reading surface, all via existing components:
- **Table of contents** — auto-generate from `getHeadings()`, sticky aside on `lg+`.
- **Reading progress bar** — `<hl-progress>` driven by scroll, fixed top.
- **Prev / next post** + **breadcrumb** (`<hl-breadcrumb>`) at post foot/head.
- **Copy-code button** — `<hl-btn>` + `<hl-tooltip>` injected into each `<pre>`; respect the human-written-prose policy (touches rendering only, not content).
- **Effort:** M. **Files:** `src/layouts/MarkdownPostLayout.astro`, small client script for progress/copy. **Hardline:** `hl-progress`, `hl-breadcrumb`, `hl-btn`, `hl-tooltip`, `hl-code`.

### 8.3 Dynamic OG images

Build-time per-post OG image from an industrial hardline template (offset shadow, JetBrains Mono title, accent rule). Also closes the SVG-OG SEO gap in §5.15.
- Use Astro endpoint + `satori` (+ `@resvg/resvg-js`) to emit PNG per post; reference from `MarkdownPostLayout` `og:image`/`twitter:image`.
- **Effort:** M. **Files:** new `src/pages/og/[...slug].png.ts`, `Layout.astro`/`MarkdownPostLayout.astro` meta. **Hardline:** visual template only (mirror tokens; satori can't run web components — replicate the look with inline styles/fonts).

## 9. Reference paths

- Design system: `/Users/ajames/workspace/ajustinjames/ajj-design/{README.md,AGENTS.md}`
- Tokens source: `ajj-design/packages/hardline-tokens/tokens.json`; compiled `dist/web/{tokens.css,tokens-dark.css,tokens-theme.css}`
- Component source: `ajj-design/packages/hardline-components/src/ds-*/`
- Live Storybook: https://ajustinjames.github.io/ajj-design/
- Site files touched: `astro.config.mjs`, `tailwind.config.mjs`, `src/styles/global.css`, `src/layouts/*`, `src/pages/*`, `src/components/**`, `src/data/*`.
