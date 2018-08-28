import { isFunction, isPromise, defaultLogger, validators, regexFromOperation } from './helpers';

const can = (
  config = {
    logger: defaultLogger,
    enableLogger: true
  }
) => mappedRoles => (role, operation, params) =>
  new Promise((resolve, reject) => {
    const foundedRole = mappedRoles[role];
    const regexOperation = regexFromOperation(operation);
    validators.role(role);
    validators.operation(operation);
    validators.foundedRole(foundedRole);

    const resolvePromise = (role, result) => {
      if (config.enableLogger) {
        config.logger(role, operation, result);
      }
      return resolve(result);
    };

    if (foundedRole.can[operation] === 1) return resolvePromise(role, true);

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

    if (regexOperation) {
      const result = Object.keys(foundedRole.can)
        .some(operation => regexOperation.test(operation));
      return resolvePromise(role, result);
    }

    if (isPromise(foundedRole.can[operation])) {
      return foundedRole.can[operation]
        .then(result => resolveResult(result))
        .catch(() => resolvePromise(role, false));
    }

    if (isFunction(foundedRole.can[operation])) {
      return foundedRole.can[operation](params, (err, result) => {
        if (err) return reject(err);
        return resolveResult(result);
      });
    }

    if (!foundedRole.can[operation]) {
      if (!foundedRole.inherits) return resolvePromise(role, false);
      return resolveInherits(foundedRole.inherits);
    }

    return resolvePromise(role, false);
  });

const roleCanMap = roleCan =>
  roleCan.reduce(
    (acc, operation) =>
      typeof operation === 'string' ?
        { ...acc, [operation]: 1 } :
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
