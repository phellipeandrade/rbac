// Define types for your utility functions and other constructs

type Predicate<T> = (value: any) => value is T;

const is = (value: any, expectedType: string): boolean =>
  Object.prototype.toString.call(value) === expectedType;

export const isRegex: Predicate<RegExp> = (value): value is RegExp =>
  value instanceof RegExp;

export const isGlob: Predicate<string> = (value): value is string =>
  typeof value === 'string' && value.includes('*');

export const isPromise: Predicate<Promise<any>> = (
  value
): value is Promise<any> => is(value, '[object Promise]');
export const isFunction: Predicate<Function> = (value): value is Function =>
  is(value, '[object Function]');
export const isString: Predicate<string> = (value): value is string =>
  is(value, '[object String]');

const globPatterns: { [key: string]: string } = {
  '*': '([^/]+)',
  '**': '(.+/)?([^/]+)',
  '**/': '(.+/)?',
};

const replaceGlobToRegex = (glob: string): string =>
  glob
    .replace(/\./g, '\\.')
    .replace(/\*\*$/g, '(.+)')
    .replace(/(?:\*\*\/|\*\*|\*)/g, str => globPatterns[str] || str);

const joinGlobs = (globs: string[]): string =>
  '((' + globs.map(replaceGlobToRegex).join(')|(') + '))';

const arraySequence = (n: number): undefined[] =>
  Array.from({ length: n }, () => undefined);

export const underline = (): string =>
  arraySequence(process.stdout.columns - 1).reduce(acc => `${acc}-`, '');

export const defaultLogger = (
  role: string,
  operation: string,
  result: boolean
): void => {
  const formatResult = result
    ? `\x1b[1;32m${result}\x1b[1;34m`
    : `\x1b[1;31m${result}\x1b[1;34m`;
  const formatRole = `\x1b[1;33m${role}\x1b[1;34m`;
  const formatOperation = `\x1b[1;33m${operation}\x1b[1;34m`;
  const rbacName = '\x1b[1;37mRBAC\x1b[1;34m';
  console.log('\x1b[33m%s\x1b[0m ', underline()); // yellow
  console.log(
    '\x1b[1;34m%s\x1b[0m ',
    ` ${rbacName} ROLE: [${formatRole}] OPERATION: [${formatOperation}] PERMISSION: [${formatResult}]`
  );
  console.log('\x1b[33m%s\x1b[0m ', underline());
};

export const validators = {
  role: (role: string): void => {
    if (!isString(role)) {
      throw new TypeError('Expected first parameter to be a string : role');
    }
  },
  roles: (roles: object): void => {
    if (typeof roles !== 'object') {
      throw new TypeError('Expected an object as input');
    }
  },
  operation: (operation: string | RegExp): void => {
    if (!isString(operation) && !isRegex(operation)) {
      throw new TypeError(
        'Expected second parameter to be string or regex : operation'
      );
    }
  },
  foundedRole: (foundedRole: any): void => {
    if (!foundedRole) {
      throw new Error('Undefined role');
    }
  },
};

export const regexFromOperation = (value: string | RegExp): RegExp | null => {
  if (isRegex(value)) return value;
  try {
    const flags = value.replace(/.*\/([gimy]*)$/, '$1');
    const pattern = value.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
    return new RegExp(pattern, flags);
  } catch (e) {
    return null;
  }
};

export const globToRegex = (glob: string | string[]): RegExp =>
  new RegExp(
    '^' +
      (Array.isArray(glob)
        ? joinGlobs(glob as string[])
        : replaceGlobToRegex(glob as string)) +
      '$'
  );

export const checkRegex = (
  regex: RegExp,
  can: { [operation: string]: any }
): boolean => Object.keys(can).some(operation => regex.test(operation));

export const globsFromFoundedRole = (can: {
  [operation: string]: any;
}): Array<{ role: string; regex: RegExp; when: any }> =>
  Object.keys(can)
    .map(
      role =>
        isGlob(role) && {
          role,
          regex: globToRegex(role),
          when: can[role],
        }
    )
    .filter(Boolean);
