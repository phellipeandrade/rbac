const is = (value: unknown, expected: string): boolean =>
  !!value && Object.prototype.toString.call(value) === expected;

const isRegex = (value: unknown): value is RegExp => value instanceof RegExp;

export const isGlob = (value: unknown): value is string =>
  typeof value === 'string' && value.includes('*');
export const isPromise = <T = unknown>(value: unknown): value is Promise<T> =>
  is(value, '[object Promise]');
export const isFunction = (value: unknown): value is Function =>
  is(value, '[object Function]');
export const isString = (value: unknown): value is string =>
  is(value, '[object String]');

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
  '((' + globs.map(replaceGlobToRegex).join(')|(') + '))';

const arraySequence = (n: number): undefined[] =>
  Array.from({ length: n }) as undefined[];

export const underline = (): string =>
  arraySequence(process.stdout.columns - 1).reduce(acc => `${acc}-`, '');

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

export const validators = {
  role: (role: unknown): void => {
    if (typeof role !== 'string') {
      throw new TypeError('Expected first parameter to be string : role');
    }
  },
  roles: (roles: unknown): void => {
    if (typeof roles !== 'object' || roles === null) {
      throw new TypeError('Expected an object as input');
    }
  },
  operation: (operation: unknown): void => {
    if (typeof operation !== 'string' && !isRegex(operation)) {
      throw new TypeError('Expected second parameter to be string or regex : operation');
    }
  },
  foundedRole: (foundedRole: unknown): void => {
    if (!foundedRole) {
      throw new Error('Undefined role');
    }
  }
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

export interface GlobFromRole<P = unknown> {
  role: string;
  regex: RegExp;
  when: When<P> | true;
}

export const globsFromFoundedRole = <P = unknown>(can: Record<string, When<P> | true>): GlobFromRole<P>[] =>
  Object.keys(can)
    .map(role =>
      isGlob(role) && {
        role,
        regex: globToRegex(role),
        when: can[role]
      }
    )
    .filter(Boolean) as GlobFromRole<P>[];

export type WhenCallback<P = unknown> = (
  params: P,
  done: (err: unknown, result?: boolean) => void
) => void;

export type When<P = unknown> = boolean | Promise<boolean> | WhenCallback<P>;
