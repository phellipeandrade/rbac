import { cacheGet, cacheSet, REGEX_CACHE_LIMIT, GLOB_CACHE_LIMIT } from './bounded-cache';

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
    .replace(/\\/g, '\\\\')
    .replace(/\./g, '\\.')
    .replace(/\*\*$/g, '(.+)')
    .replace(/(?:\*\*\/|\*\*|\*)/g, str => globPatterns[str]);

const joinGlobs = (globs: string[]): string =>
  '(' + globs.map(replaceGlobToRegex).join('|') + ')';
const regexCache = new Map<string, RegExp>();
const globCache = new Map<string, RegExp>();

export const regexFromOperation = (value: string | RegExp): RegExp | null => {
  if (isRegex(value)) return value;
  // Bare strings are literal operation names. Only /pattern/flags denotes regex.
  const match = /^\/(.*)\/([dgimsuvy]*)$/.exec(value);
  if (!match) return null;
  const cached = cacheGet(regexCache, value);
  if (cached) return cached;
  try {
    const regex = new RegExp(match[1], match[2]);
    cacheSet(regexCache, value, regex, REGEX_CACHE_LIMIT);
    return regex;
  } catch {
    return null;
  }
};

export const globToRegex = (glob: string | string[]): RegExp => {
  if (Array.isArray(glob)) return new RegExp('^' + joinGlobs(glob) + '$');
  const cached = cacheGet(globCache, glob);
  if (cached) return cached;
  const regex = new RegExp('^' + replaceGlobToRegex(glob) + '$');
  cacheSet(globCache, glob, regex, GLOB_CACHE_LIMIT);
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
