# ajj-design Migration Design

**Date:** 2026-05-12  
**Scope:** Full visual rebrand of ajustinjames-v2 to use `@ajustinjames/tokens` and `@ajustinjames/components`  
**Approach:** Tokens first (Phase 1), web component swaps second (Phase 2)

---

## Goals

- Adopt ajj-design visual identity site-wide: `#FF4F00` accent, 0px radius, hard-drop shadows, Inter + JetBrains Mono fonts
- Single source of truth for design tokens (ajj-design `tokens.json` → CSS custom properties)
- Replace interactive elements with `ds-*` web components
- Keep Tailwind for layout/typography utilities; drop Tailwind custom color tokens in favor of CSS vars

---

## Prerequisites: npm Publishing Setup

Both packages must be published to npm under `@ajustinjames` scope before site integration.

**Rename packages in ajj-design repo:**
- `@ajj/tokens` → `@ajustinjames/tokens`
- `@ajj/components` → `@ajustinjames/components`
- Update `@ajustinjames/components` `package.json` dependency reference from `@ajj/tokens` to `@ajustinjames/tokens`

**Publish steps (run from ajj-design repo root):**
1. `npm login` — one-time, uses npm account that owns `@ajustinjames` org
2. `npm org create ajustinjames` — if org not yet registered (free, public)
3. `pnpm tokens:build` — regenerate CSS from `tokens.json`
4. `pnpm --filter @ajustinjames/components build` — compile Lit to `dist/`
5. `pnpm --filter @ajustinjames/tokens publish --access public`
6. `pnpm --filter @ajustinjames/components publish --access public`

Version: bump both to `0.1.0` for first real release before publishing.

No CI automation in scope — manual publish workflow.

---

## Phase 1: Token Integration

### Install

```bash
npm install @ajustinjames/tokens @ajustinjames/components
```

### Token CSS import

In `src/styles/global.css`, add at top:

```css
@import "@ajustinjames/tokens/css";
```

Dark tokens load via a second import in `global.css` wrapped in `.dark {}`:

```css
@import "@ajustinjames/tokens/css";

.dark {
  /* contents of tokens-dark.css inlined here — CSS vars that override light defaults */
}
```

Since PostCSS is not in the stack, the dark token overrides are copied inline under `.dark {}` in `global.css` rather than imported via a scoped `@import`. The existing `dark` class toggle on `<html>` in `Layout.astro` continues to drive dark mode — no change to the JS toggle logic.

### Tailwind config

Replace all hardcoded color values in `tailwind.config.mjs` with CSS var references:

```js
colors: {
  primary:   "var(--ds-global-color-accent)",       // #FF4F00
  ink:       "var(--ds-global-color-ink)",           // #1A1A1A
  muted:     "var(--ds-global-color-muted)",         // #666666
  bg:        "var(--ds-alias-surface-bg-alt)",       // #F0F0EC
  surface:   "var(--ds-alias-surface-bg)",           // #FFFFFF
  error:     "var(--ds-global-color-error)",         // #CC0000
  success:   "var(--ds-global-color-success)",       // #1A6B1A
}
```

Remove all existing custom color tokens (`lightBg`, `darkBg`, `cardLightBg`, `cardDarkBg`, `lightTextPrimary`, `lightTextSecondary`, `darkTextPrimary`, `darkTextSecondary`, `surfaceLight`, `surfaceLightHover`, `surfaceDark`, `surfaceDarkHover`, `primaryHover`, `borderLight`, `borderDark`). Update all component class references from old token names to new ones.

### Font loading

Add to `Layout.astro` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
```


### global.css cleanup

- Remove `rounded-*` from any global base styles
- Replace soft `box-shadow` values with hard-drop pattern: `2px 2px 0px #1A1A1A`
- Remove `border-radius` from base element styles

---

## Phase 2: Web Component Swaps

### Registration

In `Layout.astro` frontmatter:

```js
import '@ajustinjames/components';
```

This is a side-effect import that registers all `ds-*` custom elements globally. No `client:*` directive needed — web components are self-registering and work in static Astro output.

### Component map

| File | Elements replaced | ds-* used |
|---|---|---|
| `Contact.astro` | `<input type="text">`, `<input type="email">` | `ds-label` + `ds-input` |
| `Contact.astro` | `<textarea>` | `ds-label` + `ds-input` (ds-input explicitly styles `::slotted(textarea)`) |
| `Contact.astro` | Submit `<button>` | `ds-btn variant="primary"` |
| `Contact.astro` | Clear `<button>` | `ds-btn variant="default"` |
| `Contact.astro` | `#form-feedback` div | `ds-alert` (variant driven by success/error state) |
| `BlogPostCard.astro` | Outer card `<div>` | `ds-card interactive` |
| `BlogPostCard.astro` | Tag `<span>` elements | `ds-tag` |
| `BlogPostCard.astro` | "Read more" link | `ds-link` |
| `SkillCard.astro` | Outer `<div>` | `ds-card interactive` |
| `Header.astro` | Nav `<a>` links | `ds-link` |
| `Header.astro` | Theme toggle `<button>` | `ds-btn variant="ghost"` |

### Contact form feedback

`ds-alert` replaces the current `#form-feedback` div. The existing JS `showFeedback()` function switches to setting attributes on the `<ds-alert>` element instead of swapping class strings.

---

## Phase 3: Manual Restyling (Non-Replaced Components)

After Phases 1 and 2, do a full audit sweep:

**Per-component changes:**

| Component | Changes |
|---|---|
| `Hero.astro` | Remove `rounded-full` from social link wrappers; replace scale hover with hard-shadow hover; remove rounded from scroll button |
| `Footer.astro` | Remove any `rounded-*`; align font to Inter via token var |
| `MarkdownPostLayout.astro` | Prose color tokens → ajj-design vars; remove rounded from code blocks |
| `404.astro`, `blog.astro`, `projects.astro` | Audit for `rounded-*`, soft `shadow-*`, hardcoded colors |
| `Experience.astro` | Remove `rounded-*`, update border/shadow to ajj-design style |
| `Skills.astro` | Remove `rounded-*`, update section shadows |

**Global sweep:**  
`grep -r "rounded-" src/` and `grep -r "shadow-" src/` — evaluate every hit, remove or replace with ajj-design equivalent.

---

## Dark Mode

Existing mechanism (JS toggle on `<html class="dark">`) is unchanged. Token CSS vars update automatically when `.dark` is on `<html>` — `tokens-dark.css` vars override the light defaults. All `dark:` Tailwind color overrides are removed from components since token vars handle the switch.

---

## Out of Scope

- Blog post prose content (human-written, not touched)
- CI/CD publish automation for ajj-design
- Storybook updates in ajj-design
- New components not already in ajj-design

---

## Success Criteria

- Site uses only `@ajustinjames/tokens` CSS vars for color, shadow, spacing
- No hardcoded hex colors in Astro components
- No `rounded-*` Tailwind classes remain
- All interactive elements use `ds-*` web components per the map above
- Dark mode works correctly via token CSS vars
- Fonts load as Inter (UI) + JetBrains Mono (labels/code)
- Site builds without errors: `npm run build` passes
- Type check passes: `npm run check` passes
