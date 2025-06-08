"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const can = (config = {
    logger: helpers_1.defaultLogger,
    enableLogger: true
}) => (mappedRoles) => (role, operation, params) => new Promise((resolve, reject) => {
    const foundedRole = mappedRoles[role];
    const regexOperation = (0, helpers_1.regexFromOperation)(operation);
    const isGlobOperation = (0, helpers_1.isGlob)(operation);
    const matchOperationFromCan = foundedRole.can[operation];
    helpers_1.validators.role(role);
    helpers_1.validators.operation(operation);
    helpers_1.validators.foundedRole(foundedRole);
    const resolvePromise = (roleName, result) => {
        if (config.enableLogger) {
            (config.logger || helpers_1.defaultLogger)(roleName, operation, result);
        }
        return resolve(result);
    };
    if ((0, helpers_1.isString)(operation) && matchOperationFromCan === true) {
        return resolvePromise(role, true);
    }
    const resolveInherits = (inherits) => inherits
        ? Promise.all(inherits.map(parent => can({ enableLogger: false })(mappedRoles)(parent, operation, params)))
            .then(result => resolvePromise(role, result.includes(true)))
            .catch(() => resolvePromise(role, false))
        : resolvePromise(role, false);
    const resolveResult = (result) => result ? resolvePromise(role, Boolean(result)) : resolveInherits(foundedRole.inherits);
    const resolveWhen = (when) => {
        if (when === true) {
            return resolvePromise(role, true);
        }
        if ((0, helpers_1.isPromise)(when)) {
            return when
                .then(res => resolveResult(res))
                .catch(() => resolvePromise(role, false));
        }
        if ((0, helpers_1.isFunction)(when)) {
            return when(params, (err, result) => {
                if (err)
                    return reject(err);
                return resolveResult(result);
            });
        }
        return resolvePromise(role, false);
    };
    if (regexOperation || isGlobOperation) {
        return resolvePromise(role, (0, helpers_1.checkRegex)(isGlobOperation ? (0, helpers_1.globToRegex)(operation) : regexOperation, foundedRole.can));
    }
    if (Object.keys(foundedRole.can).some(helpers_1.isGlob)) {
        const matchOperation = (0, helpers_1.globsFromFoundedRole)(foundedRole.can).filter(x => x.regex.test(String(operation)))[0];
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
const roleCanMap = (roleCan) => roleCan.reduce((acc, operation) => typeof operation === 'string'
    ? { ...acc, [operation]: true }
    : { ...acc, [operation.name]: operation.when }, {});
const mapRoles = (roles) => {
    helpers_1.validators.roles(roles);
    return Object.entries(roles).reduce((acc, role) => {
        const [roleName, roleValue] = role;
        return {
            ...acc,
            [roleName]: {
                can: roleCanMap(roleValue.can),
                inherits: roleValue.inherits
            }
        };
    }, {});
};
const RBAC = (config = {}) => (roles) => ({
    can: can(config)(mapRoles(roles))
});
exports.default = RBAC;
