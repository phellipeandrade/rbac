export const isPromise = (value) =>
  value && Object.prototype.toString.call(value) === '[object Promise]';

export const isFunction = (value) =>
  value && Object.prototype.toString.call(value) === '[object Function]';

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

  try {
    console.log('\x1b[33m%s\x1b[0m ', underline()); // yellow
    console.log(
      '\x1b[1;34m%s\x1b[0m ',
      ` ${rbacname} ROLE: [${fRole}] OPERATION: [${fOperation}] PERMISSION: [${fResult}]`
    );
    console.log('\x1b[33m%s\x1b[0m ', underline());
  } catch (e) {}
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
    if (typeof operation !== 'string') {
      throw new TypeError('Expected second parameter to be string : operation');
    }
  },
  foundedRole: (foundedRole) => {
    if (!foundedRole) {
      throw new Error('Undefined role');
    }
  }
};
