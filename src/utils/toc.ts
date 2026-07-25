import type { MarkdownHeading } from 'astro';

/**
 * A heading in the table of contents, with its depth normalised so that the
 * shallowest heading present sits at level 0.
 */
export interface TocEntry {
  slug: string;
  text: string;
  /** 0 for the shallowest heading level in the post, 1 for the next, and so on. */
  level: number;
}

interface BuildTocOptions {
  /**
   * Shallowest heading depth to include. Defaults to 1: the post title is
   * rendered by the layout rather than the Markdown body, so an `<h1>` in the
   * body is a real section heading and some posts use it that way.
   */
  minDepth?: number;
  /** Deepest heading depth to include. Defaults to 3. */
  maxDepth?: number;
}

/**
 * Turn Astro's `getHeadings()` output into a flat, indent-ready table of
 * contents. Headings outside the depth range are dropped, and headings without
 * a slug are skipped since they cannot be linked to.
 */
export function buildToc(
  headings: MarkdownHeading[],
  { minDepth = 1, maxDepth = 3 }: BuildTocOptions = {},
): TocEntry[] {
  const included = headings.filter(
    (heading) => heading.depth >= minDepth && heading.depth <= maxDepth && Boolean(heading.slug),
  );

  if (included.length === 0) return [];

  const shallowest = Math.min(...included.map((heading) => heading.depth));

  return included.map((heading) => ({
    slug: heading.slug,
    text: heading.text,
    level: heading.depth - shallowest,
  }));
}
