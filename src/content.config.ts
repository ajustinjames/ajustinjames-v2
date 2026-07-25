import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pubDate: z.coerce.date(),
      description: z.string(),
      author: z.string().optional(),
      tags: z.array(z.string()).default([]),
      image: z
        .object({
          src: image(),
          alt: z.string(),
        })
        .optional(),
    }),
});

// Notes — tweet-style micro-posts. No title; the Markdown body is the note.
// The 500-character body limit is enforced in CI (test/notes.spec.ts).
const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

// Links — curated bookmarks. Body is a short (1-2 sentence) commentary.
const links = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/links' }),
  schema: z.object({
    url: z.url(),
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, notes, links };
