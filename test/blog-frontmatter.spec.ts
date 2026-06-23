import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Validates that all real blog posts have the required frontmatter fields.
 * We parse the YAML frontmatter manually rather than importing astro:content
 * (which requires a full Astro build context).
 */

const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      fields[key] = value;
    }
  }
  return fields;
}

function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('blog post frontmatter', () => {
  const posts = findMarkdownFiles(BLOG_DIR);

  it('finds at least one blog post', () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it.each(posts.map((p) => [path.relative(BLOG_DIR, p), p]))(
    '%s has required frontmatter fields',
    (_name, filePath) => {
      const content = fs.readFileSync(filePath as string, 'utf-8');
      const fm = parseFrontmatter(content);

      expect(fm.title, 'missing title').toBeTruthy();
      expect(fm.pubDate, 'missing pubDate').toBeTruthy();
      expect(fm.description, 'missing description').toBeTruthy();

      // pubDate should be parseable as a date
      expect(Number.isNaN(new Date(fm.pubDate).getTime())).toBe(false);
    },
  );
});
