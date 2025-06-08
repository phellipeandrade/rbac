"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const can = (config = { logger: helpers_1.defaultLogger, enableLogger: true }) => (mappedRoles) => {
    const logger = config.logger || helpers_1.defaultLogger;
    const log = (roleName, operation, result, enabled) => {
        if (enabled && config.enableLogger) {
            logger(roleName, operation, result);
        }
        return result;
    };
    const check = async (role, operation, params, logEnabled = true) => {
        const foundedRole = mappedRoles[role];
        helpers_1.validators.role(role);
        helpers_1.validators.operation(operation);
        helpers_1.validators.foundedRole(foundedRole);
        const direct = foundedRole.can[operation];
        const regexOperation = (0, helpers_1.regexFromOperation)(operation);
        const isGlobOperation = (0, helpers_1.isGlob)(operation);
        if ((0, helpers_1.isString)(operation) && direct === true) {
            return log(role, operation, true, logEnabled);
        }
        if (regexOperation || isGlobOperation) {
            const regex = isGlobOperation
                ? (0, helpers_1.globToRegex)(operation)
                : regexOperation;
            return log(role, operation, (0, helpers_1.checkRegex)(regex, foundedRole.can), logEnabled);
        }
        const matchGlob = foundedRole.globs.find(g => g.regex.test(String(operation)));
        if (matchGlob) {
            return evaluateWhen(matchGlob.when);
        }
        if (!direct) {
            return checkInherits();
        }
        return evaluateWhen(direct);
        async function evaluateWhen(when) {
            if (when === true)
                return log(role, operation, true, logEnabled);
            if ((0, helpers_1.isPromise)(when)) {
                try {
                    const res = await when;
                    return res ? log(role, operation, Boolean(res), logEnabled) : checkInherits();
                }
                catch (_a) {
                    return log(role, operation, false, logEnabled);
                }
            }
            if ((0, helpers_1.isFunction)(when)) {
                return new Promise((resolve, reject) => {
                    when(params, (err, result) => {
                        if (err)
                            return reject(err);
                        resolve(Boolean(result));
                    });
                })
                    .then(res => (res ? log(role, operation, true, logEnabled) : checkInherits()))
                    .catch(() => log(role, operation, false, logEnabled));
            }
            return log(role, operation, false, logEnabled);
        }
        async function checkInherits() {
            if (!foundedRole.inherits)
                return log(role, operation, false, logEnabled);
            const results = await Promise.all(foundedRole.inherits.map(parent => check(parent, operation, params, false)));
            return log(role, operation, results.some(Boolean), logEnabled);
        }
    };
    return (role, operation, params) => check(role, operation, params);
};
const roleCanMap = (roleCan) => roleCan.reduce((acc, operation) => typeof operation === 'string'
    ? { ...acc, [operation]: true }
    : { ...acc, [operation.name]: operation.when }, {});
const mapRoles = (roles) => {
    helpers_1.validators.roles(roles);
    return Object.entries(roles).reduce((acc, role) => {
        const [roleName, roleValue] = role;
        const mappedCan = roleCanMap(roleValue.can);
        return {
            ...acc,
            [roleName]: {
                can: mappedCan,
                inherits: roleValue.inherits,
                globs: (0, helpers_1.globsFromFoundedRole)(mappedCan)
            }
        };
    }, {});
};
const RBAC = (config = {}) => (roles) => ({
    can: can(config)(mapRoles(roles))
});
exports.default = RBAC;
