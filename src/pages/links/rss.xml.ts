import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const links = await getCollection('links');

  return rss({
    title: 'Aaron James — Links',
    description: 'Curated links worth reading, with a line or two on why.',
    site: context.site ?? 'https://ajustinjames.com',
    items: links
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
      .map((link) => ({
        title: link.data.title,
        pubDate: link.data.pubDate,
        description: link.body,
        link: link.data.url,
      })),
  });
}
