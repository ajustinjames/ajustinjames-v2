import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apps } from '../src/data/apps';

const appDirs = readdirSync('src/apps', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe('apps', () => {
  it('finds an app.json in every app folder', () => {
    expect(apps.map((app) => app.slug).sort()).toEqual([...appDirs].sort());
  });

  it('every app has valid metadata and a page', () => {
    for (const app of apps) {
      expect(app.slug, app.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(app.name, app.slug).toBeTruthy();
      expect(app.description, app.slug).toBeTruthy();
      expect(app.added, app.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof app.listed, app.slug).toBe('boolean');
      expect(existsSync(`src/pages/apps/${app.slug}.astro`), `${app.slug} page`).toBe(true);
    }
  });

  it('every app page has an app.json', () => {
    const pages = readdirSync('src/pages/apps')
      .filter((file) => file.endsWith('.astro') && file !== 'index.astro')
      .map((file) => file.replace(/\.astro$/, ''));
    expect(pages.sort()).toEqual(apps.map((app) => app.slug).sort());
  });
});
