import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Validates the notes microblog collection. Notes are titleless micro-posts
 * with a hard 500-character body limit enforced here so the build fails if a
 * note grows too long or is missing required frontmatter. We parse the YAML
 * frontmatter manually rather than importing astro:content (which requires a
 * full Astro build context) — same approach as blog-frontmatter.spec.ts.
 */

const NOTES_DIR = path.resolve(__dirname, '../src/content/notes');
const MAX_BODY_CHARS = 500;

function splitNote(content: string): { fm: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: content };

  const fm: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      fm[key] = value;
    }
  }
  return { fm, body: match[2].trim() };
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

describe('notes collection', () => {
  const notes = findMarkdownFiles(NOTES_DIR);

  // A single test that loops (rather than it.each) so the suite still passes
  // when the collection is empty — notes are human-written (see AI Content
  // Policy in CLAUDE.md), so none exist until one is authored.
  it('every note has valid frontmatter and a body within the limit', () => {
    for (const filePath of notes) {
      const name = path.relative(NOTES_DIR, filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { fm, body } = splitNote(content);

      // Required frontmatter: a parseable pubDate. No title allowed by design.
      expect(fm.pubDate, `${name}: missing pubDate`).toBeTruthy();
      expect(Number.isNaN(new Date(fm.pubDate).getTime()), `${name}: bad pubDate`).toBe(false);
      expect(fm.title, `${name}: notes must not have a title`).toBeUndefined();

      // Body must exist and stay within the 500-character limit.
      expect(body.length, `${name}: empty note body`).toBeGreaterThan(0);
      expect(
        body.length,
        `${name}: note body is ${body.length} chars, over the ${MAX_BODY_CHARS} limit`,
      ).toBeLessThanOrEqual(MAX_BODY_CHARS);
    }
  });
});
