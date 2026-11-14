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
const regexCache = new Map<string, RegExp>();
const globCache = new Map<string, RegExp>();

export const regexFromOperation = (value: string | RegExp): RegExp | null => {
  if (isRegex(value)) return value;
  const cached = regexCache.get(value);
  if (cached) return cached;
  try {
    const flags = value.replace(/.*\/([gimsuy]*)$/, '$1');
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
