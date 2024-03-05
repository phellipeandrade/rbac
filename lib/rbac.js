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
var helpers_1 = require("./helpers");
var can = function (config) {
    if (config === void 0) { config = {
        logger: helpers_1.defaultLogger,
        enableLogger: true,
    }; }
    return function (mappedRoles) {
        return function (role, operation, params) {
            return new Promise(function (resolve, reject) {
                var foundedRole = mappedRoles[role];
                var regexOperation = (0, helpers_1.regexFromOperation)(operation);
                var isGlobOperation = (0, helpers_1.isGlob)(operation);
                var matchOperationFromCan = foundedRole === null || foundedRole === void 0 ? void 0 : foundedRole.can[operation];
                helpers_1.validators.role(role);
                helpers_1.validators.operation(operation);
                helpers_1.validators.foundedRole(foundedRole);
                var resolvePromise = function (role, result) {
                    if (config.enableLogger)
                        (config.logger || helpers_1.defaultLogger)(role, operation, result);
                    return resolve(result);
                };
                if ((0, helpers_1.isString)(operation) && matchOperationFromCan === true) {
                    return resolvePromise(role, true);
                }
                var resolveInherits = function (inherits) {
                    return inherits
                        ? Promise.all(inherits.map(function (parent) {
                            return can({ enableLogger: false })(mappedRoles)(parent, operation, params);
                        }))
                            .then(function (result) { return resolvePromise(role, result.includes(true)); })
                            .catch(function () { return resolvePromise(role, false); })
                        : resolvePromise(role, false);
                };
                var resolveResult = function (result) {
                    return result
                        ? resolvePromise(role, Boolean(result))
                        : resolveInherits(foundedRole.inherits);
                };
                var resolveWhen = function (when) {
                    if (when === true) {
                        return resolvePromise(role, true);
                    }
                    if ((0, helpers_1.isPromise)(when)) {
                        return when
                            .then(function (result) { return resolveResult(result); })
                            .catch(function () { return resolvePromise(role, false); });
                    }
                    if ((0, helpers_1.isFunction)(when)) {
                        return when(params, function (err, result) {
                            if (err)
                                return reject(err);
                            return resolveResult(result);
                        });
                    }
                    return resolvePromise(role, false);
                };
                if (regexOperation || isGlobOperation) {
                    return resolvePromise(role, (0, helpers_1.checkRegex)(isGlobOperation
                        ? (0, helpers_1.globToRegex)(operation)
                        : regexOperation, foundedRole.can));
                }
                if (Object.keys(foundedRole.can).some(helpers_1.isGlob)) {
                    var matchOperation = (0, helpers_1.globsFromFoundedRole)(foundedRole.can).find(function (x) {
                        return x.regex.test(operation);
                    });
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
        };
    };
};
var roleCanMap = function (roleCan) {
    return Object.entries(roleCan).map(function (_a) {
        var name = _a[0], when = _a[1];
        return { name: name, when: when };
    });
};
var mapRoles = function (roles) {
    helpers_1.validators.roles(roles);
    return Object.entries(roles).reduce(function (acc, _a) {
        var _b;
        var roleName = _a[0], roleValue = _a[1];
        return (__assign(__assign({}, acc), (_b = {}, _b[roleName] = {
            can: roleCanMap(roleValue.can),
            inherits: roleValue.inherits,
        }, _b)));
    }, {});
};
var RBAC = function (config) {
    return function (roles) { return ({
        can: can(config)(mapRoles(roles)),
    }); };
};
exports.default = RBAC;
