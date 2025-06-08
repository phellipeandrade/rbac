"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globsFromFoundedRole = exports.checkRegex = exports.globToRegex = exports.regexFromOperation = exports.validators = exports.defaultLogger = exports.underline = exports.isString = exports.isFunction = exports.isPromise = exports.isGlob = void 0;
const is = (value, expected) => !!value && Object.prototype.toString.call(value) === expected;
const isRegex = (value) => value instanceof RegExp;
const isGlob = (value) => typeof value === 'string' && value.includes('*');
exports.isGlob = isGlob;
const isPromise = (value) => is(value, '[object Promise]');
exports.isPromise = isPromise;
const isFunction = (value) => is(value, '[object Function]');
exports.isFunction = isFunction;
const isString = (value) => is(value, '[object String]');
exports.isString = isString;
const globPatterns = {
    '*': '([^/]+)',
    '**': '(.+/)?([^/]+)',
    '**/': '(.+/)?'
};
const replaceGlobToRegex = (glob) => glob
    .replace(/\./g, '\\.')
    .replace(/\*\*$/g, '(.+)')
    .replace(/(?:\*\*\/|\*\*|\*)/g, str => globPatterns[str]);
const joinGlobs = (globs) => '((' + globs.map(replaceGlobToRegex).join(')|(') + '))';
const arraySequence = (n) => Array.from({ length: n });
const underline = () => arraySequence(process.stdout.columns - 1).reduce(acc => `${acc}-`, '');
exports.underline = underline;
const defaultLogger = (role, operation, result) => {
    const fResult = result
        ? `\x1b[1;32m${result}\x1b[1;34m`
        : `\x1b[1;31m${result}\x1b[1;34m`;
    const fRole = `\x1b[1;33m${role}\x1b[1;34m`;
    const fOperation = `\x1b[1;33m${operation}\x1b[1;34m`;
    const rbacname = '\x1b[1;37mRBAC\x1b[1;34m';
    console.log('\x1b[33m%s\x1b[0m ', (0, exports.underline)()); // yellow
    console.log('\x1b[1;34m%s\x1b[0m ', ` ${rbacname} ROLE: [${fRole}] OPERATION: [${fOperation}] PERMISSION: [${fResult}]`);
    console.log('\x1b[33m%s\x1b[0m ', (0, exports.underline)());
};
exports.defaultLogger = defaultLogger;
exports.validators = {
    role: (role) => {
        if (typeof role !== 'string') {
            throw new TypeError('Expected first parameter to be string : role');
        }
    },
    roles: (roles) => {
        if (typeof roles !== 'object' || roles === null) {
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
const regexFromOperation = (value) => {
    if (isRegex(value))
        return value;
    try {
        const flags = value.replace(/.*\/([gimy]*)$/, '$1');
        const pattern = value.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
        const regex = new RegExp(pattern, flags);
        return regex;
    }
    catch (e) {
        return null;
    }
};
exports.regexFromOperation = regexFromOperation;
const globToRegex = (glob) => new RegExp('^' + (Array.isArray(glob) ? joinGlobs(glob) : replaceGlobToRegex(glob)) + '$');
exports.globToRegex = globToRegex;
const checkRegex = (regex, can) => Object.keys(can).some(operation => regex.test(operation));
exports.checkRegex = checkRegex;
const globsFromFoundedRole = (can) => Object.keys(can)
    .map(role => (0, exports.isGlob)(role) && {
    role,
    regex: (0, exports.globToRegex)(role),
    when: can[role]
})
    .filter(Boolean);
exports.globsFromFoundedRole = globsFromFoundedRole;
