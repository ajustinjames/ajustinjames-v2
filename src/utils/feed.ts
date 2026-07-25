import type { CollectionEntry } from 'astro:content';

/**
 * Unified content stream. Normalizes the three content collections (blog posts,
 * notes, links) into a single shape sorted newest-first so the home "Latest"
 * section and the combined /feed.xml can share one source of truth.
 *
 * `getFeed()` reads the collections (Astro build context only); `mergeFeed()`
 * is the pure merge/sort core and is unit-tested in test/feed.spec.ts.
 */

export type FeedType = 'post' | 'note' | 'link';

export interface FeedEntry {
  type: FeedType;
  date: Date;
  /** Post/link title. Notes have no title. */
  title?: string;
  /** Post description or link commentary. */
  description?: string;
  /** Raw Markdown body of a note. */
  body?: string;
  /** Where the entry links: internal path (post/note) or external URL (link). */
  href: string;
  /** True for links, which point off-site. */
  external: boolean;
  /** Anchor id for a note within the /blog stream. */
  anchor?: string;
  /** Uppercase host label for a link, e.g. PAGEFIND.APP. */
  domain?: string;
  tags: string[];
  /** The note collection entry, so callers can render() its Markdown body. */
  noteEntry?: CollectionEntry<'notes'>;
}

/** Anchor id for a note is its slug (filenames are date-prefixed). */
export function noteAnchor(slug: string): string {
  return slug;
}

/** Uppercase host label for a link's URL, e.g. "PAGEFIND.APP". */
export function linkDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '').toUpperCase();
}

/** Merge and sort the three collections into one newest-first stream. */
export function mergeFeed(
  posts: CollectionEntry<'blog'>[],
  notes: CollectionEntry<'notes'>[],
  links: CollectionEntry<'links'>[],
): FeedEntry[] {
  const entries: FeedEntry[] = [
    ...posts.map(
      (post): FeedEntry => ({
        type: 'post',
        date: post.data.pubDate,
        title: post.data.title,
        description: post.data.description,
        href: `/posts/${post.id}`,
        external: false,
        tags: post.data.tags ?? [],
      }),
    ),
    ...notes.map(
      (note): FeedEntry => ({
        type: 'note',
        date: note.data.pubDate,
        body: note.body,
        anchor: noteAnchor(note.id),
        href: `/blog#${noteAnchor(note.id)}`,
        external: false,
        tags: note.data.tags ?? [],
        noteEntry: note,
      }),
    ),
    ...links.map(
      (link): FeedEntry => ({
        type: 'link',
        date: link.data.pubDate,
        title: link.data.title,
        description: link.body,
        href: link.data.url,
        external: true,
        domain: linkDomain(link.data.url),
        tags: link.data.tags ?? [],
      }),
    ),
  ];

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Fetch all three collections and return the merged, sorted stream. */
export async function getFeed(): Promise<FeedEntry[]> {
  const { getCollection } = await import('astro:content');
  const [posts, notes, links] = await Promise.all([
    getCollection('blog'),
    getCollection('notes'),
    getCollection('links'),
  ]);
  return mergeFeed(posts, notes, links);
}
