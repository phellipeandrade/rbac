"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const helpers = __importStar(require("./helpers"));
const can = (config = { logger: helpers.defaultLogger, enableLogger: true }) => (mappedRoles) => {
    const logger = config.logger || helpers.defaultLogger;
    const log = (roleName, operation, result, enabled) => {
        if (enabled && config.enableLogger) {
            logger(roleName, operation, result);
        }
        return result;
    };
    const check = async (role, operation, params, logEnabled = true) => {
        const foundedRole = mappedRoles[role];
        helpers.validators.role(role);
        helpers.validators.operation(operation);
        helpers.validators.foundedRole(foundedRole);
        const direct = foundedRole.can[operation];
        const regexOperation = helpers.regexFromOperation(operation);
        const isGlobOperation = helpers.isGlob(operation);
        if (helpers.isString(operation) && direct === true) {
            return log(role, operation, true, logEnabled);
        }
        if (regexOperation || isGlobOperation) {
            const regex = isGlobOperation
                ? helpers.globToRegex(operation)
                : regexOperation;
            return log(role, operation, helpers.checkRegex(regex, foundedRole.can), logEnabled);
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
            if (helpers.isPromise(when)) {
                try {
                    const res = await when;
                    return res ? log(role, operation, Boolean(res), logEnabled) : checkInherits();
                }
                catch (_a) {
                    return log(role, operation, false, logEnabled);
                }
            }
            if (helpers.isFunction(when)) {
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
    helpers.validators.roles(roles);
    return Object.entries(roles).reduce((acc, role) => {
        const [roleName, roleValue] = role;
        const mappedCan = roleCanMap(roleValue.can);
        return {
            ...acc,
            [roleName]: {
                can: mappedCan,
                inherits: roleValue.inherits,
                globs: helpers.globsFromFoundedRole(mappedCan)
            }
        };
    }, {});
};
const RBAC = (config = {}) => (roles) => {
    let allRoles = { ...roles };
    let mappedRoles = mapRoles(allRoles);
    const checker = can(config);
    const canFn = (role, operation, params) => checker(mappedRoles)(role, operation, params);
    const updateRoles = (newRoles) => {
        allRoles = { ...allRoles, ...newRoles };
        mappedRoles = mapRoles(allRoles);
    };
    const addRole = (roleName, roleDef) => {
        allRoles = { ...allRoles, [roleName]: roleDef };
        mappedRoles = mapRoles(allRoles);
    };
    return {
        can: canFn,
        updateRoles,
        addRole
    };
};
exports.default = RBAC;
