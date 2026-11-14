import type { PatternPermission } from '../types';

export const indexSimpleGlobs = <P>(
  patterns: PatternPermission<P>[]
): Map<string, PatternPermission<P>[]> => {
  const index = new Map<string, PatternPermission<P>[]>();
  for (let i = 0; i < patterns.length; i += 1) {
    const pattern = patterns[i];
    const name = pattern.name;
    // A single final star after a colon is equivalent to a direct lookup by
    // resource prefix. Other glob forms use the generic regex fallback.
    if (
      name.endsWith('*') &&
      name.indexOf('*') === name.length - 1 &&
      name.charCodeAt(name.length - 2) === 58
    ) {
      const prefix = name.slice(0, -1);
      const existing = index.get(prefix);
      if (existing) existing.push(pattern);
      else index.set(prefix, [pattern]);
    }
  }
  return index;
};
