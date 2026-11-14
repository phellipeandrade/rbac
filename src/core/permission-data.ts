import { isGlob, regexFromOperation, globToRegex } from '../utils/patterns';
import { normalizeWhen } from '../utils/when';
import type { Role, PatternPermission, NormalizedWhenFn } from '../types';

export const buildPermissionData = <P = unknown>(
  permissions: Role<P>['can']
): {
  direct: Set<string>;
  conditional: Map<string, NormalizedWhenFn<P>>;
  patterns: PatternPermission<P>[];
  all: string[];
} => {
  const direct = new Set<string>();
  const conditional = new Map<string, NormalizedWhenFn<P>>();
  const patterns: PatternPermission<P>[] = [];
  for (const p of permissions) {
    if (typeof p === 'string') {
      const regex = regexFromOperation(p);
      if (isGlob(p)) {
        patterns.push({ name: p, regex: globToRegex(p), when: true });
      } else if (regex) {
        patterns.push({ name: p, regex, when: true });
      } else {
        direct.add(p);
      }
    } else {
      const when = normalizeWhen(p.when);
      const regex = regexFromOperation(p.name);
      if (isGlob(p.name)) {
        patterns.push({ name: p.name, regex: globToRegex(p.name), when });
      } else if (regex) {
        patterns.push({ name: p.name, regex, when });
      } else if (when === true) {
        direct.add(p.name);
      } else {
        conditional.set(p.name, when);
      }
    }
  }
  const all = Array.from(direct).concat(
    Array.from(conditional.keys()),
    patterns.map(p => p.name)
  );
  return { direct, conditional, patterns, all };
};
