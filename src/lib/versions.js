function parts(version) {
  return String(version)
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0);
}

/** Сравнивает версии вида major.minor как числа: 6.10 > 6.9. */
export function compareVersions(a, b) {
  const [aMajor, aMinor = 0] = parts(a);
  const [bMajor, bMinor = 0] = parts(b);
  return aMajor - bMajor || aMinor - bMinor;
}

export function latestVersion(versions) {
  if (!versions.length) return null;
  return versions.reduce((max, v) => (compareVersions(v, max) > 0 ? v : max));
}
