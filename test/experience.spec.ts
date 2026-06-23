import { describe, expect, it } from 'vitest';
import { experience, formatDate, duration } from '../src/data/experience';

describe('experience data', () => {
  it('has at least one company', () => {
    expect(experience.length).toBeGreaterThan(0);
  });

  it('every company has required fields', () => {
    for (const company of experience) {
      expect(company.company).toBeTruthy();
      expect(company.location).toBeTruthy();
      expect(company.roles).toBeInstanceOf(Array);
      expect(company.roles.length).toBeGreaterThan(0);
    }
  });

  it('every role has required fields and valid months', () => {
    for (const company of experience) {
      for (const role of company.roles) {
        expect(role.title).toBeTruthy();
        expect(role.startYear).toBeGreaterThanOrEqual(2000);
        expect(role.startMonth).toBeGreaterThanOrEqual(1);
        expect(role.startMonth).toBeLessThanOrEqual(12);
        expect(role.details).toBeInstanceOf(Array);
        expect(role.technologies).toBeInstanceOf(Array);

        if (role.endYear !== null) {
          expect(role.endMonth).not.toBeNull();
          expect(role.endMonth!).toBeGreaterThanOrEqual(1);
          expect(role.endMonth!).toBeLessThanOrEqual(12);
        }
      }
    }
  });

  it('has no duplicate company names', () => {
    const names = experience.map((c) => c.company);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('formatDate()', () => {
  it('formats January correctly', () => {
    expect(formatDate(2024, 1)).toBe('Jan 2024');
  });

  it('formats September correctly', () => {
    expect(formatDate(2023, 9)).toBe('Sept 2023');
  });

  it('formats December correctly', () => {
    expect(formatDate(2025, 12)).toBe('Dec 2025');
  });
});

describe('duration()', () => {
  it('calculates a full year', () => {
    const result = duration({ year: 2022, month: 1 }, { year: 2023, month: 1 });
    expect(result).toBe('(1 yr)');
  });

  it('calculates months only', () => {
    const result = duration({ year: 2023, month: 3 }, { year: 2023, month: 8 });
    expect(result).toBe('(5 mos)');
  });

  it('calculates years and months', () => {
    const result = duration({ year: 2021, month: 4 }, { year: 2022, month: 7 });
    expect(result).toBe('(1 yr 3 mos)');
  });

  it('returns singular forms correctly', () => {
    const result = duration({ year: 2022, month: 1 }, { year: 2023, month: 2 });
    expect(result).toBe('(1 yr 1 mo)');
  });

  it('handles zero months within the same month', () => {
    const result = duration({ year: 2023, month: 5 }, { year: 2023, month: 5 });
    expect(result).toBe('(0 mos)');
  });

  it('handles multiple years', () => {
    const result = duration({ year: 2018, month: 7 }, { year: 2021, month: 1 });
    expect(result).toBe('(2 yrs 6 mos)');
  });

  it('handles null end (uses current date) without throwing', () => {
    // We can't assert the exact string since it depends on Date.now(),
    // but we can assert it matches the expected format
    const result = duration({ year: 2020, month: 1 }, null);
    expect(result).toMatch(/^\(\d+ yrs?( \d+ mos?)?\)$/);
  });
});
