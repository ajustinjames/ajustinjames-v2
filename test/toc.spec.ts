import { describe, expect, it } from 'vitest';
import { buildToc } from '../src/utils/toc';

describe('buildToc()', () => {
  it('returns an empty list when there are no headings', () => {
    expect(buildToc([])).toEqual([]);
  });

  it('keeps h1/h2/h3 — the layout renders the post title, not the body', () => {
    const toc = buildToc([
      { depth: 1, slug: 'section', text: 'Section' },
      { depth: 2, slug: 'intro', text: 'Intro' },
      { depth: 3, slug: 'detail', text: 'Detail' },
    ]);

    expect(toc.map((entry) => entry.slug)).toEqual(['section', 'intro', 'detail']);
    expect(toc.map((entry) => entry.level)).toEqual([0, 1, 2]);
  });

  it('drops headings deeper than h3', () => {
    const toc = buildToc([
      { depth: 2, slug: 'intro', text: 'Intro' },
      { depth: 4, slug: 'aside', text: 'Aside' },
    ]);

    expect(toc.map((entry) => entry.slug)).toEqual(['intro']);
  });

  it('normalises levels relative to the shallowest heading present', () => {
    const toc = buildToc([
      { depth: 3, slug: 'a', text: 'A' },
      { depth: 3, slug: 'b', text: 'B' },
    ]);

    expect(toc.map((entry) => entry.level)).toEqual([0, 0]);
  });

  it('indents deeper headings relative to the shallowest', () => {
    const toc = buildToc([
      { depth: 2, slug: 'a', text: 'A' },
      { depth: 3, slug: 'a1', text: 'A1' },
      { depth: 2, slug: 'b', text: 'B' },
    ]);

    expect(toc.map((entry) => entry.level)).toEqual([0, 1, 0]);
  });

  it('skips headings without a slug', () => {
    const toc = buildToc([
      { depth: 2, slug: '', text: 'Unlinkable' },
      { depth: 2, slug: 'ok', text: 'OK' },
    ]);

    expect(toc.map((entry) => entry.slug)).toEqual(['ok']);
  });

  it('honours a custom depth range', () => {
    const toc = buildToc(
      [
        { depth: 1, slug: 'title', text: 'Title' },
        { depth: 2, slug: 'intro', text: 'Intro' },
        { depth: 4, slug: 'deep', text: 'Deep' },
      ],
      { minDepth: 2, maxDepth: 4 },
    );

    expect(toc.map((entry) => entry.slug)).toEqual(['intro', 'deep']);
    expect(toc.map((entry) => entry.level)).toEqual([0, 2]);
  });

  it('preserves heading text', () => {
    const toc = buildToc([{ depth: 2, slug: 'why-astro', text: 'Why Astro?' }]);

    expect(toc[0].text).toBe('Why Astro?');
  });
});
