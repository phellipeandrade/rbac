const is = (value, expected) =>
  value && Object.prototype.toString.call(value) === expected;

const isRegex = (value) => value instanceof RegExp;

export const isGlob = (value) => typeof value === 'string' && value.includes('*');
export const isPromise = (value) => is(value, '[object Promise]');
export const isFunction = (value) => is(value, '[object Function]');
export const isString = (value) => is(value, '[object String]');

const globPatterns = {
  '*': '([^/]+)',
  '**': '(.+/)?([^/]+)',
  '**/': '(.+/)?'
};

const replaceGlobToRegex = (glob) => glob
  .replace(/\./g, '\\.')
  .replace(/\*\*$/g, '(.+)')
  .replace(/(?:\*\*\/|\*\*|\*)/g, (str) => globPatterns[str]);

const joinGlobs = (globs) => '((' + globs.map(replaceGlobToRegex).join(')|(') + '))';

export const underline = () => {
  let line = '';
  for (let i = 0; i < process.stdout.columns - 1; i++) {
    line = `${line}-`;
  }
  return line;
};

export const defaultLogger = (role, operation, result) => {
  const fResult = result ?
    `\x1b[1;32m${result}\x1b[1;34m` :
    `\x1b[1;31m${result}\x1b[1;34m`;
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
  role: (role) => {
    if (typeof role !== 'string') {
      throw new TypeError('Expected first parameter to be string : role');
    }
  },
  roles: (roles) => {
    if (typeof roles !== 'object') {
      throw new TypeError('Expected an object as input');
    }
  },
  operation: (operation) => {
    if (typeof operation !== 'string' && !isRegex(operation)) {
      throw new TypeError('Expected second parameter to be string or regex : operation');
    }
  },
  foundedRole: (foundedRole) => {
    if (!foundedRole) {
      throw new Error('Undefined role');
    }
  }
};

export const regexFromOperation = (value) => {
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

export const globToRegex = (glob) =>
  new RegExp('^' + (Array.isArray(glob) ? joinGlobs : replaceGlobToRegex)(glob) + '$');

export const checkRegex = (regex, can) => Object.keys(can)
  .some(operation => regex.test(operation));
