#!/usr/bin/env node
// Scaffolds a single-page app at /apps/<slug>/.
//
//   npm run new-app -- <slug> "<Name>" "<One-sentence description>"
//
// Creates src/apps/<slug>/{main.ts,style.css}, src/pages/apps/<slug>.astro, and an
// unlisted entry in src/data/apps.ts. See "Apps" in AGENTS.md.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [slug, name, description] = process.argv.slice(2);

function fail(message) {
	console.error(message);
	console.error('Usage: npm run new-app -- <slug> "<Name>" "<One-sentence description>"');
	process.exit(1);
}

if (!slug || !name || !description) fail("Missing arguments.");
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`Slug "${slug}" must be lowercase kebab-case.`);

const appDir = join(root, "src/apps", slug);
const pagePath = join(root, "src/pages/apps", `${slug}.astro`);
const registryPath = join(root, "src/data/apps.ts");
if (existsSync(appDir) || existsSync(pagePath)) fail(`An app called "${slug}" already exists.`);

const registry = readFileSync(registryPath, "utf8");
const marker = "\t// new-app: entries are inserted above this line";
if (!registry.includes(marker)) fail(`Couldn't find the insertion marker in ${registryPath}.`);

const quote = (text) => JSON.stringify(text);
const today = new Date().toISOString().slice(0, 10);
const entry = `\t{
\t\tslug: ${quote(slug)},
\t\tname: ${quote(name)},
\t\tdescription:
\t\t\t${quote(description)},
\t\tadded: ${quote(today)},
\t\tlisted: false,
\t},
`;

const page = `---
import AppLayout from "../../layouts/AppLayout.astro";
import { getApp } from "../../data/apps";

const app = getApp(${quote(slug)});
---

<AppLayout app={app}>
\t<main id="main-content" class="page-shell">
\t\t<header class="page-header">
\t\t\t<h1>{app.name}</h1>
\t\t\t<p class="page-deck">{app.description}</p>
\t\t</header>

\t\t<section id="app" aria-live="polite"></section>
\t</main>
</AppLayout>

<script>
\timport "../../apps/${slug}/main.ts";
</script>
`;

const main = `// Registers the hardline Web Components (<hl-btn>, <hl-select>, …) used in the page.
import "@ajustinjames/hardline-components";
import "./style.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Missing #app");

root.textContent = "It works.";
`;

const style = `/* Light and dark both work: the hardline alias tokens switch with the site theme.
   Set lightOnly: true in src/data/apps.ts if this app only supports light. */
:root {
  --paper: var(--hl-alias-surface-bg-alt, #f0f0ec);
  --ink: var(--hl-alias-text-main, #1a1a1a);
  --muted: var(--hl-alias-text-muted, #666666);
  --rule: var(--hl-alias-surface-border, #1a1a1a);
}

html {
  background: var(--paper);
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--hl-alias-font-ui, system-ui, sans-serif);
  font-size: 1rem;
  line-height: 1.55;
}

* {
  box-sizing: border-box;
}

button,
input,
select {
  font: inherit;
}

a {
  color: inherit;
}

.page-shell {
  width: min(100% - 2.5rem, 64rem);
  margin: 0 auto;
  padding: clamp(2rem, 6vw, 4.5rem) 0 4rem;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(2.25rem, 7vw, 4rem);
  line-height: 1;
  letter-spacing: -0.04em;
}

.page-deck {
  max-width: 40rem;
  color: var(--muted);
  font-size: 1.15rem;
}

@media (max-width: 42rem) {
  .page-shell {
    width: min(100% - 2rem, 64rem);
  }
}
`;

mkdirSync(appDir, { recursive: true });
writeFileSync(join(appDir, "main.ts"), main);
writeFileSync(join(appDir, "style.css"), style);
writeFileSync(pagePath, page);
writeFileSync(registryPath, registry.replace(marker, `${entry}${marker}`));

console.log(`Created /apps/${slug}/ (unlisted):
  src/apps/${slug}/main.ts
  src/apps/${slug}/style.css
  src/pages/apps/${slug}.astro
  src/data/apps.ts entry
Run \`npm run dev\` and open http://localhost:4321/apps/${slug}/`);
