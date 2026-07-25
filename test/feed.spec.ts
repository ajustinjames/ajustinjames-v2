import { describe, expect, it } from 'vitest';
import { linkDomain, mergeFeed, noteAnchor } from '../src/utils/feed';
import type { CollectionEntry } from 'astro:content';

/**
 * Unit tests for the unified stream merge/sort. mergeFeed is pure — it takes
 * already-fetched collection entries — so it can be exercised without an Astro
 * build context. We build minimal mock entries and cast to the collection types.
 */

function post(id: string, date: string, title: string): CollectionEntry<'blog'> {
  return {
    id,
    data: { pubDate: new Date(date), title, description: `desc ${title}`, tags: ['t'] },
  } as unknown as CollectionEntry<'blog'>;
}

function note(id: string, date: string, body: string): CollectionEntry<'notes'> {
  return {
    id,
    body,
    data: { pubDate: new Date(date), tags: [] },
  } as unknown as CollectionEntry<'notes'>;
}

function link(date: string, url: string, title: string, body: string): CollectionEntry<'links'> {
  return {
    body,
    data: { pubDate: new Date(date), url, title, tags: [] },
  } as unknown as CollectionEntry<'links'>;
}

describe('linkDomain()', () => {
  it('uppercases the host and strips www.', () => {
    expect(linkDomain('https://pagefind.app/docs')).toBe('PAGEFIND.APP');
    expect(linkDomain('https://www.astro.build/')).toBe('ASTRO.BUILD');
  });
});

describe('noteAnchor()', () => {
  it('uses the slug as the anchor id', () => {
    expect(noteAnchor('2026-07-13-hello')).toBe('2026-07-13-hello');
  });
});

describe('mergeFeed()', () => {
  const posts = [post('p1', '2026-07-01', 'Post One')];
  const notes = [note('2026-07-10-n', '2026-07-10', 'a note body')];
  const links = [link('2026-07-05', 'https://astro.build', 'Astro', 'commentary')];

  it('merges all three collections', () => {
    const feed = mergeFeed(posts, notes, links);
    expect(feed).toHaveLength(3);
    expect(feed.map((e) => e.type).sort()).toEqual(['link', 'note', 'post']);
  });

  it('sorts newest first across collections', () => {
    const feed = mergeFeed(posts, notes, links);
    expect(feed.map((e) => e.type)).toEqual(['note', 'link', 'post']);
    for (let i = 1; i < feed.length; i++) {
      expect(feed[i - 1].date.getTime()).toBeGreaterThanOrEqual(feed[i].date.getTime());
    }
  });

  it('normalizes each type correctly', () => {
    const feed = mergeFeed(posts, notes, links);
    const p = feed.find((e) => e.type === 'post')!;
    const n = feed.find((e) => e.type === 'note')!;
    const l = feed.find((e) => e.type === 'link')!;

    expect(p.href).toBe('/posts/p1');
    expect(p.external).toBe(false);
    expect(p.title).toBe('Post One');

    expect(n.href).toBe('/blog#2026-07-10-n');
    expect(n.body).toBe('a note body');
    expect(n.title).toBeUndefined();

    expect(l.href).toBe('https://astro.build');
    expect(l.external).toBe(true);
    expect(l.domain).toBe('ASTRO.BUILD');
    expect(l.description).toBe('commentary');
  });

  it('returns an empty array when there is no content', () => {
    expect(mergeFeed([], [], [])).toEqual([]);
  });
});
