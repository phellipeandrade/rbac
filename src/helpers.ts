/* eslint-disable no-console */
// Define types for your utility functions and other constructs

type Predicate<T> = (value: unknown) => value is T;

const is = <T>(value: T, expectedType: string): boolean =>
  Object.prototype.toString.call(value) === expectedType;

export const isRegex: Predicate<string | RegExp> = (value): value is RegExp =>
  value instanceof RegExp;

export const isGlob: Predicate<string> = (value): value is string =>
  typeof value === 'string' && value.includes('*');

export const isPromise: Predicate<Promise<unknown>> = (
  value
): value is Promise<unknown> => is(value, '[object Promise]');

export const isFunction: Predicate<(...args: unknown[]) => unknown> = (
  value
): value is (...args: unknown[]) => unknown => is(value, '[object Function]');

export const isString: Predicate<string> = (value): value is string =>
  is(value, '[object String]');

interface GlobPatterns {
  [key: string]: string;
}

const globPatterns: GlobPatterns = {
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
  `((${globs.map(replaceGlobToRegex).join(')|(')}))`;

export const underline = (): string =>
  Array.from({ length: process.stdout.columns - 1 }, () => '-').join('');

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
  roles: (roles: Record<string, unknown>): void => {
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
  foundedRole: (foundedRole: unknown): void => {
    if (!foundedRole) {
      throw new Error('Undefined role');
    }
  },
};

export const regexFromOperation = (value: string | RegExp): RegExp | null => {
  // If the value is already a RegExp, return it directly.
  if (value instanceof RegExp) {
    return value;
  }

  // If the value is a string, process it to potentially create a RegExp.
  if (typeof value === 'string') {
    try {
      // Check if the string is in RegExp literal format, e.g., "/pattern/flags"
      if (value.startsWith('/') && value.lastIndexOf('/') > 0) {
        const lastSlashIndex = value.lastIndexOf('/');
        const pattern = value.substring(1, lastSlashIndex);
        const flags = value.substring(lastSlashIndex + 1);
        return new RegExp(pattern, flags);
      } else {
        // Treat as a regular string
        return new RegExp(value);
      }
    } catch (e) {
      console.error('Failed to create RegExp from string:', e);
      return null;
    }
  }

  // Log an error if the value is neither a string nor a RegExp
  console.error('Invalid input type for regexFromOperation:', typeof value);
  return null;
};

export const globToRegex = (glob: string | string[]): RegExp =>
  new RegExp(
    `^${
      Array.isArray(glob)
        ? joinGlobs(glob as string[])
        : replaceGlobToRegex(glob as string)
    }$`
  );

export const checkRegex = (
  regex: RegExp,
  can: Record<string, unknown>
): boolean => Object.keys(can).some(operation => regex.test(operation));

type OperationItem = {
  role: string;
  regex: RegExp;
  when: unknown;
};

export const globsFromFoundedRole = (
  can: Record<string, unknown>
): OperationItem[] =>
  Object.keys(can)
    .map(role =>
      isGlob(role) ? { role, regex: globToRegex(role), when: can[role] } : null
    )
    .filter((item): item is OperationItem => item !== null);
