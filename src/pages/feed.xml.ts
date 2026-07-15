import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getFeed } from '../utils/feed';

export async function GET(context: APIContext) {
  const feed = await getFeed();

  return rss({
    title: 'Aaron James',
    description: 'Posts, notes, and links from Aaron James — one combined stream.',
    site: context.site ?? 'https://ajustinjames.com',
    // Note entries link to /blog#fragment; a normalized trailing slash would
    // land after the anchor (…#slug/) and break it.
    trailingSlash: false,
    items: feed.map((entry) => ({
      title: entry.title,
      pubDate: entry.date,
      description: entry.type === 'note' ? entry.body : entry.description,
      link: entry.href,
      categories: entry.tags,
    })),
  });
}
