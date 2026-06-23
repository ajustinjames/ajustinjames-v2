import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  // [^_] excludes _template.md from the collection
  loader: glob({ base: './src/content/blog', pattern: '**/[^_]*.md' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string(),
    author: z.string().default('Aaron James'),
    image: z.object({ url: z.string(), alt: z.string() }).optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
