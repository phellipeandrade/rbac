import type { When, WhenCallback, GlobFromRole } from './types';

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


export const regexFromOperation = (value: string | RegExp): RegExp | null => {
  if (isRegex(value)) return value;
  try {
    const flags = value.replace(/.*\/([gimy]*)$/, '$1');
    const pattern = value.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
    const regex = new RegExp(pattern, flags);
    return regex;
  } catch (e) {
    return null;
  }
};

export const globToRegex = (glob: string | string[]): RegExp =>
  new RegExp('^' + (Array.isArray(glob) ? joinGlobs(glob) : replaceGlobToRegex(glob)) + '$');

export const checkRegex = (regex: RegExp, can: Record<string, unknown>): boolean =>
  Object.keys(can).some(operation => regex.test(operation));

export const globsFromFoundedRole = <P = unknown>(
  can: Record<string, When<P> | true>
): GlobFromRole<P>[] =>
  Object.entries(can)
    .filter(([name]) => isGlob(name))
    .map(([name, when]) => ({ role: name, regex: globToRegex(name), when }));

export type { When, WhenCallback, GlobFromRole } from './types';
