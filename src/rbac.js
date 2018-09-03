import {
  isFunction,
  isPromise,
  isString,
  isGlob,
  globToRegex,
  checkRegex,
  defaultLogger,
  validators,
  regexFromOperation,
  globsFromFoundedRole
} from './helpers';

const can = (
  config = {
    logger: defaultLogger,
    enableLogger: true
  }
) => mappedRoles => (role, operation, params) =>
  new Promise((resolve, reject) => {

    const foundedRole = mappedRoles[role];
    const regexOperation = regexFromOperation(operation);
    const isGlobOperation = isGlob(operation);
    const matchOperationFromCan = foundedRole.can[operation];

    validators.role(role);
    validators.operation(operation);
    validators.foundedRole(foundedRole);

    const resolvePromise = (role, result) => {
      if (config.enableLogger) (config.logger || defaultLogger)(role, operation, result);
      return resolve(result);
    };

    if (isString(operation) && matchOperationFromCan === true) {
      return resolvePromise(role, true);
    }

    const resolveInherits = inherits =>
      Promise.all(inherits.map(parent =>
        can({ enableLogger: false })(mappedRoles)(parent, operation, params)))
        .then(result => resolvePromise(role, result.includes(true)))
        .catch(() => resolvePromise(role, false));

    const resolveResult = (result) => {
      if (!result) {
        return foundedRole.inherits ?
          resolveInherits(foundedRole.inherits) : resolvePromise(role, false);
      }
      return resolvePromise(role, Boolean(result));
    };

    const resolveWhenPromise = (promise) =>
      promise.then(result => resolveResult(result))
        .catch(() => resolvePromise(role, false));

    const resolveWhenFunction = (func) =>
      func(params, (err, result) => {
        if (err) return reject(err);
        return resolveResult(result);
      });

    const resolveWhen = (when) => {
      if (!when) {
        return resolvePromise(role, false);
      }
      if (isPromise(when)) {
        return resolveWhenPromise(when);
      }
      if (isFunction(when)) {
        return resolveWhenFunction(when);
      }
      if (when === true) {
        return resolvePromise(role, true);
      }
      return resolvePromise(role, false);
    };

    if (regexOperation || isGlobOperation) {
      return resolvePromise(
        role,
        checkRegex(isGlobOperation ? globToRegex(operation) :
          regexOperation, foundedRole.can)
      );
    }

    if (Object.keys(foundedRole.can).some(isGlob)) {
      const matchOperation = globsFromFoundedRole(foundedRole.can)
        .filter(x => x.regex.test(operation))[0];
      if (matchOperation) {
        if (matchOperation.when === true) {
          return resolvePromise(role, true);
        }
        return resolveWhen(matchOperation.when);
      }
    }

    if (!matchOperationFromCan) {
      if (!foundedRole.inherits) return resolvePromise(role, false);
      return resolveInherits(foundedRole.inherits);
    }

    return resolveWhen(matchOperationFromCan);
  });

const roleCanMap = roleCan =>
  roleCan.reduce(
    (acc, operation) =>
      typeof operation === 'string' ?
        { ...acc, [operation]: true } :
        { ...acc, [operation.name]: operation.when },
    {}
  );

const mapRoles = roles => {
  validators.roles(roles);
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

const RBAC = config => roles => ({ can: can(config)(mapRoles(roles)) });

export default RBAC;
