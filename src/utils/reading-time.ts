/**
 * Calculate reading time in minutes from raw text content.
 * Matches the logic previously inline in MarkdownPostLayout.astro.
 */
export function readingTime(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
