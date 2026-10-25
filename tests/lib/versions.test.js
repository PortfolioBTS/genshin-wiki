import { describe, expect, it } from 'vitest';
import { compareVersions, latestVersion } from '../../src/lib/versions.js';

describe('compareVersions', () => {
  it('compares minor versions numerically', () => {
    expect(compareVersions('6.10', '6.9')).toBeGreaterThan(0);
    expect(compareVersions('5.7', '7.0')).toBeLessThan(0);
    expect(compareVersions('7.1', '7.1')).toBe(0);
  });
});

describe('latestVersion', () => {
  it('returns the highest version', () => {
    expect(latestVersion(['5.7', '7.1', '6.10', '7.0'])).toBe('7.1');
  });

  it('returns null for an empty list', () => {
    expect(latestVersion([])).toBeNull();
  });
});
