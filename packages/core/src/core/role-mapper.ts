import { buildPermissionData } from './permission-data';
import { indexSimpleGlobs } from './simple-glob-index';
import type {
  MappedRole,
  MappedRoles,
  NormalizedWhenFn,
  PatternPermission,
  Roles
} from '../types';

export const flattenRoles = <P>(roles: Roles<P>): MappedRoles<P> => {
  const memo = Object.create(null) as MappedRoles<P>;
  const visit = (name: string, stack: Set<string>): MappedRole<P> => {
    if (memo[name]) return memo[name];
    if (stack.has(name))
      return {
        direct: new Set(),
        conditional: new Map(),
        patterns: [],
        simpleGlobs: new Map(),
        allOps: []
      } as MappedRole<P>;
    stack.add(name);
    const role = Object.prototype.hasOwnProperty.call(roles, name)
      ? roles[name]
      : undefined;
    const direct = new Set<string>();
    const conditional = new Map<string, NormalizedWhenFn<P>>();
    const patterns: PatternPermission<P>[] = [];
    let inherits: string[] | undefined;
    if (role) {
      if (role.inherits) {
        inherits = role.inherits;
        for (const parent of role.inherits) {
          const parentRole = visit(parent, stack);
          for (const op of parentRole.direct) direct.add(op);
          for (const [k, v] of parentRole.conditional) {
            const previous = conditional.get(k);
            conditional.set(k, previous ? async params => (await previous(params)) || v(params) : v);
          }
          patterns.push(...parentRole.patterns);
        }
      }
      const built = buildPermissionData(role.can);
      for (const op of built.direct) direct.add(op);
      for (const [k, v] of built.conditional) {
        const previous = conditional.get(k);
        conditional.set(k, previous ? async params => (await previous(params)) || v(params) : v);
      }
      patterns.push(...built.patterns);
    }
    stack.delete(name);
    const seen = new Set<string>();
    const unique: PatternPermission<P>[] = [];
    for (const p of patterns) {
      // A conditional grant must remain independent of another grant for the
      // same pattern. Only identical unconditional grants can be collapsed.
      if (p.when !== true) {
        unique.push(p);
        continue;
      }
      const key = JSON.stringify([p.name, p.regex.source, p.regex.flags]);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(p);
    }
    const mapped: MappedRole<P> = {
      direct,
      conditional,
      patterns: unique,
      simpleGlobs: indexSimpleGlobs(unique),
      inherits,
      allOps: Array.from(new Set([...direct, ...conditional.keys(), ...unique.map(p => p.name)]))
    };
    memo[name] = mapped;
    return mapped;
  };
  for (const name of Object.keys(roles)) {
    visit(name, new Set());
  }
  return memo;
};
