import { describe, expect, it } from 'vitest';
import { projects } from '../src/data/projects';

describe('projects data', () => {
  it('has at least one project', () => {
    expect(projects.length).toBeGreaterThan(0);
  });

  it('every project has required fields', () => {
    for (const project of projects) {
      expect(project.name).toBeTruthy();
      expect(project.description).toBeTruthy();
      expect(project.technologies).toBeInstanceOf(Array);
      expect(project.technologies.length).toBeGreaterThan(0);
    }
  });

  it('optional URLs are valid when present', () => {
    for (const project of projects) {
      if (project.repoUrl) {
        expect(() => new URL(project.repoUrl!)).not.toThrow();
      }
      if (project.siteUrl) {
        expect(() => new URL(project.siteUrl!)).not.toThrow();
      }
    }
  });

  it('has no duplicate project names', () => {
    const names = projects.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
