import { describe, expect, it } from 'vitest';
import { socialLinks } from '../src/data/social-links';

describe('social-links data', () => {
  it('has at least one social link', () => {
    expect(socialLinks.length).toBeGreaterThan(0);
  });

  it('every link has required fields', () => {
    for (const link of socialLinks) {
      expect(link.href).toBeTruthy();
      expect(link.label).toBeTruthy();
      expect(link.iconName).toBeTruthy();
    }
  });

  it('every href is a valid URL', () => {
    for (const link of socialLinks) {
      expect(() => new URL(link.href)).not.toThrow();
    }
  });

  it('has no duplicate hrefs', () => {
    const hrefs = socialLinks.map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('has no duplicate labels', () => {
    const labels = socialLinks.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
