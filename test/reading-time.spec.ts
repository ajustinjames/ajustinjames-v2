import { describe, expect, it } from 'vitest';
import { readingTime } from '../src/utils/reading-time';

describe('readingTime()', () => {
  it('returns 1 for empty text', () => {
    expect(readingTime('')).toBe(1);
  });

  it('returns 1 for very short text', () => {
    expect(readingTime('hello world')).toBe(1);
  });

  it('returns 1 for exactly 200 words', () => {
    const text = Array(200).fill('word').join(' ');
    expect(readingTime(text)).toBe(1);
  });

  it('returns 2 for 201 words', () => {
    const text = Array(201).fill('word').join(' ');
    expect(readingTime(text)).toBe(2);
  });

  it('returns 3 for 500 words', () => {
    const text = Array(500).fill('word').join(' ');
    expect(readingTime(text)).toBe(3);
  });

  it('handles text with extra whitespace', () => {
    const text = '  hello   world   foo  ';
    expect(readingTime(text)).toBe(1);
  });

  it('handles newlines and tabs', () => {
    const text = Array(400).fill('word').join('\n');
    expect(readingTime(text)).toBe(2);
  });
});
