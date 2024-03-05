"use strict";
// Define types for your utility functions and other constructs
Object.defineProperty(exports, "__esModule", { value: true });
exports.globsFromFoundedRole = exports.checkRegex = exports.globToRegex = exports.regexFromOperation = exports.validators = exports.defaultLogger = exports.underline = exports.isString = exports.isFunction = exports.isPromise = exports.isGlob = exports.isRegex = void 0;
var is = function (value, expectedType) {
    return Object.prototype.toString.call(value) === expectedType;
};
var isRegex = function (value) {
    return value instanceof RegExp;
};
exports.isRegex = isRegex;
var isGlob = function (value) {
    return typeof value === 'string' && value.includes('*');
};
exports.isGlob = isGlob;
var isPromise = function (value) { return is(value, '[object Promise]'); };
exports.isPromise = isPromise;
var isFunction = function (value) {
    return is(value, '[object Function]');
};
exports.isFunction = isFunction;
var isString = function (value) {
    return is(value, '[object String]');
};
exports.isString = isString;
var globPatterns = {
    '*': '([^/]+)',
    '**': '(.+/)?([^/]+)',
    '**/': '(.+/)?',
};
var replaceGlobToRegex = function (glob) {
    return glob
        .replace(/\./g, '\\.')
        .replace(/\*\*$/g, '(.+)')
        .replace(/(?:\*\*\/|\*\*|\*)/g, function (str) { return globPatterns[str] || str; });
};
var joinGlobs = function (globs) {
    return '((' + globs.map(replaceGlobToRegex).join(')|(') + '))';
};
var arraySequence = function (n) {
    return Array.from({ length: n }, function () { return undefined; });
};
var underline = function () {
    return arraySequence(process.stdout.columns - 1).reduce(function (acc) { return "".concat(acc, "-"); }, '');
};
exports.underline = underline;
var defaultLogger = function (role, operation, result) {
    var formatResult = result
        ? "\u001B[1;32m".concat(result, "\u001B[1;34m")
        : "\u001B[1;31m".concat(result, "\u001B[1;34m");
    var formatRole = "\u001B[1;33m".concat(role, "\u001B[1;34m");
    var formatOperation = "\u001B[1;33m".concat(operation, "\u001B[1;34m");
    var rbacName = '\x1b[1;37mRBAC\x1b[1;34m';
    console.log('\x1b[33m%s\x1b[0m ', (0, exports.underline)()); // yellow
    console.log('\x1b[1;34m%s\x1b[0m ', " ".concat(rbacName, " ROLE: [").concat(formatRole, "] OPERATION: [").concat(formatOperation, "] PERMISSION: [").concat(formatResult, "]"));
    console.log('\x1b[33m%s\x1b[0m ', (0, exports.underline)());
};
exports.defaultLogger = defaultLogger;
exports.validators = {
    role: function (role) {
        if (!(0, exports.isString)(role)) {
            throw new TypeError('Expected first parameter to be a string : role');
        }
    },
    roles: function (roles) {
        if (typeof roles !== 'object') {
            throw new TypeError('Expected an object as input');
        }
    },
    operation: function (operation) {
        if (!(0, exports.isString)(operation) && !(0, exports.isRegex)(operation)) {
            throw new TypeError('Expected second parameter to be string or regex : operation');
        }
    },
    foundedRole: function (foundedRole) {
        if (!foundedRole) {
            throw new Error('Undefined role');
        }
    },
};
var regexFromOperation = function (value) {
    if ((0, exports.isRegex)(value))
        return value;
    try {
        var flags = value.replace(/.*\/([gimy]*)$/, '$1');
        var pattern = value.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
        return new RegExp(pattern, flags);
    }
    catch (e) {
        return null;
    }
};
exports.regexFromOperation = regexFromOperation;
var globToRegex = function (glob) {
    return new RegExp('^' +
        (Array.isArray(glob)
            ? joinGlobs(glob)
            : replaceGlobToRegex(glob)) +
        '$');
};
exports.globToRegex = globToRegex;
var checkRegex = function (regex, can) { return Object.keys(can).some(function (operation) { return regex.test(operation); }); };
exports.checkRegex = checkRegex;
var globsFromFoundedRole = function (can) {
    return Object.keys(can)
        .map(function (role) {
        return (0, exports.isGlob)(role) && {
            role: role,
            regex: (0, exports.globToRegex)(role),
            when: can[role],
        };
    })
        .filter(Boolean);
};
exports.globsFromFoundedRole = globsFromFoundedRole;
