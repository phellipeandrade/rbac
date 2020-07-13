(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("@rbac/rbac", [], factory);
	else if(typeof exports === 'object')
		exports["@rbac/rbac"] = factory();
	else
		root["@rbac/rbac"] = factory();
})(global, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/helpers.ts":
/*!************************!*\
  !*** ./src/helpers.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.globsFromFoundedRole = exports.checkRegex = exports.globToRegex = exports.regexFromOperation = exports.validators = exports.defaultLogger = exports.underline = exports.isString = exports.isFunction = exports.isPromise = exports.isGlob = void 0;
var is = function (value, expected) {
    return value && Object.prototype.toString.call(value) === expected;
};
var isRegex = function (value) { return value instanceof RegExp; };
exports.isGlob = function (value) { return typeof value === 'string' && value.includes('*'); };
exports.isPromise = function (value) { return is(value, '[object Promise]'); };
exports.isFunction = function (value) { return is(value, '[object Function]'); };
exports.isString = function (value) { return is(value, '[object String]'); };
var globPatterns = {
    '*': '([^/]+)',
    '**': '(.+/)?([^/]+)',
    '**/': '(.+/)?'
};
var replaceGlobToRegex = function (glob) { return glob
    .replace(/\./g, '\\.')
    .replace(/\*\*$/g, '(.+)')
    .replace(/(?:\*\*\/|\*\*|\*)/g, function (str) { return globPatterns[str]; }); };
var joinGlobs = function (globs) { return '((' + globs.map(replaceGlobToRegex).join(')|(') + '))'; };
var arraySequence = function (n) { return Array.apply(null, { length: n }); };
exports.underline = function () { return arraySequence(process.stdout.columns - 1).reduce(function (acc) { return acc + "-"; }, ''); };
exports.defaultLogger = function (role, operation, result) {
    var fResult = result ?
        "\u001B[1;32m" + result + "\u001B[1;34m" :
        "\u001B[1;31m" + result + "\u001B[1;34m";
    var fRole = "\u001B[1;33m" + role + "\u001B[1;34m";
    var fOperation = "\u001B[1;33m" + operation + "\u001B[1;34m";
    var rbacname = '\x1b[1;37mRBAC\x1b[1;34m';
    console.log('\x1b[33m%s\x1b[0m ', exports.underline()); // yellow
    console.log('\x1b[1;34m%s\x1b[0m ', " " + rbacname + " ROLE: [" + fRole + "] OPERATION: [" + fOperation + "] PERMISSION: [" + fResult + "]");
    console.log('\x1b[33m%s\x1b[0m ', exports.underline());
};
exports.validators = {
    role: function (role) {
        if (typeof role !== 'string') {
            throw new TypeError('Expected first parameter to be string : role');
        }
    },
    roles: function (roles) {
        if (typeof roles !== 'object') {
            throw new TypeError('Expected an object as input');
        }
    },
    operation: function (operation) {
        if (typeof operation !== 'string' && !isRegex(operation)) {
            throw new TypeError('Expected second parameter to be string or regex : operation');
        }
    },
    foundedRole: function (foundedRole) {
        if (!foundedRole) {
            throw new Error('Undefined role');
        }
    }
};
exports.regexFromOperation = function (value) {
    if (isRegex(value))
        return value;
    try {
        var flags = value.replace(/.*\/([gimy]*)$/, '$1');
        var pattern = value.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
        var regex = new RegExp(pattern, flags);
        return regex;
    }
    catch (e) {
        return null;
    }
};
exports.globToRegex = function (glob) {
    return new RegExp('^' + (Array.isArray(glob) ? joinGlobs : replaceGlobToRegex)(glob) + '$');
};
exports.checkRegex = function (regex, can) { return Object.keys(can)
    .some(function (operation) { return regex.test(operation); }); };
exports.globsFromFoundedRole = function (can) {
    return Object.keys(can).map(function (role) { return exports.isGlob(role) && {
        role: role,
        regex: exports.globToRegex(role),
        when: can[role]
    }; }).filter(Boolean);
};


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var rbac_1 = __importDefault(__webpack_require__(/*! ./rbac */ "./src/rbac.ts"));
exports.default = rbac_1.default;


/***/ }),

/***/ "./src/rbac.ts":
/*!*********************!*\
  !*** ./src/rbac.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = __webpack_require__(/*! ./helpers */ "./src/helpers.ts");
var can = function (config) {
    if (config === void 0) { config = {
        logger: helpers_1.defaultLogger,
        enableLogger: true
    }; }
    return function (mappedRoles) { return function (role, operation, params) {
        return new Promise(function (resolve, reject) {
            var foundedRole = mappedRoles[role];
            var regexOperation = helpers_1.regexFromOperation(operation);
            var isGlobOperation = helpers_1.isGlob(operation);
            var matchOperationFromCan = foundedRole.can[operation];
            helpers_1.validators.role(role);
            helpers_1.validators.operation(operation);
            helpers_1.validators.foundedRole(foundedRole);
            var resolvePromise = function (role, result) {
                if (config.enableLogger)
                    (config.logger || helpers_1.defaultLogger)(role, operation, result);
                return resolve(result);
            };
            if (helpers_1.isString(operation) && matchOperationFromCan === true) {
                return resolvePromise(role, true);
            }
            var resolveInherits = function (inherits) {
                return inherits ? Promise.all(inherits.map(function (parent) {
                    return can({ enableLogger: false })(mappedRoles)(parent, operation, params);
                }))
                    .then(function (result) { return resolvePromise(role, result.includes(true)); })
                    .catch(function () { return resolvePromise(role, false); }) : resolvePromise(role, false);
            };
            var resolveResult = function (result) {
                return result ? resolvePromise(role, Boolean(result)) : resolveInherits(foundedRole.inherits);
            };
            var resolveWhen = function (when) {
                if (when === true) {
                    return resolvePromise(role, true);
                }
                if (helpers_1.isPromise(when)) {
                    return when.then(function (result) { return resolveResult(result); })
                        .catch(function () { return resolvePromise(role, false); });
                }
                if (helpers_1.isFunction(when)) {
                    return when(params, function (err, result) {
                        if (err)
                            return reject(err);
                        return resolveResult(result);
                    });
                }
                return resolvePromise(role, false);
            };
            if (regexOperation || isGlobOperation) {
                return resolvePromise(role, helpers_1.checkRegex(isGlobOperation ? helpers_1.globToRegex(operation) :
                    regexOperation, foundedRole.can));
            }
            if (Object.keys(foundedRole.can).some(helpers_1.isGlob)) {
                var matchOperation = helpers_1.globsFromFoundedRole(foundedRole.can)
                    .filter(function (x) { return x.regex.test(operation); })[0];
                if (matchOperation)
                    return resolveWhen(matchOperation.when);
            }
            if (!matchOperationFromCan) {
                if (!foundedRole.inherits)
                    return resolvePromise(role, false);
                return resolveInherits(foundedRole.inherits);
            }
            return resolveWhen(matchOperationFromCan);
        });
    }; };
};
var roleCanMap = function (roleCan) {
    return roleCan.reduce(function (acc, operation) {
        var _a, _b;
        return typeof operation === 'string' ? __assign(__assign({}, acc), (_a = {}, _a[operation] = true, _a)) : __assign(__assign({}, acc), (_b = {}, _b[operation.name] = operation.when, _b));
    }, {});
};
var mapRoles = function (roles) {
    helpers_1.validators.roles(roles);
    return Object.entries(roles).reduce(function (acc, role) {
        var _a;
        var roleName = role[0], roleValue = role[1];
        return __assign(__assign({}, acc), (_a = {}, _a[roleName] = {
            can: roleCanMap(roleValue.can),
            inherits: roleValue.inherits
        }, _a));
    }, {});
};
var RBAC = function (config) { return function (roles) { return ({ can: can(config)(mapRoles(roles)) }); }; };
exports.default = RBAC;


/***/ })

/******/ });
});
//# sourceMappingURL=rbac.js.map