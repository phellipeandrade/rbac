import type {
  When,
  WhenCallback,
  PatternPermission,
  NormalizedWhenFn,
  Role
} from './types';

const isRegex = (value: unknown): value is RegExp => value instanceof RegExp;

export const isGlob = (value: unknown): value is string =>
  typeof value === 'string' && value.includes('*');

const globPatterns: Record<string, string> = {
  '*': '([^/]+)',
  '**': '(.+/)?([^/]+)',
  '**/': '(.+/)?'
};

const replaceGlobToRegex = (glob: string): string =>
  glob
    .replace(/\./g, '\\.')
    .replace(/\*\*$/g, '(.+)')
    .replace(/(?:\*\*\/|\*\*|\*)/g, str => globPatterns[str]);

const joinGlobs = (globs: string[]): string =>
  '(' + globs.map(replaceGlobToRegex).join('|') + ')';

export const underline = (): string =>
  '-'.repeat(Math.max((process.stdout.columns || 80) - 1, 1));

export const defaultLogger = (
  role: string,
  operation: string | RegExp,
  result: boolean
): void => {
  const fResult = result
    ? `\x1b[1;32m${result}\x1b[1;34m`
    : `\x1b[1;31m${result}\x1b[1;34m`;
  const fRole = `\x1b[1;33m${role}\x1b[1;34m`;
  const fOperation = `\x1b[1;33m${operation}\x1b[1;34m`;
  const rbacname = '\x1b[1;37mRBAC\x1b[1;34m';
  console.log('\x1b[33m%s\x1b[0m ', underline()); // yellow
  console.log(
    '\x1b[1;34m%s\x1b[0m ',
    ` ${rbacname} ROLE: [${fRole}] OPERATION: [${fOperation}] PERMISSION: [${fResult}]`
  );
  console.log('\x1b[33m%s\x1b[0m ', underline());
};

export const normalizeWhen = <P>(when: When<P> | true): NormalizedWhenFn<P> | true => {
  if (when === true) return true;
  if (when === false) return async () => false;
  if (typeof when === 'function') {
    if ((when as Function).length >= 2) {
      return async (params: P) =>
        new Promise<boolean>(resolve => {
          (when as WhenCallback<P>)(params, (err, result) => {
            if (err) return resolve(false);
            resolve(Boolean(result));
          });
        });
    }
    return async (params: P) => {
      try {
        return Boolean(await (when as any)(params));
      } catch {
        return false;
      }
    };
  }
  if (when instanceof Promise) {
    return async () => {
      try {
        return Boolean(await when);
      } catch {
        return false;
      }
    };
  }
  return async () => Boolean(when);
};

const regexCache = new Map<string, RegExp>();
const globCache = new Map<string, RegExp>();

export const regexFromOperation = (value: string | RegExp): RegExp | null => {
  if (isRegex(value)) return value;
  const cached = regexCache.get(value);
  if (cached) return cached;
  try {
    const flags = value.replace(/.*\/([gimy]*)$/, '$1');
    const pattern = value.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
    const regex = new RegExp(pattern, flags);
    regexCache.set(value, regex);
    return regex;
  } catch (e) {
    return null;
  }
};

export const globToRegex = (glob: string | string[]): RegExp => {
  if (Array.isArray(glob)) return new RegExp('^' + joinGlobs(glob) + '$');
  const cached = globCache.get(glob);
  if (cached) return cached;
  const regex = new RegExp('^' + replaceGlobToRegex(glob) + '$');
  globCache.set(glob, regex);
  return regex;
};

export const hasMatchingOperation = (
  regex: RegExp,
  names: string[]
): boolean => {
  for (const name of names) {
    regex.lastIndex = 0;
    if (regex.test(name)) return true;
  }
  return false;
};

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

export type { When, WhenCallback, PatternPermission } from './types';
