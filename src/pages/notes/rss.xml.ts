import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { noteAnchor } from '../../utils/feed';

export async function GET(context: APIContext) {
  const notes = await getCollection('notes');

  return rss({
    title: 'Aaron James — Notes',
    description: 'Short thoughts from Aaron James — a tweet-style microblog.',
    site: context.site ?? 'https://ajustinjames.com',
    // Note links carry a #fragment; a normalized trailing slash would land
    // after the anchor (…#slug/) and break it.
    trailingSlash: false,
    items: notes
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
      .map((note) => ({
        pubDate: note.data.pubDate,
        description: note.body,
        link: `/blog#${noteAnchor(note.slug)}`,
      })),
  });
}
